/** Mirrors the `AuditLog` model in `backend/prisma/schema.prisma`. Read-only — see `audit-log.service.ts`. */
export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorEmail: string;
  /** `"resource:action"`, e.g. `"documents:create"`. */
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  document: 'Documento',
  user: 'Usuario',
  department: 'Departamento',
  folder: 'Carpeta',
  auth: 'Sesión',
};

const ACTION_VERBS: Record<string, string> = {
  create: 'creó',
  update: 'actualizó',
  delete: 'eliminó',
  login: 'inició sesión',
  share: 'compartió',
  unshare: 'dejó de compartir',
};

/**
 * Turns a raw row into a short, human-readable sentence — shared by the
 * dedicated Audit Log screen and the dashboard's recent-activity feed so
 * the two don't drift into two different phrasings of the same data.
 */
export function describeAuditLogEntry(entry: AuditLogEntry): string {
  const verb = ACTION_VERBS[entry.action.split(':')[1] ?? ''] ?? entry.action;
  const resource = RESOURCE_TYPE_LABELS[entry.resourceType] ?? entry.resourceType;
  return entry.resourceType === 'auth' ? `${entry.actorEmail} ${verb}` : `${entry.actorEmail} ${verb} ${resource.toLowerCase()}`;
}
