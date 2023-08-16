// orders-dialog.component.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../auth-service.service';

@Component({
  selector: 'app-orders-dialog-component',
  templateUrl: './orders-dialog-component.component.html',
  styleUrls: ['./orders-dialog-component.component.css']
})
export class OrdersDialogComponentComponent implements OnInit {
  orders: any;
  page: number = 1;
  totalPages!: number;
  isLoading: boolean = false; // Add this line

  constructor(
    public dialogRef: MatDialogRef<any>,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getOrders(this.page);
  }

  getOrders(page: number): void {
    this.isLoading = true; // Add this line
    this.page = page; // Add this line
    const idToken = this.authService.getIdToken();
    const headers = { 'Authorization': idToken };
    this.http.get(` https://8yuhxuxhob.execute-api.us-east-1.amazonaws.com/Stage/getOrders?page=${page}&pageSize=5`, { headers }).subscribe((response: any) => {
      this.orders = response.orders;
      this.orders.forEach((order:any) => {
        order.isCollapsed = true;  // Add this line
        order.products = JSON.parse(order.OrderList);
      });
      this.totalPages = response.totalPages;
      this.isLoading = false; // Add this line
    }, error => {
      console.log('There was an error!', error);
      this.isLoading = false; // Add this line
    });

  }
  closeDialog(): void {
    this.dialogRef.close();
  }
}
