import { Component, computed, inject, input, linkedSignal, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, minLength, pattern, required, submit } from '@angular/forms/signals';
import { toApiErrorMessage } from '../../core/http/api-error.util';
import { fieldError } from '../../core/utils/field-error';
import { ToastService } from '../../core/notifications/toast.service';
import { UiButton } from '../../shared/ui/button/button';
import { UiField } from '../../shared/ui/field/field';
import { DepartmentsService } from './departments.service';

const CODE_PATTERN = /^[A-Z0-9_-]+$/;

/**
 * One component handles create + edit — `id` is the route param, `'nuevo'`
 * means "create". Same pattern reused by roles/users forms.
 *
 * Deliberately no `parentId` field yet: the backend keeps that column only
 * to avoid a future migration (see its schema doc-comment) and has no
 * hierarchy UI itself — matching that, this form doesn't invent one either.
 */
@Component({
  selector: 'app-department-form-page',
  imports: [FormField, RouterLink, UiButton, UiField],
  templateUrl: './department-form.page.html',
})
export class DepartmentFormPage {
  private readonly departmentsService = inject(DepartmentsService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly isEdit = computed(() => this.id() !== 'nuevo');

  protected readonly existing = resource({
    params: () => (this.isEdit() ? this.id() : undefined),
    loader: ({ params }) => (params ? this.departmentsService.get(params) : Promise.resolve(null)),
  });

  /** Starts empty for "create"; re-derives from the loaded record for "edit", but stays editable — see Angular's `linkedSignal`. */
  protected readonly model = linkedSignal(() => {
    const department = this.existing.value();
    return department
      ? { name: department.name, code: department.code, description: department.description ?? '', isActive: department.isActive }
      : { name: '', code: '', description: '', isActive: true };
  });

  protected readonly departmentForm = form(this.model, (p) => {
    required(p.name, { message: 'El nombre es obligatorio.' });
    minLength(p.name, 2, { message: 'Debe tener al menos 2 caracteres.' });
    required(p.code, { message: 'El código es obligatorio.' });
    pattern(p.code, CODE_PATTERN, { message: 'Solo mayúsculas, números, "-" o "_".' });
  });

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected onSubmit(): void {
    submit(this.departmentForm, async () => {
      this.serverError.set(null);
      this.submitting.set(true);
      try {
        const value = this.model();
        const basePayload = { name: value.name, code: value.code, description: value.description || undefined };

        if (this.isEdit()) {
          await this.departmentsService.update(this.id(), { ...basePayload, isActive: value.isActive });
        } else {
          await this.departmentsService.create(basePayload);
        }
        this.toastService.success(this.isEdit() ? 'Departamento actualizado.' : 'Departamento creado.');
        await this.router.navigateByUrl('/departamentos');
      } catch (error) {
        this.serverError.set(toApiErrorMessage(error));
      } finally {
        this.submitting.set(false);
      }
    });
  }

  protected readonly fieldError = fieldError;
}
