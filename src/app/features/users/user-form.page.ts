import { Component, computed, inject, input, linkedSignal, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, applyWhen, email, form, minLength, required, submit } from '@angular/forms/signals';
import { toApiErrorMessage } from '../../core/http/api-error.util';
import { ROLES, ROLE_LABELS, type UserRoleValue } from '../../core/auth/roles';
import { fieldError } from '../../core/utils/field-error';
import { ToastService } from '../../core/notifications/toast.service';
import { DepartmentsService } from '../departments/departments.service';
import { UiButton } from '../../shared/ui/button/button';
import { UiField } from '../../shared/ui/field/field';
import { UsersService } from './users.service';

/**
 * One component for create + edit, same pattern as the department form.
 * `role` is a plain `[formField]`-bound select now — no checkbox-outside-
 * Signal-Forms machinery, no cross-referencing role names to ids. That
 * whole class of complexity went away with the fixed role enum, see
 * `core/auth/roles.ts` and `backend/docs/adr/0005-fixed-roles.md`.
 *
 * The one thing that still doesn't generalize from the department form:
 * `password` is required only on create (the backend's `UpdateUserDto` has
 * no password field at all — see its doc-comment), handled with
 * `applyWhen` since `required`'s `when` option alone can't also gate
 * `minLength`.
 */
@Component({
  selector: 'app-user-form-page',
  imports: [FormField, RouterLink, UiButton, UiField],
  templateUrl: './user-form.page.html',
})
export class UserFormPage {
  private readonly usersService = inject(UsersService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly isEdit = computed(() => this.id() !== 'nuevo');
  protected readonly roles = ROLES;
  protected readonly roleLabel = (role: UserRoleValue) => ROLE_LABELS[role];

  protected readonly existing = resource({
    params: () => (this.isEdit() ? this.id() : undefined),
    loader: ({ params }) => (params ? this.usersService.get(params) : Promise.resolve(null)),
  });

  protected readonly departmentsResource = resource({ loader: () => this.departmentsService.listAll() });

  protected readonly model = linkedSignal(() => {
    const user = this.existing.value();
    return {
      email: user?.email ?? '',
      password: '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      departmentId: user?.departmentId ?? '',
      role: user?.role ?? ('SOLICITANTE' as UserRoleValue),
      isActive: user?.isActive ?? true,
    };
  });

  protected readonly userForm = form(this.model, (p) => {
    required(p.email, { message: 'El correo es obligatorio.' });
    email(p.email, { message: 'Ingresá un correo válido.' });
    required(p.firstName, { message: 'El nombre es obligatorio.' });
    required(p.lastName, { message: 'El apellido es obligatorio.' });

    applyWhen(
      p.password,
      () => !this.isEdit(),
      (passwordPath) => {
        required(passwordPath, { message: 'La contraseña es obligatoria.' });
        minLength(passwordPath, 8, { message: 'Debe tener al menos 8 caracteres.' });
      },
    );
  });

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected onSubmit(): void {
    submit(this.userForm, async () => {
      this.serverError.set(null);
      this.submitting.set(true);
      try {
        const value = this.model();
        const departmentId = value.departmentId || undefined;

        if (this.isEdit()) {
          await this.usersService.update(this.id(), {
            email: value.email,
            firstName: value.firstName,
            lastName: value.lastName,
            departmentId,
            role: value.role,
            isActive: value.isActive,
          });
        } else {
          await this.usersService.create({
            email: value.email,
            password: value.password,
            firstName: value.firstName,
            lastName: value.lastName,
            departmentId,
            role: value.role,
          });
        }

        this.toastService.success(this.isEdit() ? 'Usuario actualizado.' : 'Usuario creado.');
        await this.router.navigateByUrl('/usuarios');
      } catch (error) {
        this.serverError.set(toApiErrorMessage(error));
      } finally {
        this.submitting.set(false);
      }
    });
  }

  protected readonly fieldError = fieldError;
}
