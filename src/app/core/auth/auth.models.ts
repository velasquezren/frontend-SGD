import type { UserRoleValue } from './roles';

/** Mirrors `backend/src/modules/auth/auth.service.ts`'s `AuthenticatedProfile`. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId: string | null;
  role: UserRoleValue;
  permissions: string[];
}

/** Mirrors `backend/src/modules/auth/auth.service.ts`'s `AuthTokens & { user }`. */
export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
