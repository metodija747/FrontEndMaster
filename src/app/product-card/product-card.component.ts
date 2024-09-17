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
  isAdmin: Observable<boolean>;
  isDeleting = false;

  constructor(private http: HttpClient, public authService: AuthService, public dialog: MatDialog, private snackBar: MatSnackBar) {
    this.isAdmin = this.authService.isAdmin$; // subscribe to the isAdmin$ observable from AuthService
    this.authService.architecture$.subscribe(
      (architecture: string) => {
        this.currentArchitecture = architecture;
        this.chosenBaseUrl = this.currentArchitecture === 'Serverless' ? this.baseUrlServerless : this.baseUrlMicroservice;
      },
      (error: any) => {
        console.error('Error fetching architecture:', error);
      }
    );
  }



  ngOnInit(): void {
    console.log('Current Architecture:', this.currentArchitecture);  // Debugging line
    console.log('Chosen Base URL:', this.chosenBaseUrl);  // Debugging line
    this.averageRating = this.product.AverageRating;
  }
  baseUrlServerless = `${this.authService.baseUrlServerless}`;
  baseUrlMicroservice = `${this.authService.baseUrlMicroservice}`; // Assuming you have a baseUrlMicroservice in your AuthService
  currentArchitecture = this.authService.getArchitecture();
  chosenBaseUrl = this.currentArchitecture === 'Serverless' ? this.baseUrlServerless : this.baseUrlMicroservice;

  addToCart(): void {
    if (this.product) {
      this.isLoading = true;
      let url: string;
      let headers = {};
      const idToken = this.authService.getIdToken();
      if (this.currentArchitecture === 'Serverless') {
        url = `${this.chosenBaseUrl}cart`;
        headers = { 'Authorization': `Bearer ${idToken}` };
      } else {
        url = `${this.chosenBaseUrl}cart/add`;
        headers = { 'Authorization': `Bearer ${idToken}` };
      }
        const body = { productId: this.product.productId, quantity: "1" };
        this.http.post(url, body, { headers }).subscribe({
          next: data => {
            console.log(data);
            this.isLoading = false;
            this.snackBar.open('Product added to cart successfully', 'Close', {
              duration: 3000,
              verticalPosition: 'bottom',
              horizontalPosition: 'left'
            });
          },
            error: error => {
              this.isLoading = false;
              this.snackBar.open('Error while adding to cart', 'Close', {
                duration: 3000,
                verticalPosition: 'bottom',
                horizontalPosition: 'left'
              });
                console.log('There was an error!', error);
                if ((error.status === 403) || (error.status === 401 && this.authService.getIdToken() !== null)) {
                  this.authService.clearIdToken();
                  location.reload();
                }
            }
        });
    }
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
      if (result) {
        this.isDeleting = true;
        let url: string;
        let headers = {};
        const idToken = this.authService.getIdToken();
        if (this.currentArchitecture === 'Serverless') {
          url = `${this.chosenBaseUrl}catalog/${this.product.productId}`;
          headers = { 'Authorization': `Bearer ${idToken}` };
        } else {
          url = `${this.chosenBaseUrl}products/${this.product.productId}`;
          headers = { 'Authorization': `Bearer ${idToken}` };
        }
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
