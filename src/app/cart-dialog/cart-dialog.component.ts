import { Component, OnInit } from '@angular/core';
import { CartProduct, Product } from '../product';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth-service.service';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ProductDetailsComponent } from '../product-details/product-details.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, Validators } from '@angular/forms';


interface CartProductWithLoading extends CartProduct {
  isLoadingDelete?: boolean;
}
@Component({
  selector: 'app-cart-dialog',
  templateUrl: './cart-dialog.component.html',
  styleUrls: ['./cart-dialog.component.css'],
})
export class CartDialogComponent implements OnInit {
  TotalPrice: number = 0.00 as number;
  showCheckoutForm = false;
  showProductDetails = false;
  selectedProduct: CartProduct | null = null;
  showCartView = true;
  pages: number[] = [];
  currentPage: number = 1;
  comments: any[] = [];
  products: CartProductWithLoading[] = [];
  newComment = {
    text: '',
    rating: 0
  };
  checkoutForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    name: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
    surname: ['', [Validators.required, Validators.pattern('[a-zA-Z ]*')]],
    address: ['', Validators.required],
    telNumber: ['', [Validators.required, Validators.pattern('^((\\+91-?)|0)?[0-9]{9}$')]] // simple pattern for 9 digit number
  });
  isLoading = false;
  isPayLoading = false;

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar, public dialogRef: MatDialogRef<CartDialogComponent>, private http: HttpClient, public authService: AuthService, private cdr: ChangeDetectorRef, public dialog: MatDialog) {    this.authService.architecture$.subscribe(
    (architecture: string) => {
      this.currentArchitecture = architecture;
      this.chosenBaseUrl = this.currentArchitecture === 'Serverless' ? this.baseUrlServerless : this.baseUrlMicroservice;
    },
    (error: any) => {
      console.error('Error fetching architecture:', error);
    }
  ); }
  ngOnInit(): void {
    this.loadCart();
  }
  baseUrlServerless = `${this.authService.baseUrlServerless}`;
  baseUrlMicroservice = `${this.authService.baseUrlMicroservice}`;
  currentArchitecture = this.authService.getArchitecture();
  chosenBaseUrl = this.currentArchitecture === 'Serverless' ? this.baseUrlServerless : this.baseUrlMicroservice;

  openCheckoutForm() {
    this.showCheckoutForm = true;
    this.showCartView = false;
    this.showProductDetails = false;
    console.log("openCheckoutForm function called");
}

  goBackToCart(): void {
      this.showProductDetails = false;
      this.selectedProduct = null;
      this.comments = [];
      this.showCartView = true;
      this.showCheckoutForm = false;
  }

// ----------------------------------------------------------
  // NEEDED FOR FILLING DATA AND PAYING
  checkout() {
    if (this.checkoutForm.valid) {
    let url: string;
    let headers = {};
    const idToken = this.authService.getIdToken();
    if (this.currentArchitecture === 'Serverless') {
      url = `${this.chosenBaseUrl}checkout`;
      headers = { 'Authorization': `Bearer ${idToken}` };
    } else {
      url = `${this.chosenBaseUrl}orders`;
      headers = { 'Authorization': `Bearer ${idToken}` };
    }
    this.isPayLoading = true;
    const orderList = this.products.map(product => ({productName: product.productName, quantity: product.quantity}));
    const body = {
      email: this.checkoutForm.get('email')?.value,
      name: this.checkoutForm.get('name')?.value,
      surname: this.checkoutForm.get('surname')?.value,
      address: this.checkoutForm.get('address')?.value,
      telNumber: this.checkoutForm.get('telNumber')?.value,
      orderList: JSON.stringify(orderList),
      totalPrice: this.TotalPrice
    };
    this.http.post(url, body, { headers }).subscribe((response: any) => {
      // Handle the response
      console.log(response);
      this.showCheckoutForm = false;
      this.showCartView = true;
      this.snackBar.open('Payment successfully', 'Close', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'left'
      });
      this.isPayLoading = false; // End loading
      location.reload();
    }, error => {
      console.error('There was an error!', error);
      this.snackBar.open('Payment unsuccessfully', 'Close', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'left'
      });
      this.isPayLoading = false; // End loading
      if ((error.status === 403) || (error.status === 401 && this.authService.getIdToken() !== null)) {
        this.authService.clearIdToken();
        location.reload();
      }
    });
  }
}
// ----------------------------------------------------------


loadCart(page: number = 1): void {
  this.currentPage = page;
  this.isLoading = true;
  let headers = {};
  const idToken = this.authService.getIdToken();
  if (this.currentArchitecture === 'Serverless') {
    headers = { 'Authorization': `Bearer ${idToken}` };
  } else {
    headers = { 'Authorization': `Bearer ${idToken}` };
  }
  this.http.get(`${this.chosenBaseUrl}cart?page=${page}`, { headers }).subscribe((response: any) => {
  // this.http.get(`https://sjmdwpko0k.execute-api.us-east-1.amazonaws.com/Prod/cart?page=${page}`).subscribe((response: any) => {

    console.log(response);
    this.products = response.products;
    this.pages = Array.from({ length: response.totalPages }, (_, i) => i + 1);
    this.TotalPrice = Number(parseFloat(response.totalPrice).toFixed(2));
    this.getProductsDetails();
  },
  error => {
    console.error('There was an error!', error);
    this.isLoading = false;
    if ((error.status === 403) || (error.status === 401 && this.authService.getIdToken() !== null)) {
      this.authService.clearIdToken();
      location.reload();
    }
  });
}

