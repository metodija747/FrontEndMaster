import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartProduct } from '../product';
import { AuthService } from '../auth-service.service';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddProductDialogComponent } from '../add-product-dialog/add-product-dialog.component';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit   {

  @Input() product?: CartProduct;
  comments$ = new BehaviorSubject<any[]>([]);
  @Input() showAddToCart: boolean = true;
  newComment = {
    text: '',
    rating: 0
  };
  private popStateSubscription: any;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    public dialogRef: MatDialogRef<ProductDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {
    this.product = data.product;
    this.showAddToCart = data.showAddToCart;
  }
  baseUrl = `${this.authService.baseUrl}`;
  page: number = 1;  // Add this line
  totalPages: number = 1;  // Add this line
  showComments = false;
  isLoading = false;
  invalidRating = false;
  isLoadingDelete = false;
  isLoadingSubmit = false;
  isLoadingComments: boolean = false;
  totalComments: number = 0;
  ratingCounts: any = {};
  isLoadingOnInit = false;
  isAdmin!: Observable<boolean>; // Add isAdmin Observable
  averageRating!: number;

  ngOnInit(): void {
    if (this.product) {
      this.isAdmin = this.authService.isAdmin$; // Assign isAdmin$ Observable from AuthService to isAdmin
      this.isLoadingOnInit = true;
      this.getProductComments(this.product.productId).subscribe((response: any) => {
        this.comments$.next(response.comments);
        this.totalPages = Math.max(1, response.totalPages);
        this.totalComments = response.totalComments;
        this.ratingCounts = response.ratingCounts;
        this.isLoadingOnInit = false;
        console.log(this.comments$)
      }, error => {
        this.snackBar.open('Error while fetching product comments!', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'left'
        });
        console.error('There was an error fetching product comments!', error);
        this.isLoadingOnInit = false;
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getProductComments(productId: string, page: number = 1, pageSize: number = 4): Observable<any> {


    return this.http.get(`${this.baseUrl}comments/${productId}?page=${page}&pageSize=${pageSize}`)
      .pipe(
        map((response: any) => {
          const comments = response.comments.map((comment: any) => ({...comment}));
          const totalPages = response.totalPages;
          const totalComments = response.totalComments;
          const ratingCounts = response.ratingCounts;
          return { comments, totalPages, totalComments, ratingCounts };
        })
      );
  }


  changePage(newPage: number): void {
    this.page = newPage;
    this.isLoadingComments = true;
    if (this.product) {
      this.getProductComments(this.product.productId, this.page).subscribe((response: any) => {
        this.isLoadingComments = false;
        this.comments$.next(response.comments);
        this.totalPages = Math.max(1, response.totalPages);
        console.log(this.comments$)
      }, error => {
        this.snackBar.open('Error while fetching product comments!', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'left'
        });
        this.isLoadingComments = false;
        console.error('There was an error fetching product comments!', error);
      });
    }
  }

  addComment() {
    if (this.newComment.rating === 0) {
      this.invalidRating = true;
      return;
    }
    if (this.product) {
      this.isLoadingSubmit = true;
      const idToken = this.authService.getIdToken();
      const headers = { 'Authorization': idToken };
      const commentData = {
        comment: String(this.newComment.text),
        productId: String(this.product.productId),
        rating: String(this.newComment.rating)
      };
      const addedRating = this.newComment.rating;  // Store the rating before resetting this.newComment
      this.http.post(`${this.baseUrl}comments`, commentData, {headers})
      .subscribe(
        (response: any) => {
          this.isLoadingSubmit = false;
          this.changePage(this.page);
          this.newComment = { text: '', rating: 0 };
          this.totalComments += 1;
          this.ratingCounts[addedRating] = (this.ratingCounts[addedRating] || 0) + 1;  // Use addedRating instead of this.newComment.rating
          if (this.product) {
            console.log(response.averageRating);
            this.product.AverageRating = response.averageRating;
          }
          this.cdr.detectChanges(); // Trigger change detection
          this.snackBar.open('Comment added successfully', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
            horizontalPosition: 'left'
          });
        },
        error => {
          this.isLoadingSubmit = false;
          console.error('Error while adding comment:', error);
          this.snackBar.open('Error while adding comment', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
            horizontalPosition: 'left'
          });
          if (error.status === 500) {
            this.authService.clearIdToken();
            location.reload();
          }
        }
      );
    }
  }

  deleteComment(comment: any): void {
    this.isLoadingDelete = true;
    const idToken = this.authService.getIdToken();
    const headers = { 'Authorization': idToken };
    this.http.delete(`${this.baseUrl}comments/${this.product?.productId}`, { headers })
      .subscribe(
        (response: any) => {
          this.isLoadingDelete = false;
          this.page = 1;  // Add this line
          this.changePage(this.page);
          this.totalComments -= 1;
          this.ratingCounts[comment.Rating] = (this.ratingCounts[comment.Rating] || 0) - 1;
          if (this.product) {
            console.log(response.averageRating);
            this.product.AverageRating = response.averageRating; // Assuming the response contains the new average rating
          }
          this.cdr.detectChanges(); // Trigger change detection
          this.snackBar.open('Comment deleted successfully', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
            horizontalPosition: 'left'
          });
        },
        error => {
          this.isLoadingDelete = false;
          console.error('Error while deleting comment:', error);
          this.snackBar.open('Error while deleting comment', 'Close', {
            duration: 3000,
            verticalPosition: 'bottom',
            horizontalPosition: 'left'
          });
          if (error.status === 500) {
            this.authService.clearIdToken();
            location.reload();
          }
        }
      );
  }



  addToCart(): void {
    if (this.product) {
      this.isLoading = true;
        const url = `${this.baseUrl}cart`;
        const headers = { 'Authorization': this.authService.getIdToken() };
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
                if (error.status === 500) {
                    this.authService.clearIdToken();
                    location.reload();
                }
            }
        });
    }
}

modifyProduct(): void {
  const dialogRef = this.dialog.open(AddProductDialogComponent, {
    data: { product: this.product }
  });

  dialogRef.afterClosed().subscribe(result => {
    console.log('The dialog was closed');
    // Refresh the product data here if necessary
  });
}



  getRatingCount(rating: number): number {
    return this.comments$.getValue().filter(comment => Number(comment.Rating) === rating).length;
  }
  toggleComments(): void {
    this.showComments = !this.showComments;
  }
  validateRating(): void {
    this.invalidRating = this.newComment.rating < 1 || this.newComment.rating > 5;
  }
}
