import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  template: `
  <div class="my-dialog-container py-5">
    <h2 mat-dialog-title>Delete Product</h2>
    <mat-dialog-content class="text-center mb-4">Are you sure you want to delete this product?</mat-dialog-content>
    <mat-dialog-actions class="d-flex flex-column align-items-center">
      <button class="btn btn-sm w-100" style="background-color: #8b4513; color: #fff;" mat-button [mat-dialog-close]="true">Yes</button>
      <button class="btn btn-outline-dark btn-sm mt-2 w-100" mat-button [mat-dialog-close]="false">No</button>
    </mat-dialog-actions>
</div>
  `,
})
export class ConfirmDeleteDialogComponent {
  constructor(public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>) {}
}
