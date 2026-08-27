import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PERMISSIONS, type PermissionKey } from '../../core/auth/permissions';
import { UiButton } from '../../shared/ui/button/button';

interface NavItem {
  label: string;
  path: string;
  permission: PermissionKey;
}

// No "Roles"/"Permisos" nav item: roles are a fixed set
// (Solicitante/Revisor/Administrador — see core/auth/roles.ts and
// backend/docs/adr/0005-fixed-roles.md), assigned as a plain field on the
// user, right there in Usuarios. There is nothing to browse or configure
// as its own screen.
const NAV_ITEMS: NavItem[] = [
  { label: 'Documentos', path: '/documentos', permission: PERMISSIONS.documents.read },
  { label: 'Departamentos', path: '/departamentos', permission: PERMISSIONS.departments.read },
  { label: 'Usuarios', path: '/usuarios', permission: PERMISSIONS.users.read },
];

/** Parent layout for every authenticated route: sidebar nav (gated per item by permission) + topbar + outlet. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UiButton],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly visibleNavItems = computed(() =>
    NAV_ITEMS.filter((item) => this.authService.hasPermission(item.permission)),
  );

  protected async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login');
  }
}
