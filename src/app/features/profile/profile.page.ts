import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, form, minLength, required, submit, validate } from '@angular/forms/signals';
import { AuthService } from '../../core/auth/auth.service';
import { ROLE_LABELS } from '../../core/auth/roles';
import { toApiErrorMessage } from '../../core/http/api-error.util';
import { fieldError } from '../../core/utils/field-error';
import { ToastService } from '../../core/notifications/toast.service';
import { UiButton } from '../../shared/ui/button/button';
import { UiField } from '../../shared/ui/field/field';

/**
 * "Mi Perfil": read-only account summary (name/email/role — all admin-
 * managed, see `docs/RBAC.md` on why `PATCH /users/:id` stays admin-only)
 * plus the one thing every user can always do for themself, self-service
 * password change. Not a `<name>-list/-form` pair like the other features
 * — there's exactly one record (the caller's own) and nothing to list.
 */
@Component({
  selector: 'app-profile-page',
  imports: [FormField, UiButton, UiField],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly user = this.authService.user;
  protected readonly roleLabel = (role: string) => ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;

  protected readonly model = signal({ currentPassword: '', newPassword: '', confirmPassword: '' });

  protected readonly passwordForm = form(this.model, (p) => {
    required(p.currentPassword, { message: 'Ingresá tu contraseña actual.' });

    required(p.newPassword, { message: 'La nueva contraseña es obligatoria.' });
    minLength(p.newPassword, 8, { message: 'Debe tener al menos 8 caracteres.' });

    required(p.confirmPassword, { message: 'Confirmá la nueva contraseña.' });
    validate(p.confirmPassword, ({ value, valueOf }) =>
      value() !== valueOf(p.newPassword) ? { kind: 'mismatch', message: 'Las contraseñas no coinciden.' } : undefined,
    );
  });

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected onSubmit(): void {
    submit(this.passwordForm, async () => {
      this.serverError.set(null);
      this.submitting.set(true);
      try {
        const { currentPassword, newPassword } = this.model();
        await this.authService.changePassword(currentPassword, newPassword);
        this.toastService.success('Contraseña actualizada. Iniciá sesión de nuevo con tu nueva contraseña.');
        await this.router.navigateByUrl('/login');
      } catch (error) {
        this.serverError.set(toApiErrorMessage(error, 'No se pudo cambiar la contraseña. Verificá tu contraseña actual.'));
      } finally {
        this.submitting.set(false);
      }
    });
  }

  protected readonly fieldError = fieldError;
}
