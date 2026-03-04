import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    tap({
      error: err => {
        if (err.status === 401) {
          auth.logout();
        }
      }
    })
  );
};
