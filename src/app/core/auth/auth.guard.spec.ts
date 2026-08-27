import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

function setup(isAuthenticated: boolean) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } }],
  });
  return {
    router: TestBed.inject(Router),
    run: <T,>(guard: () => T) => TestBed.runInInjectionContext(guard),
  };
}

describe('authGuard', () => {
  it('allows navigation when a session exists', () => {
    const { run } = setup(true);
    expect(run(() => authGuard({} as never, {} as never, {} as never))).toBe(true);
  });

  it('redirects to /login when there is no session', () => {
    const { run, router } = setup(false);
    const result = run(() => authGuard({} as never, {} as never, {} as never));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});

describe('guestGuard', () => {
  it('allows navigation to /login when there is no session', () => {
    const { run } = setup(false);
    expect(run(() => guestGuard({} as never, {} as never, {} as never))).toBe(true);
  });

  it('redirects an already-authenticated user to /', () => {
    const { run, router } = setup(true);
    const result = run(() => guestGuard({} as never, {} as never, {} as never));
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
