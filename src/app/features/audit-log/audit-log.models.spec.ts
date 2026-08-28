import { describe, expect, it } from 'vitest';
import { describeAuditLogEntry, type AuditLogEntry } from './audit-log.models';

function entry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: '1',
    actorId: 'user-1',
    actorEmail: 'admin@montalvo.local',
    action: 'documents:create',
    resourceType: 'document',
    resourceId: 'doc-1',
    metadata: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('describeAuditLogEntry', () => {
  it('describes a create action', () => {
    expect(describeAuditLogEntry(entry({ action: 'documents:create', resourceType: 'document' }))).toBe(
      'admin@montalvo.local creó documento',
    );
  });

  it('describes a delete action', () => {
    expect(describeAuditLogEntry(entry({ action: 'users:delete', resourceType: 'user' }))).toBe(
      'admin@montalvo.local eliminó usuario',
    );
  });

  it('describes a login without naming a resource', () => {
    expect(describeAuditLogEntry(entry({ action: 'auth:login', resourceType: 'auth' }))).toBe(
      'admin@montalvo.local inició sesión',
    );
  });

  it('falls back to the raw action string for an unmapped verb, still naming the resource', () => {
    expect(describeAuditLogEntry(entry({ action: 'documents:read', resourceType: 'document' }))).toBe(
      'admin@montalvo.local documents:read documento',
    );
  });
});