getProductsDetails(): void {
    if (!this.products || this.products.length === 0) {
    this.isLoading = false;
    return;
  }
  this.products.forEach((product: any) => {
    // const headers = { 'Authorization': "Bearer " + this.authService.getIdToken() };
    // console.log(headers)
    let url: string;
    const idToken = this.authService.getIdToken();
    if (this.currentArchitecture === 'Serverless') {
      url = `${this.chosenBaseUrl}catalog`;
    } else {
      url = `${this.chosenBaseUrl}products`;
    }
    this.http.get(`${url}/${product.productId}`).subscribe((data: any) => {
      product.imageURL = data.imageURL;
      product.Price = data.discountPrice;
      product.productName = data.productName;
      product.totalProductPrice = parseFloat((product.quantity * product.Price).toFixed(2));
      console.log(product)
      this.isLoading = false;
    });
  });
}

updateQuantity(product: CartProduct): void {
  product.isUpdatingQuantity = true;
  let url;
  let headers = {};
  const idToken = this.authService.getIdToken();

  // Set URL based on the architecture
  if (this.currentArchitecture === 'Serverless') {
    url = `${this.chosenBaseUrl}cart`;
    headers = { 'Authorization': `Bearer ${idToken}` };
  } else {
    url = `${this.chosenBaseUrl}cart/add`;
    headers = { 'Authorization': `Bearer ${idToken}` };
  }

  // Make the API request to update the quantity
  this.http.post(url, { productId: String(product.productId), quantity: String(product.quantity) }, { headers })
    .subscribe((updatedItem: any) => {
      product.isUpdatingQuantity = false; // End loading state

      // Find the updated product in the products array
      const updatedProduct = this.products.find(p => p.productId === product.productId);
      if (updatedProduct) {
        // Fetch the updated product details (price, etc.)
        let productDetailsUrl = this.currentArchitecture === 'Serverless'
                                ? `${this.chosenBaseUrl}catalog/${updatedProduct.productId}`
                                : `${this.chosenBaseUrl}products/${updatedProduct.productId}`;

        this.http.get(productDetailsUrl).subscribe((data: any) => {
          // Ensure to use discountPrice for calculations
          updatedProduct.discountPrice = data.discountPrice; // Set the discount price from the API response
          updatedProduct.totalProductPrice = parseFloat((Number(updatedProduct.quantity) * Number(updatedProduct.discountPrice)).toFixed(2));

          // Recalculate the total price after updating the product details
          this.updateTotalPrice();
        });
      } else {
        // If the product was not found, still update the total price as a precaution
        this.updateTotalPrice();
      }

      this.cdr.detectChanges(); // Trigger change detection
    }, error => {
      console.error('There was an error!', error);
      product.isUpdatingQuantity = false; // End loading state

      // Handle authorization errors by clearing tokens and reloading
      if ((error.status === 403) || (error.status === 401 && this.authService.getIdToken() !== null)) {
        this.authService.clearIdToken();
        location.reload();
      }
    });
}

deleteProduct(productId: string): void {
  const product = this.products.find(product => product.productId === productId);
  if (product) {
    product.isLoadingDelete = true;  // Start loading
    let headers = {};
    const idToken = this.authService.getIdToken();
    if (this.currentArchitecture === 'Serverless') {
      headers = { 'Authorization': `Bearer ${idToken}` };
    } else {
      headers = { 'Authorization': `Bearer ${idToken}` };
    }
    this.http.delete(`${this.chosenBaseUrl}cart/${productId}`, { headers, observe: 'response' }).subscribe((response: any) => {
      this.products = this.products.filter((product: any) => product.productId !== productId);
      const updatedCart = response.body;
      this.TotalPrice = Number(parseFloat(updatedCart.TotalPrice).toFixed(2));;
      product.isLoadingDelete = false;  // End loading
      this.loadCart();
      this.snackBar.open('Product deleted from cart successfully', 'Close', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'left'
      });
    },
    error => {
      console.error('There was an error!', error);
      product.isLoadingDelete = false;  // End loading
      this.snackBar.open('Error while deleting product from cart', 'Close', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'left'
      });
      if ((error.status === 403) || (error.status === 401 && this.authService.getIdToken() !== null)) {
        this.authService.clearIdToken();
        location.reload();
      }
    });
  }
}

closeDialog(): void {
  this.dialogRef.close();
}

increaseQuantity(product: CartProduct): void {
  product.quantity++;
  this.updateQuantity(product);
}

isUpdatingTotalPrice(): boolean {
  return this.products.some(product => product.isUpdatingQuantity);
}

decreaseQuantity(product: CartProduct): void {
  if (product.quantity > 1) {
    product.quantity--;
    this.updateQuantity(product);
  }
}

updateTotalPrice(): void {
  this.TotalPrice = this.products.reduce((acc, product) => acc + product.totalProductPrice, 0);
  this.TotalPrice = Number(this.TotalPrice.toFixed(2));
}

}

