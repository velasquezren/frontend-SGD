import { Component, computed, inject, input, output, resource, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { PERMISSIONS } from '../../core/auth/permissions';
import { toApiErrorMessage } from '../../core/http/api-error.util';
import { ToastService } from '../../core/notifications/toast.service';
import { DepartmentsService } from '../departments/departments.service';
import { UsersService } from '../users/users.service';
import { UiBadge } from '../../shared/ui/badge/badge';
import { UiButton } from '../../shared/ui/button/button';
import { UiModal } from '../../shared/ui/modal/modal';
import { SharingService, type ShareableResourceType } from './sharing.service';
import type { ShareEntry } from './sharing.models';

/**
 * "Compartir" dialog for a document or folder — one component for both
 * (`resourceType` picks the endpoint via `SharingService`), opened from
 * `document-list.page.html` for either a document row or a folder tile.
 * See `backend/docs/adr/0006-department-scoped-visibility.md` for the
 * model this is the UI for: read-only sharing, department or a specific
 * person, never both grants edit rights.
 *
 * The "share with a person" option only appears for callers who can
 * actually list people (`users:read`, admin-only per `docs/RBAC.md`) —
 * everyone else only sees the department picker, since there's no way to
 * offer a user dropdown without a way to populate it.
 */
@Component({
  selector: 'app-share-dialog',
  imports: [UiBadge, UiButton, UiModal],
  templateUrl: './share-dialog.html',
  styleUrl: './share-dialog.scss',
})
export class ShareDialog {
  private readonly sharingService = inject(SharingService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly usersService = inject(UsersService);
  private readonly toastService = inject(ToastService);
  protected readonly authService = inject(AuthService);
  protected readonly PERMISSIONS = PERMISSIONS;

  readonly resourceType = input.required<ShareableResourceType>();
  readonly resourceId = input.required<string>();
  readonly resourceName = input.required<string>();
  /** Excluded from the department picker — already visible, sharing with it is a no-op the backend would reject as a duplicate anyway. */
  readonly ownerDepartmentId = input<string | null>(null);
  readonly closed = output<void>();

  protected readonly sharesResource = resource({
    params: () => ({ resourceType: this.resourceType(), resourceId: this.resourceId() }),
    loader: ({ params }) => this.sharingService.list(params.resourceType, params.resourceId),
  });

  private readonly departmentsResource = resource({ loader: () => this.departmentsService.listAll() });
  protected readonly canPickUser = computed(() => this.authService.hasPermission(PERMISSIONS.users.read));
  private readonly usersResource = resource({
    loader: () => (this.canPickUser() ? this.usersService.list({ pageSize: 100 }).then((r) => r.items) : Promise.resolve([])),
  });

  protected readonly shareableDepartments = computed(() =>
    (this.departmentsResource.value() ?? []).filter((d) => d.id !== this.ownerDepartmentId()),
  );
  protected readonly shareableUsers = computed(() => this.usersResource.value() ?? []);

  private readonly departmentNameById = computed(
    () => new Map((this.departmentsResource.value() ?? []).map((d) => [d.id, d.name])),
  );
  private readonly userLabelById = computed(
    () => new Map((this.usersResource.value() ?? []).map((u) => [u.id, `${u.firstName} ${u.lastName}`])),
  );

  protected readonly targetType = signal<'department' | 'user'>('department');
  protected readonly selectedDepartmentId = signal('');
  protected readonly selectedUserId = signal('');
  protected readonly sharing = signal(false);

  protected readonly canSubmit = computed(() => {
    if (this.sharing()) return false;
    return this.targetType() === 'department' ? this.selectedDepartmentId() !== '' : this.selectedUserId() !== '';
  });

  protected labelFor(share: ShareEntry): string {
    if (share.departmentId) return this.departmentNameById().get(share.departmentId) ?? 'Departamento';
    if (share.userId) return this.userLabelById().get(share.userId) ?? 'Persona';
    return '—';
  }

  protected setTargetType(type: 'department' | 'user'): void {
    this.targetType.set(type);
  }

  protected async onAdd(): Promise<void> {
    this.sharing.set(true);
    try {
      const input =
        this.targetType() === 'department' ? { departmentId: this.selectedDepartmentId() } : { userId: this.selectedUserId() };
      await this.sharingService.share(this.resourceType(), this.resourceId(), input);
      this.selectedDepartmentId.set('');
      this.selectedUserId.set('');
      this.toastService.success('Compartido.');
      this.sharesResource.reload();
    } catch (error) {
      this.toastService.error(toApiErrorMessage(error));
    } finally {
      this.sharing.set(false);
    }
  }

  protected async onRemove(share: ShareEntry): Promise<void> {
    try {
      await this.sharingService.unshare(this.resourceType(), this.resourceId(), share.id);
      this.toastService.success('Se dejó de compartir.');
      this.sharesResource.reload();
    } catch (error) {
      this.toastService.error(toApiErrorMessage(error));
    }
  }
}
