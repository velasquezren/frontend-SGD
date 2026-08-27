import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../api/api-url';
import { AuthService } from '../auth/auth.service';

/**
 * Attaches the access token to every request to our own API, and drops the
 * session on a 401 (the token is invalid/expired — see
 * `AuthService.handleUnauthorized`). No silent refresh-and-retry here on
 * purpose: see `docs/adr/0002-auth-strategy.md` on the backend for why the
 * token model stays simple — add retry logic only if a real need shows up,
 * not preemptively.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.accessToken();

  const authorizedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && authService.isAuthenticated()) {
        authService.handleUnauthorized();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
