import { Component, inject, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UiBadge } from '../../shared/ui/badge/badge';
import { UiPagination } from '../../shared/ui/pagination/pagination';
import { AuditLogService } from './audit-log.service';
import { RESOURCE_TYPE_LABELS, describeAuditLogEntry, type AuditLogEntry } from './audit-log.models';

const PAGE_SIZE = 20;
const RESOURCE_TYPES = Object.keys(RESOURCE_TYPE_LABELS);

/**
 * Read-only — no form page, nothing here is ever created/edited by a user
 * (see `AuditLogService`'s doc-comment). Reachable only via the sidebar's
 * `audit:read`-gated nav item; hitting the route without that permission
 * just shows this page's own 403 error state, same as any other
 * permission-gated list (no dedicated route guard exists in this app yet
 * — see `core/auth/auth.guard.ts`).
 */
@Component({
  selector: 'app-audit-log-list-page',
  imports: [DatePipe, UiBadge, UiPagination],
  templateUrl: './audit-log-list.page.html',
})
export class AuditLogListPage {
  private readonly auditLogService = inject(AuditLogService);

  protected readonly resourceTypes = RESOURCE_TYPES;
  protected readonly resourceTypeLabel = (type: string) => RESOURCE_TYPE_LABELS[type] ?? type;
  protected readonly describe = describeAuditLogEntry;

  protected readonly resourceType = signal('');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly page = signal(1);

  protected readonly entriesResource = resource({
    params: () => ({ page: this.page(), resourceType: this.resourceType(), from: this.from(), to: this.to() }),
    loader: ({ params }) =>
      this.auditLogService.list({
        page: params.page,
        pageSize: PAGE_SIZE,
        resourceType: params.resourceType || undefined,
        from: params.from || undefined,
        to: params.to || undefined,
      }),
  });

  protected onFilterChange(): void {
    this.page.set(1);
    this.entriesResource.reload();
  }

  protected resourceBadgeVariant(type: string): 'primary' | 'secondary' | 'neutral' {
    if (type === 'document') return 'primary';
    if (type === 'auth') return 'secondary';
    return 'neutral';
  }

  protected trackEntry(entry: AuditLogEntry): string {
    return entry.id;
  }
}
