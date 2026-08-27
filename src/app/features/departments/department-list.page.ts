import { Component, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PERMISSIONS } from '../../core/auth/permissions';
import { ConfirmService } from '../../core/dialogs/confirm.service';
import { toApiErrorMessage } from '../../core/http/api-error.util';
import { ToastService } from '../../core/notifications/toast.service';
import { debounce } from '../../core/utils/debounce';
import { UiBadge } from '../../shared/ui/badge/badge';
import { UiButton } from '../../shared/ui/button/button';
import { UiPagination } from '../../shared/ui/pagination/pagination';
import type { Department } from './departments.models';
import { DepartmentsService } from './departments.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-department-list-page',
  imports: [RouterLink, UiBadge, UiButton, UiPagination],
  templateUrl: './department-list.page.html',
})
export class DepartmentListPage {
  private readonly departmentsService = inject(DepartmentsService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toastService = inject(ToastService);
  protected readonly authService = inject(AuthService);
  protected readonly PERMISSIONS = PERMISSIONS;

  /** What the search box shows, updated on every keystroke. */
  protected readonly searchTerm = signal('');
  /** What actually drives the request, debounced so we don't hit the API on every keystroke. */
  private readonly search = signal('');
  protected readonly page = signal(1);

  private readonly debouncedSearch = debounce((value: string) => {
    this.search.set(value);
    this.page.set(1);
  }, 300);

  protected readonly departmentsResource = resource({
    params: () => ({ page: this.page(), search: this.search() }),
    loader: ({ params }) =>
      this.departmentsService.list({ page: params.page, pageSize: PAGE_SIZE, search: params.search || undefined }),
  });

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.debouncedSearch(value);
  }

  protected async onDelete(department: Department): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar departamento',
      message: `¿Eliminar "${department.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await this.departmentsService.remove(department.id);
      this.toastService.success(`Departamento "${department.name}" eliminado.`);
      this.departmentsResource.reload();
    } catch (error) {
      this.toastService.error(toApiErrorMessage(error));
    }
  }
}
