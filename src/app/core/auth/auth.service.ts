import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api/api-url';
import type { ApiResponse } from '../api/api-response';
import { toApiErrorMessage } from '../http/api-error.util';
import type { AuthUser, LoginResponseData } from './auth.models';
import type { PermissionKey } from './permissions';

const ACCESS_TOKEN_KEY = 'sgd.accessToken';
const REFRESH_TOKEN_KEY = 'sgd.refreshToken';
const USER_KEY = 'sgd.user';

/**
 * Holds the current session (access/refresh tokens + user profile) in
 * signals, persisted to `localStorage` so a page refresh doesn't log the
 * user out. No SSR in this project (see `angular.json` — no server
 * builder), so direct `localStorage` access is safe; guard with
 * `isPlatformBrowser` if SSR is ever added.
 *
 * Token *refreshing* (calling `POST /auth/refresh` before the access token
 * expires) is not implemented yet — this is the login flow only. See
 * `backend/docs/adr/0002-auth-strategy.md` for the token model this talks to.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly userSignal = signal<AuthUser | null>(readJson<AuthUser>(USER_KEY));
  private readonly accessTokenSignal = signal<string | null>(readString(ACCESS_TOKEN_KEY));

  readonly user = this.userSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenSignal() !== null);

  hasPermission(key: PermissionKey): boolean {
    return this.userSignal()?.permissions.includes(key) ?? false;
  }

  hasAnyPermission(keys: PermissionKey[]): boolean {
    return keys.some((key) => this.hasPermission(key));
  }

  async login(email: string, password: string): Promise<AuthUser> {
    let response: ApiResponse<LoginResponseData>;
    try {
      response = await firstValueFrom(
        this.http.post<ApiResponse<LoginResponseData>>(`${API_URL}/auth/login`, { email, password }),
      );
    } catch (error) {
      throw new Error(toLoginErrorMessage(error));
    }

    this.setSession(response.data);
    return response.data.user;
  }

  async logout(): Promise<void> {
    const refreshToken = readString(REFRESH_TOKEN_KEY);
    this.clearSession();
    if (!refreshToken) return;
    // Best-effort: the session is already cleared client-side either way.
    try {
      await firstValueFrom(this.http.post(`${API_URL}/auth/logout`, { refreshToken }));
    } catch {
      /* ignore — token is already gone locally */
    }
  }

  /** Called by `authInterceptor` when the API rejects a request as 401 — the token is no longer valid, so just drop it locally (no server round-trip, unlike `logout()`). */
  handleUnauthorized(): void {
    this.clearSession();
  }

  /**
   * Self-service password change (`POST /auth/change-password`, see
   * `backend/docs/RBAC.md`). The backend revokes every refresh token on
   * success, so the *current* session's refresh token is now invalid too
   * — clear the session locally and send the user back through `/login`
   * rather than letting a later silent-refresh attempt fail confusingly.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await firstValueFrom(this.http.post(`${API_URL}/auth/change-password`, { currentPassword, newPassword }));
    this.clearSession();
  }

  private setSession(data: LoginResponseData): void {
    this.userSignal.set(data.user);
    this.accessTokenSignal.set(data.accessToken);
    writeString(ACCESS_TOKEN_KEY, data.accessToken);
    writeString(REFRESH_TOKEN_KEY, data.refreshToken);
    writeJson(USER_KEY, data.user);
  }

  private clearSession(): void {
    this.userSignal.set(null);
    this.accessTokenSignal.set(null);
    removeKey(ACCESS_TOKEN_KEY);
    removeKey(REFRESH_TOKEN_KEY);
    removeKey(USER_KEY);
  }
}

function toLoginErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 401) {
    return 'Correo o contraseña incorrectos.';
  }
  return toApiErrorMessage(error);
}

function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private-mode / storage disabled — session just won't survive a refresh */
  }
}

function readJson<T>(key: string): T | null {
  const raw = readString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  writeString(key, JSON.stringify(value));
}

function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
