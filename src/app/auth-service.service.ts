import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly baseUrlServerless = 'https://5mtylqf88k.execute-api.us-east-1.amazonaws.com/Stage/';
  readonly baseUrlMicroservice = 'http://20.231.233.217/';
  private idTokenSubject = new BehaviorSubject<string>(localStorage.getItem('idToken') || '');
  private isAdminSubject = new BehaviorSubject<boolean>(JSON.parse(localStorage.getItem('isAdmin') || 'false'));
  private architectureSubject = new BehaviorSubject<string>('Serverless'); // Default value is 'Serverless'

  idToken$ = this.idTokenSubject.asObservable();
  isAdmin$ = this.isAdminSubject.asObservable();
  architecture$ = this.architectureSubject.asObservable();


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

  setArchitecture(architecture: string) {
    this.architectureSubject.next(architecture);
  }

  getArchitecture(): string {
    return this.architectureSubject.getValue();
  }
}
