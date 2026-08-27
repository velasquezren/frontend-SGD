import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PERMISSIONS, type PermissionKey } from '../../core/auth/permissions';
import { DepartmentsService } from '../departments/departments.service';
import { DocumentsService } from '../documents/documents.service';
import { UsersService } from '../users/users.service';

export type StepStatus = 'done' | 'next' | 'pending';

interface WorkflowStep {
  order: number;
  label: string;
  description: string;
  unit: string;
  path: string;
  permission: PermissionKey;
}

/**
 * The natural bootstrap order for a fresh clinic install: an org needs
 * departments before people are meaningfully organized, and people before
 * there's anyone to attribute an uploaded document to. No "roles" step —
 * a role is just a field picked while creating a user (see
 * `core/auth/roles.ts`), not something set up separately beforehand. This
 * order is what drives the dashboard's "what should I do next" guidance —
 * see `nextStepPath`.
 */
const STEPS: WorkflowStep[] = [
  {
    order: 1,
    label: 'Departamentos',
    description: 'Organizá la clínica por áreas.',
    unit: 'departamentos',
    path: '/departamentos',
    permission: PERMISSIONS.departments.read,
  },
  {
    order: 2,
    label: 'Usuarios',
    description: 'Cargá al personal y asignale un rol.',
    unit: 'usuarios',
    path: '/usuarios',
    permission: PERMISSIONS.users.read,
  },
  {
    order: 3,
    label: 'Documentos',
    description: 'Subí y organizá los archivos.',
    unit: 'documentos',
    path: '/documentos',
    permission: PERMISSIONS.documents.read,
  },
];

/**
 * Each count is its own `resource()` (Angular's reactive primitives don't
 * lend themselves to a dynamic array of resources) that skips the request
 * entirely when the user lacks the read permission — never fetch a count
 * for a step `visibleSteps()` won't even render.
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  protected readonly authService = inject(AuthService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly usersService = inject(UsersService);
  private readonly documentsService = inject(DocumentsService);

  protected readonly visibleSteps = computed(() => STEPS.filter((step) => this.authService.hasPermission(step.permission)));

  private readonly departmentsCount = resource({
    loader: () => this.countIfAllowed(PERMISSIONS.departments.read, () => this.departmentsService.list({ pageSize: 1 }).then((r) => r.meta.total)),
  });
  private readonly usersCount = resource({
    loader: () => this.countIfAllowed(PERMISSIONS.users.read, () => this.usersService.list({ pageSize: 1 }).then((r) => r.meta.total)),
  });
  private readonly documentsCount = resource({
    loader: () => this.countIfAllowed(PERMISSIONS.documents.read, () => this.documentsService.list({ pageSize: 1 }).then((r) => r.meta.total)),
  });

  private readonly countsByPath = computed<Record<string, number | null | undefined>>(() => ({
    '/departamentos': this.departmentsCount.value(),
    '/usuarios': this.usersCount.value(),
    '/documentos': this.documentsCount.value(),
  }));

  /** First visible step whose count is still 0 — everything before it is "done", this one is "next", the rest are "pending". If every step already has data, the last visible step (Documentos, day-to-day work) is "next". */
  protected readonly nextStepPath = computed(() => {
    const steps = this.visibleSteps();
    for (const step of steps) {
      if (this.countsByPath()[step.path] === 0) return step.path;
    }
    return steps.at(-1)?.path ?? null;
  });

  protected countFor(path: string): string {
    const count = this.countsByPath()[path];
    return count === null || count === undefined ? '—' : String(count);
  }

  protected statusFor(step: WorkflowStep): StepStatus {
    if (step.path === this.nextStepPath()) return 'next';
    const count = this.countsByPath()[step.path];
    return count ? 'done' : 'pending';
  }

  private countIfAllowed(permission: PermissionKey, load: () => Promise<number>): Promise<number | null> {
    return this.authService.hasPermission(permission) ? load() : Promise.resolve(null);
  }
}
