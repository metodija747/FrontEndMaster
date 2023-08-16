import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Product } from '../product';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth-service.service';
import { MatDialog } from '@angular/material/dialog';
import { ProductDetailsComponent } from '../product-details/product-details.component';
import { Observable, map } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';
import { AwsRum, AwsRumConfig } from 'aws-rum-web';

try {
  const config: AwsRumConfig = {
    sessionSampleRate: 1,
    guestRoleArn: "arn:aws:iam::824949725598:role/RUM-Monitor-us-east-1-824949725598-3952923912961-Unauth",
    identityPoolId: "us-east-1:19c9b4f2-ce65-4931-9e84-83c370a2b7a9",
    endpoint: "https://dataplane.rum.us-east-1.amazonaws.com",
    telemetries: ["performance","errors","http"],
    allowCookies: false,
    enableXRay: false
  };

  const APPLICATION_ID: string = '555862e6-875f-416f-8d0f-33253a025bf8';
  const APPLICATION_VERSION: string = '1.0.0';
  const APPLICATION_REGION: string = 'us-east-1';

  const awsRum: AwsRum = new AwsRum(
    APPLICATION_ID,
    APPLICATION_VERSION,
    APPLICATION_REGION,
    config
  );
} catch (error) {
  console.error("RUM Initialization Error!:", error);
}

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
