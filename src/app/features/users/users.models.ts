import type { UserRoleValue } from '../../core/auth/roles';

/** Mirrors `SafeUser` from `backend/src/modules/users/users.service.ts`. */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  departmentId: string | null;
  role: UserRoleValue;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Mirrors `backend/src/modules/users/dto/create-user.dto.ts`. */
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId?: string;
  role?: UserRoleValue;
}

/** Mirrors `backend/src/modules/users/dto/update-user.dto.ts` — no `password` field, by design (see its doc-comment). */
export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  departmentId?: string;
  role?: UserRoleValue;
  isActive?: boolean;
}

/** Mirrors `UserStats` from `backend/src/modules/users/users.service.ts`. Powers the dashboard's users-by-role chart (admin only, same as the rest of this module). */
export interface UserStats {
  total: number;
  byRole: Record<UserRoleValue, number>;
}
