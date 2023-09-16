import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Product } from '../product';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth-service.service';

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

  currentArchitecture: string | undefined;
  chosenBaseUrl: string | undefined;
  baseUrlServerless: string;
  baseUrlMicroservice: string;

  constructor(private http: HttpClient, public authService: AuthService) {
    this.baseUrlServerless = `${this.authService.baseUrlServerless}`;
    this.baseUrlMicroservice = `${this.authService.baseUrlMicroservice}`;

    // Subscribe to the architecture observable
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

    // Base URLs
    const baseUrlServerless = `${this.authService.baseUrlServerless}catalog`;
    const baseUrlMicroservice = `${this.authService.baseUrlMicroservice}products`; // Assuming you have a baseUrlMicroservice in your AuthService

    // Get the current architecture from AuthService
    const currentArchitecture = this.authService.getArchitecture();

    // Choose the base URL based on the architecture
    const chosenBaseUrl = currentArchitecture === 'Serverless' ? baseUrlServerless : baseUrlMicroservice;

    // Construct the URL with query parameters
    const url = `${chosenBaseUrl}?category=${this.category}&searchTerm=${this.searchTerm}&sortBy=${this.sortBy}&sortOrder=${this.sortOrder}&page=${page}`;

    console.log('Sending request with parameters:', {
      category: this.category,
      searchTerm: this.searchTerm,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });
    console.log(url);
    this.http.get<{ products: Product[], totalPages: number, currentRangeStart: number, currentRangeEnd: number, totalProducts: number }>(url).subscribe((response) => {
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

