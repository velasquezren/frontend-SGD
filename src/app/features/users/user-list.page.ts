import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PERMISSIONS } from '../../core/auth/permissions';
import { ROLE_LABELS, type UserRoleValue } from '../../core/auth/roles';
import { ConfirmService } from '../../core/dialogs/confirm.service';
import { toApiErrorMessage } from '../../core/http/api-error.util';
import { ToastService } from '../../core/notifications/toast.service';
import { debounce } from '../../core/utils/debounce';
import { DepartmentsService } from '../departments/departments.service';
import { UiBadge, type BadgeVariant } from '../../shared/ui/badge/badge';
import { UiButton } from '../../shared/ui/button/button';
import { UiPagination } from '../../shared/ui/pagination/pagination';
import type { User } from './users.models';
import { UsersService } from './users.service';

const ROLE_BADGE_VARIANT: Record<UserRoleValue, BadgeVariant> = {
  SOLICITANTE: 'neutral',
  REVISOR: 'secondary',
  ADMINISTRADOR: 'primary',
};

const PAGE_SIZE = 20;

@Component({
  selector: 'app-user-list-page',
  imports: [RouterLink, UiBadge, UiButton, UiPagination],
  templateUrl: './user-list.page.html',
})
export class UserListPage {
  private readonly usersService = inject(UsersService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toastService = inject(ToastService);
  protected readonly authService = inject(AuthService);
  protected readonly PERMISSIONS = PERMISSIONS;

  protected readonly searchTerm = signal('');
  private readonly search = signal('');
  protected readonly page = signal(1);

  private readonly debouncedSearch = debounce((value: string) => {
    this.search.set(value);
    this.page.set(1);
  }, 300);

  protected readonly usersResource = resource({
    params: () => ({ page: this.page(), search: this.search() }),
    loader: ({ params }) =>
      this.usersService.list({ page: params.page, pageSize: PAGE_SIZE, search: params.search || undefined }),
  });

  private readonly departmentsResource = resource({ loader: () => this.departmentsService.listAll() });

  protected readonly departmentNameById = computed(() => {
    const map = new Map<string, string>();
    for (const department of this.departmentsResource.value() ?? []) {
      map.set(department.id, department.name);
    }
    return map;
  });

  protected roleLabel(role: UserRoleValue): string {
    return ROLE_LABELS[role];
  }

  protected roleBadgeVariant(role: UserRoleValue): BadgeVariant {
    return ROLE_BADGE_VARIANT[role];
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.debouncedSearch(value);
  }

  protected async onDelete(user: User): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar usuario',
      message: `¿Eliminar a "${user.firstName} ${user.lastName}"? Se revoca su acceso de inmediato.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await this.usersService.remove(user.id);
      this.toastService.success(`Usuario "${user.firstName} ${user.lastName}" eliminado.`);
      this.usersResource.reload();
    } catch (error) {
      this.toastService.error(toApiErrorMessage(error));
    }
  }
}
