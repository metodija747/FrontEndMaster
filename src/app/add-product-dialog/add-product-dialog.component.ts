// add-product-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators, FormGroup, ValidatorFn, AbstractControl } from '@angular/forms';
import { AuthService } from '../auth-service.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../product';

export interface DialogData {
  product: Product;
}
export const priceDiscountValidator: ValidatorFn = (control: AbstractControl): {[key: string]: any} | null => {
  const price = control.get('price');
  const discountPrice = control.get('discountPrice');

  return price && discountPrice && price.value < discountPrice.value ? { 'priceDiscount': true } : null;
};

@Component({
  selector: 'app-add-product-dialog',
  templateUrl: 'add-product-dialog.component.html',
  styleUrls: ['./add-product-dialog.component.css']
})
export class AddProductDialogComponent {
  baseUrlServerless = `${this.authService.baseUrlServerless}`;
  baseUrlMicroservice = `${this.authService.baseUrlMicroservice}`;
  currentArchitecture = this.authService.getArchitecture();
  chosenBaseUrl = this.currentArchitecture === 'Serverless' ? this.baseUrlServerless : this.baseUrlMicroservice;

  // Initiate addProductForm with FormBuilder
  addProductForm = this.fb.group({
    productName: ['', Validators.required],
    categoryName: ['', Validators.required],
    imageURL: ['', Validators.required],
    price: ['', Validators.required],
    description: ['', Validators.required],
    beautifulComment: ['', Validators.required],
    discountPrice: ['']
  }, { validators: priceDiscountValidator });  // Add the   custom validator here
  baseUrl = `${this.authService.baseUrlServerless}`;
  constructor(
    public dialogRef: MatDialogRef<AddProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private http: HttpClient,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder) {
  }
  isAddLoading = false;  // Declare isAddLoading

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    if (this.data?.product) {
      // Pre-fill the form with the product data
      this.addProductForm.patchValue({
        productName: this.data.product.productName,
        categoryName: this.data.product.categoryName,
        imageURL: this.data.product.imageURL,
        price: String(this.data.product.Price),
        description: this.data.product.Description,
        beautifulComment: this.data.product.beautifulComment,
        discountPrice: String(this.data.product.discountPrice)
      });
    }
  }





  addProduct(): void {
    if (this.addProductForm.valid) {
      this.isAddLoading = true;
      let url: string;
      let headers = {};
      const idToken = this.authService.getIdToken();
      if (this.currentArchitecture === 'Serverless') {
        url = `${this.chosenBaseUrl}catalog`;
        headers = { 'Authorization': `Bearer ${idToken}` };
      } else {
        url = `${this.chosenBaseUrl}products`;
        headers = { 'Authorization': `Bearer ${idToken}` };
      }
      const productData = {
        ...this.addProductForm.value,
        price: String(this.addProductForm.value.price),
        discountPrice: String(this.addProductForm.value.discountPrice),
        productId: this.data?.product?.productId
      };

      console.log(productData);
      this.http.post(url, productData, {headers})
        .subscribe(
          response => {
            this.isAddLoading = false;
            console.log(response);
            this.dialogRef.close();
            this.snackBar.open(this.data?.product ? 'Product updated successfully' : 'Product added successfully', 'Close', {
              duration: 3000,
              verticalPosition: 'bottom',
              horizontalPosition: 'left'
            });
            location.reload();
          },
          error => {
            this.isAddLoading = false;
            console.error('Error while adding/updating product:', error);
            location.reload();
            this.snackBar.open('Error while adding/updating product', 'Close', {
              duration: 3000,
              verticalPosition: 'bottom',
              horizontalPosition: 'left'
            });
            if (error.status === 403 || error.status === 401) {
              this.authService.clearIdToken();
            }
          }
        );
    }
  }
  closeDialog(): void {
    this.dialogRef.close();
  }





}
