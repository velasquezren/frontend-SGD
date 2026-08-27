/**
 * Mirrors `backend/src/common/constants/permissions.ts` (`PERMISSIONS`) —
 * keep the two in sync by hand. There's no shared package between the two
 * repos, so this duplication is the tradeoff; it buys typo-checked
 * `hasPermission(PERMISSIONS.departments.create)` calls instead of raw
 * strings scattered across every screen.
 *
 * No `roles`/`permissions` resource groups — those aren't API resources
 * anymore, see `roles.ts` and `backend/docs/adr/0005-fixed-roles.md`.
 */
export const PERMISSIONS = {
  departments: {
    create: 'departments:create',
    read: 'departments:read',
    update: 'departments:update',
    delete: 'departments:delete',
  },
  users: {
    create: 'users:create',
    read: 'users:read',
    update: 'users:update',
    delete: 'users:delete',
  },
  documents: {
    create: 'documents:create',
    read: 'documents:read',
    update: 'documents:update',
    delete: 'documents:delete',
  },
  folders: {
    create: 'folders:create',
    read: 'folders:read',
    update: 'folders:update',
    delete: 'folders:delete',
  },
} as const;

type PermissionValues<T> = T extends string ? T : { [K in keyof T]: PermissionValues<T[K]> }[keyof T];

export type PermissionKey = PermissionValues<typeof PERMISSIONS>;
