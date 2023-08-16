import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthDialogComponent, AuthDialogState } from './auth-dialog/auth-dialog.component';
import { AuthService } from '../app/auth-service.service';
import { ProductListComponent } from './product-list-component/product-list-component.component';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { CartDialogComponent } from './cart-dialog/cart-dialog.component';
import { OrdersDialogComponentComponent } from './orders-dialog-component/orders-dialog-component.component';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddProductDialogComponent } from './add-product-dialog/add-product-dialog.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  AuthDialogState = AuthDialogState;
  @ViewChild('categoryDropdown')
  categoryDropdown!: NgbDropdown;
  idToken: string = '';
  category: string = '';
  sortBy: string = 'None';
  sortOrder: string = '';
  searchTerm: string = '';
  searchTerm$ = new Subject<string>();
  hoverCart: boolean = false;
  cartItemCount: number = 0; // Add this line


  @ViewChild(ProductListComponent) productListComponent!: ProductListComponent;
  products: any;

  ngOnInit() {
    this.searchTerm$.pipe(
      debounceTime(2500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.productListComponent.getProducts();
      this.cartSize();
    });
  }


  constructor(public dialog: MatDialog, public authService: AuthService, private http: HttpClient, private snackBar: MatSnackBar
    ) {
    this.authService.idToken$.subscribe((idToken: string) => {
      this.idToken = idToken;
    });
  }
  openDialog(state: AuthDialogState) {
    const dialogRef = this.dialog.open(AuthDialogComponent, {
      data: { state },
    });
  }

  cartSize() {
    const idToken = this.authService.getIdToken();
    const headers = { 'Authorization': idToken };
    this.http.get('https://8yuhxuxhob.execute-api.us-east-1.amazonaws.com/Stage/cart', { headers }).subscribe((data: any) => {
      const cart = data[0];
      console.log(cart)
      this.products = JSON.parse(cart.products);
      this.cartItemCount = this.products.length;
    });
  }

  openOrdersDialog() {
    this.dialog.open(OrdersDialogComponentComponent);
  }

  // ----------------------------------------------------
  openCartDialog() {
    console.log('Opening cart dialog...');
    this.dialog.open(CartDialogComponent);
  }
  signOut() {
    this.snackBar.open('Signed out successfully', 'Close', {
      duration: 3000,
      verticalPosition: 'bottom',
      horizontalPosition: 'left'
    });
    this.authService.clearIdToken();
  }

  setCategory(category: string) {
    if (this.category !== category) {
      this.category = category;
    }
  }

  setSortBy(sortBy: string) {
    if (this.sortBy !== sortBy) {
      this.sortBy = sortBy;
      if (this.sortBy === 'None') {
        this.sortOrder = '';
      } else if (!this.sortOrder) {
        this.sortOrder = 'ASC'; // default to 'ASC' when a sort field is selected
      }
    }
  }

  setSortOrder(sortOrder: string) {
    if (this.sortBy !== 'None' && this.sortOrder !== sortOrder) {
      this.sortOrder = sortOrder;
    }
  }

  openAddProductDialog(): void {
    const dialogRef = this.dialog.open(AddProductDialogComponent, {
      data: {}  // Optional data you can pass to your dialog
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
}
