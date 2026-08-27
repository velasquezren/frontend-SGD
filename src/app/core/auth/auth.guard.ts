import { inject } from '@angular/core';
import type { CanMatchFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Blocks every authenticated route unless a session exists; redirects to `/login` otherwise. */
export const authGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};

/** Keeps an already-logged-in user off `/login` — sends them to the dashboard instead. */
export const guestGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) return true;
  return router.createUrlTree(['/']);
};
