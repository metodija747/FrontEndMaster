import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthDialogComponent } from './auth-dialog/auth-dialog.component';
import { ProductCardComponent } from './product-card/product-card.component';
import { ProductListComponent } from './product-list-component/product-list-component.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CartDialogComponent } from './cart-dialog/cart-dialog.component';
import { OrdersDialogComponentComponent } from './orders-dialog-component/orders-dialog-component.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog/confirm-delete-dialog.component';
import { AddProductDialogComponent } from './add-product-dialog/add-product-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    AuthDialogComponent,
    ProductCardComponent,
    ProductListComponent,
    CartDialogComponent,
    OrdersDialogComponentComponent,
    ProductDetailsComponent,
    ConfirmDeleteDialogComponent,
    AddProductDialogComponent,
    ],

  imports: [
    BrowserModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    NgbModule,
    MatIconModule,
    MatToolbarModule,
    MatSnackBarModule,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
