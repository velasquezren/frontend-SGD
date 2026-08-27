/**
 * Mirrors the `Role` enum in `backend/prisma/schema.prisma` — a fixed set,
 * not something users create/edit. See `backend/docs/adr/0005-fixed-roles.md`.
 */
export const ROLES = ['SOLICITANTE', 'REVISOR', 'ADMINISTRADOR'] as const;

export type UserRoleValue = (typeof ROLES)[number];

export const ROLE_LABELS: Record<UserRoleValue, string> = {
  SOLICITANTE: 'Solicitante',
  REVISOR: 'Revisor',
  ADMINISTRADOR: 'Administrador',
};

export const ROLE_DESCRIPTIONS: Record<UserRoleValue, string> = {
  SOLICITANTE: 'Sube y solicita documentos.',
  REVISOR: 'Revisa y edita metadata de documentos.',
  ADMINISTRADOR: 'Acceso completo, incluida la eliminación de documentos.',
};
