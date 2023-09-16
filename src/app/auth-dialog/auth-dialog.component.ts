import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth-service.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export enum AuthDialogState {
  SignIn,
  SignUp,
  ForgotPassword,
  ConfirmForgotPassword,
  DeleteAccount
}

export interface DialogData {
  state: AuthDialogState;
}

@Component({
  selector: 'app-auth-dialog',
  templateUrl: './auth-dialog.component.html',
  styleUrls: ['./auth-dialog.component.css']
})
export class AuthDialogComponent implements OnInit {
  private _state!: AuthDialogState;
  repeatPassword: string = '';
  get state(): AuthDialogState {
    return this._state;
  }
  set state(value: AuthDialogState) {
    this._state = value;
    this.clearErrorAndValidationMessages();
  }
  AuthDialogState = AuthDialogState;
  email: string = '';
  password: string = '';
  confirmationCode: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  isSuccess: boolean = false;
  showPassword = false;
  showPassword2 = false;
  showPassword3 = false;


  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<AuthDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private authService: AuthService, // inject the AuthService,
    private snackBar: MatSnackBar

  ) {}
  ngOnInit() {
    this.state = this.data.state;
  }
  baseUrl = `${this.authService.baseUrlServerless}`;
  onSignIn() {
    if (!this.email || !this.password || !this.isValidUsername(this.email) || !this.isValidPassword(this.password)) {
      this.errorMessage = 'Invalid email';
      return;
    }
    this.isLoading = true;
    this.http.post<any>(`${this.baseUrl}sign-in`, {
      email: this.email,
      password: this.password
    }).pipe(
      catchError(error => {
        console.error('There was an error during the sign in process', error);
        this.errorMessage = error.error;
        this.isLoading = false;
        return throwError(error);
      })
      ).subscribe((response: { idToken: string, isAdmin: boolean }) => {
        console.log(response);
        this.errorMessage = '';
        this.authService.setIdToken(response.idToken);
        this.authService.setIsAdmin(response.isAdmin);
        this.isLoading = false;
        this.snackBar.open('Signed in successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'left'
        });
        setTimeout(() => {
          this.dialogRef.close();
        }, 500);
      });
  }

  onSignUp() {
    const emailValidation = this.isValidUsername(this.email);
    const passwordValidation = this.isValidPassword(this.password);

    if (!emailValidation) {
      this.errorMessage = 'Invalid email address.';
      return;
    }

    if (!passwordValidation.valid) {
      this.errorMessage = 'Password does not meet the following requirements:\n';
      if (passwordValidation.errors) {
        this.errorMessage += passwordValidation.errors.join('\n');
      }
      return;
    }
    if (!this.passwordsMatch()) {
      this.errorMessage = 'Passwords are not the same.';
      return;
    }

    this.isLoading = true;
    this.http.post(`${this.baseUrl}sign-up`, {
      email: this.email,
      password: this.password
    }).pipe(
      catchError(error => {
        console.error('There was an error during the sign up process', error);
        this.errorMessage = error.error; // Set the error message
        this.isLoading = false;
        return throwError(error);
      })
    ).subscribe(response => {
      console.log(response);
      this.isLoading = false;
      this.errorMessage = ''; // Clear the error message on success
      this.snackBar.open('Signed up successfully', 'Close', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'left'
      });
      setTimeout(() => {
        this.dialogRef.close();
      }, 500);
    });
  }


  onForgotPassword(event: Event) {
    if (!this.isValidUsername(this.email)) {
      this.errorMessage = 'Please insert valid email.';
      return;
    }
    event.preventDefault();
    this.isLoading = true;
    this.http.post(`${this.baseUrl}forgot-password`, {
      email: this.email
    }).pipe(
      catchError(error => {
        console.error('There was an error during the forgot password process', error);
        this.errorMessage = error.error; // Set the error message
        this.isLoading = false;
        return throwError(error);
      })
    ).subscribe(response => {
      console.log(response);
      this.snackBar.open('Confirmation code sent!', 'Close', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'left'
      });
      this.state = AuthDialogState.ConfirmForgotPassword;
      this.isLoading = false;
      this.errorMessage = ''; // Clear the error message on success
    });
  }

  onConfirmForgotPassword() {
    this.isLoading = true;
    this.http.post(`${this.baseUrl}confirm-forgot-password`, {
      email: this.email,
      confirmationCode: this.confirmationCode,
      newPassword: this.password
    }).pipe(
      catchError(error => {
        console.error('There was an error during the confirm forgot password process', error);
        this.isLoading = false;
        this.errorMessage = error.error; // Set the error message
        return throwError(error);
      })
    ).subscribe(response => {
      console.log(response);
      this.isLoading = false;
      this.snackBar.open('Password changed successfully', 'Close', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'left'
      });
      setTimeout(() => {
        this.dialogRef.close();
      }, 500);
      this.errorMessage = ''; // Clear the error message on success
    });
  }
  onDeleteAccount() {
    if (!this.isValidUsername(this.email)) {
      this.errorMessage = 'Please insert valid email.';
      return;
    }
    this.isLoading = true;
    const headers = new HttpHeaders().set('Authorization', this.authService.getIdToken());
    this.http.delete(`${this.baseUrl}users/${this.email}`, { headers, observe: 'response' }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('There was an error during the delete account process', error);
        if (error.status === 400 && error.error.includes('Failed to delete user because it does not exist.')) {
          this.isLoading = false;
          this.errorMessage = 'Failed to delete user because it does not exist.';
        } else {
          this.isLoading = false;
          this.errorMessage = error.error; // Set the error message
        }
        return throwError(error);
      })
    ).subscribe((response: HttpResponse<any>) => {
      console.log(response);
      if (response.status === 200) {
        this.errorMessage = ''; // Clear the error message on success
        this.successMessage = 'User deleted successfully'; // Set the success message
        this.isLoading = false;
        this.authService.clearIdToken();
        this.snackBar.open('Account deleted successfully', 'Close', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'left'
        });
        setTimeout(() => {
          this.dialogRef.close();
        }, 2000);
      } else {
        this.errorMessage = response.body.message; // Set the error message
        this.isLoading = false;
      }
    });
  }


  openSignUp() {
    this.state = AuthDialogState.SignUp;
    this.clearErrorAndValidationMessages();
  }

  private clearErrorAndValidationMessages(): void {
    this.errorMessage = '';
  }
  private isValidUsername(username: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(username);
  }

  private isValidPassword(password: string): { valid: boolean, errors?: string[] } {
    const errors: string[] = [];
    const allowedSpecialCharacters = "@$£!%*?&";
    const passwordRegex = new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[${allowedSpecialCharacters}])[A-Za-z\\d${allowedSpecialCharacters}]{8,}$`);

    if (!passwordRegex.test(password)) {
      if (!/[a-z]/.test(password)) errors.push('Contains at least 1 lowercase letter');
      if (!/[A-Z]/.test(password)) errors.push('Contains at least 1 uppercase letter');
      if (!/\d/.test(password)) errors.push('Contains at least 1 number');
      if (!new RegExp(`[${allowedSpecialCharacters}]`).test(password)) errors.push(`Contains at least 1 special character from the set ${allowedSpecialCharacters}`);

      const invalidCharacters = password.match(/[^\w\d@$£!%*?&]/g);
      if (invalidCharacters) {
        const uniqueInvalidCharacters = Array.from(new Set(invalidCharacters));
        errors.push(`Contains invalid character(s): ${uniqueInvalidCharacters.join(', ')}`);
      }

      return { valid: false, errors };
    }

    return { valid: true };
  }


  private passwordsMatch(): boolean {
    return this.password === this.repeatPassword;
  }
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  togglePasswordVisibility2() {
    this.showPassword2 = !this.showPassword2;
  }
  togglePasswordVisibility3() {
    this.showPassword3 = !this.showPassword3;
  }
  closeDialog(): void {
    this.dialogRef.close();
  }

}
