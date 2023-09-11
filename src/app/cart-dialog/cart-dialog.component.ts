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
  TotalPrice: number = 0;
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
    telNumber: ['', [Validators.required, Validators.pattern('^((\\+91-?)|0)?[0-9]{9}$')]] // simple pattern for 10 digit number
  });
  isLoading = false;
  isPayLoading = false;

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar, public dialogRef: MatDialogRef<CartDialogComponent>, private http: HttpClient, public authService: AuthService, private cdr: ChangeDetectorRef, public dialog: MatDialog) { }
  ngOnInit(): void {
    this.loadCart();
  }
  baseUrl = `${this.authService.baseUrl}`;
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
    const idToken = this.authService.getIdToken();
    const headers = { 'Authorization': idToken };
    this.isPayLoading = true; // End loading
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
    this.http.post(`${this.baseUrl}checkout`, body, { headers }).subscribe((response: any) => {
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
      if (error.status === 403) {
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
  const idToken = this.authService.getIdToken();
  const headers = { 'Authorization': idToken };
  this.http.get(`${this.baseUrl}cart?page=${page}`, { headers }).subscribe((response: any) => {
    console.log(response);
    this.products = response.products;
    this.pages = Array.from({ length: response.totalPages }, (_, i) => i + 1);
    this.TotalPrice = response.totalPrice;
    this.getProductsDetails();
  },
  error => {
    console.error('There was an error!', error);
    this.isLoading = false;
    if (error.status === 403) {
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
    const headers = { 'Authorization': "Bearer " + this.authService.getIdToken() };
    console.log(headers)
    this.http.get(`${this.baseUrl}catalog/${product.productId}`, { headers }).subscribe((data: any) => {
      product.imageURL = data.imageURL;
      product.Price = data.Price;
      product.productName = data.productName;
      product.totalProductPrice = product.quantity * product.Price;
      console.log(product)
      this.isLoading = false;
    });
  });
}

updateQuantity(product: CartProduct): void {
  product.isUpdatingQuantity = true; // Start loading
  const idToken = this.authService.getIdToken();
  const headers = { 'Authorization': idToken };
  this.http.post(`${this.baseUrl}cart/`,
    {productId: String(product.productId), quantity: String(product.quantity) },
    { headers }).subscribe((updatedItem: any) => {
      this.TotalPrice = updatedItem.TotalPrice;
      product.isUpdatingQuantity = false; // End loading
      // Find the updated product in the products array and fetch its details
      const updatedProduct = this.products.find(p => p.productId === product.productId);
      if (updatedProduct) {
        this.http.get(`${this.baseUrl}catalog/${updatedProduct.productId}`).subscribe((data: any) => {
          updatedProduct.Price = data.Price;
          updatedProduct.totalProductPrice = Number(updatedProduct.quantity) * Number(updatedProduct.Price);
        });
      }
      this.cdr.detectChanges();
    }, error => {
      console.error('There was an error!', error);
      product.isUpdatingQuantity = false; // End loading
      if (error.status === 403) {
        this.authService.clearIdToken();
        location.reload();
      }});
}

deleteProduct(productId: string): void {
  const product = this.products.find(product => product.productId === productId);
  if (product) {
    product.isLoadingDelete = true;  // Start loading
    const idToken = this.authService.getIdToken();
    const headers = { 'Authorization': idToken };
    this.http.delete(`${this.baseUrl}cart/${productId}`, { headers, observe: 'response' }).subscribe((response: any) => {
      this.products = this.products.filter((product: any) => product.productId !== productId);
      const updatedCart = response.body;
      this.TotalPrice = updatedCart.TotalPrice;
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
      if (error.status === 403) {
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
}
