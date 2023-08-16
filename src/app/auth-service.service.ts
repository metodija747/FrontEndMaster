import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private idTokenSubject = new BehaviorSubject<string>(localStorage.getItem('idToken') || '');
  private isAdminSubject = new BehaviorSubject<boolean>(JSON.parse(localStorage.getItem('isAdmin') || 'false'));
  idToken$ = this.idTokenSubject.asObservable();
  isAdmin$ = this.isAdminSubject.asObservable();

  setIdToken(idToken: string) {
    localStorage.setItem('idToken', idToken);
    this.idTokenSubject.next(idToken);
  }

  setIsAdmin(isAdmin: boolean) {
    localStorage.setItem('isAdmin', JSON.stringify(isAdmin));
    this.isAdminSubject.next(isAdmin);
  }

  getIdToken(): string {
    return this.idTokenSubject.getValue();
  }

  clearIdToken() {
    localStorage.removeItem('idToken');
    localStorage.removeItem('isAdmin');
    this.idTokenSubject.next('');
    this.isAdminSubject.next(false);
  }

  decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1])).sub;
    } catch (e) {
      return null;
    }
  }

  getUserIdFromToken(): string | null {
    const token = this.getIdToken();
    const decoded = this.decodeToken(token);
    return decoded ? decoded : null;
  }
}
