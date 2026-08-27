import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { email, form, required, submit, FormField } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/auth.service';
import { fieldError } from '../../../core/utils/field-error';
import { UiButton } from '../../../shared/ui/button/button';
import { UiField } from '../../../shared/ui/field/field';

/**
 * Login screen. `guestGuard` (`core/auth/auth.guard.ts`) keeps an
 * already-authenticated user from ever reaching this route, so this
 * component only ever needs to render the form — no "already logged in"
 * branch here.
 */
@Component({
  selector: 'app-login-page',
  imports: [FormField, UiButton, UiField],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = form(this.model, (p) => {
    required(p.email, { message: 'El correo es obligatorio.' });
    email(p.email, { message: 'Ingresá un correo válido.' });
    // Login only needs a non-empty password — the server, not this form,
    // owns password strength rules (those apply when a password is set,
    // not each time it's used to log in).
    required(p.password, { message: 'La contraseña es obligatoria.' });
  });

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected onSubmit(): void {
    submit(this.loginForm, async () => {
      this.serverError.set(null);
      this.submitting.set(true);
      try {
        await this.authService.login(this.model().email, this.model().password);
        await this.router.navigateByUrl('/');
      } catch (error) {
        this.serverError.set(error instanceof Error ? error.message : 'Ocurrió un error inesperado.');
      } finally {
        this.submitting.set(false);
      }
    });
  }

  protected readonly fieldError = fieldError;
}
