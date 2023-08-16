import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Product } from '../product';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-product-list-component',
  templateUrl: './product-list-component.component.html',
  styleUrls: ['./product-list-component.component.css']
})
export class ProductListComponent implements OnInit, OnChanges {
  @Input() category: string = '';
  @Input() sortBy: string = '';
  @Input() sortOrder: string = '';
  @Input() searchTerm: string = '';

  products: Product[] = [];
  currentPage: number = 1;
  totalPages: number = 1;  // Add this line
  isLoading: boolean = false;
  isError: boolean = false;
  currentRangeStart: number = 0;
  currentRangeEnd: number = 0;
  totalProducts: number = 0;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.getProducts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['category'] || changes['sortBy'] || changes['sortOrder']) {
      this.getProducts();
    }
  }

  public getProducts(page: number = 1): void {
    this.currentPage = page;
    this.isLoading = true;
    const url = 'https://031a-89-205-125-141.ngrok-free.app/products';

    console.log('Sending request with parameters:', {
      category: this.category,
      searchTerm: this.searchTerm,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });

    // Create HttpHeaders instance and set the custom header
    const headers = new HttpHeaders().set('ngrok-skip-browser-warning', 'yolo');

    this.http.get<{ products: Product[], totalPages: number, currentRangeStart: number, currentRangeEnd: number, totalProducts: number }>(url, {headers:headers}).subscribe((response) => {
      this.isLoading = false;
      this.currentRangeStart = response.currentRangeStart;
      this.currentRangeEnd = response.currentRangeEnd;
      this.totalProducts = response.totalProducts;
      this.products = response.products;
      this.totalPages = response.totalPages;  // Add this line
    }, (error) => {
      this.isLoading = false;
      this.isError = true;
      console.error('There was an error!', error);
    });
}
}

