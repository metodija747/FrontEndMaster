import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Product } from '../product';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth-service.service';
import { MatDialog } from '@angular/material/dialog';
import { ProductDetailsComponent } from '../product-details/product-details.component';
import { Observable, map } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';


@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent implements OnInit  {
  @Input() product!: Product;
  averageRating = 0;
  isLoading = false;
  isAdmin: Observable<boolean>; // Add isAdmin Observable
  isDeleting = false; // Add this line at the top of your component

  constructor(private http: HttpClient, public authService: AuthService, public dialog: MatDialog, private snackBar: MatSnackBar) {
    this.isAdmin = this.authService.isAdmin$; // subscribe to the isAdmin$ observable from AuthService

  }

  ngOnInit(): void {
    this.averageRating = this.product.AverageRating;
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    this.isLoading = true; // Set isLoading to true when the method is called
    const url = 'https://8yuhxuxhob.execute-api.us-east-1.amazonaws.com/Stage/cart';  // <-- Replace with your actual API Gateway URL
    const headers = { 'Authorization': this.authService.getIdToken() };
    const body = { productId: this.product.productId, quantity: "1" };
    this.http.post(url, body, { headers }).subscribe({
      next: data => {
        console.log(data);
        this.isLoading = false; // Set isLoading to false when the request is completed
        this.snackBar.open('Product added to cart successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'left'
        });
      },
      error: error => {
        console.log('There was an error!', error);
        if (error.status === 500) {
          this.authService.clearIdToken();
          location.reload();
        }
        this.isLoading = false; // Set isLoading to false when an error occurs
        this.snackBar.open('Error while adding to cart', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'left'
        });
      }
    });
  }

  openProductDetailsDialog(): void {
    console.log(this.product);

    const dialogRef = this.dialog.open(ProductDetailsComponent, {
      data: {
        product: this.product,
        showAddToCart: true,
      }
    });
  }
  deleteProduct(): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) { // if the result is true (user clicked "Yes")
        this.isDeleting = true; // Set isDeleting to true when delete operation starts
        const url = `https://8yuhxuxhob.execute-api.us-east-1.amazonaws.com/Stage/catalog/${this.product.productId}`;
        const headers = { 'Authorization': this.authService.getIdToken() };
        this.http.delete(url, { headers }).subscribe({
          next: () => {
            this.isDeleting = false; // Set isDeleting to false when delete operation ends successfully
            this.snackBar.open('Product deleted successfully', 'Close', {
              duration: 3000,
              verticalPosition: 'bottom',
              horizontalPosition: 'left'
            });
            location.reload();
          },
          error: error => {
            this.isDeleting = false; // Set isDeleting to false when delete operation ends with an error
            console.log('There was an error!', error);
            this.snackBar.open('Error while deleting the product', 'Close', {
              duration: 3000,
              verticalPosition: 'bottom',
              horizontalPosition: 'left'
            });
          }
        });
      }
    });
  }
}
