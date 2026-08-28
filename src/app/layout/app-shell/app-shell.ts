import { Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PERMISSIONS, type PermissionKey } from '../../core/auth/permissions';
import { InstallPromptService } from '../../core/pwa/install-prompt.service';
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
  { label: 'Auditoría', path: '/auditoria', permission: PERMISSIONS.audit.read },
];

/** Parent layout for every authenticated route: sidebar nav (gated per item by permission) + topbar + outlet. */
@Component({
  selector: 'app-shell',
  imports: [NgOptimizedImage, RouterOutlet, RouterLink, RouterLinkActive, UiButton],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  protected readonly authService = inject(AuthService);
  protected readonly installPromptService = inject(InstallPromptService);
  private readonly router = inject(Router);

  protected readonly visibleNavItems = computed(() =>
    NAV_ITEMS.filter((item) => this.authService.hasPermission(item.permission)),
  );

  /**
   * Below `md`, `.shell__nav` is a closed dropdown by default (see
   * app-shell.scss) — this is the one thing that opens/closes it.
   * `md`+ ignores this signal entirely (the nav is always visible there),
   * so nothing here needs to reset on resize.
   */
  protected readonly mobileNavOpen = signal(false);

  constructor() {
    // Belt-and-suspenders beyond each link's own `(click)="closeMobileNav()"`
    // — also catches back/forward navigation and the brand link, so the
    // drawer never re-appears already-open on the next screen.
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) this.mobileNavOpen.set(false);
    });
  }

  protected toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  protected async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login');
  }

  protected async onInstall(): Promise<void> {
    await this.installPromptService.promptInstall();
  }
}
