import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginResponse, UserModel } from '../models/user.model';

const TOKEN_KEY = 'trackr_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<UserModel | null>(this.decodeStoredToken());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem(TOKEN_KEY, res.token);
          this.currentUser.set(this.decodeToken(res.token));
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    try {
      const token = this.getToken();
      if (!token) return false;
      const user = this.decodeToken(token);
      if (!user) return false;
      if (user.exp * 1000 <= Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        this.currentUser.set(null);
        return false;
      }
      return true;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      this.currentUser.set(null);
      return false;
    }
  }

  private decodeStoredToken(): UserModel | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      return this.decodeToken(token);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  }

  private decodeToken(token: string): UserModel | null {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return {
      email: decoded.email ?? decoded.sub,
      role: decoded.role,
      displayName: decoded.displayName,
      exp: decoded.exp
    };
  }
}
