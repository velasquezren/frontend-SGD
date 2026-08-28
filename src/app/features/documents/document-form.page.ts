import { Component, computed, inject, input, linkedSignal, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../core/dialogs/confirm.service';
import { toApiErrorMessage } from '../../core/http/api-error.util';
import { ToastService } from '../../core/notifications/toast.service';
import { fieldError } from '../../core/utils/field-error';
import { formatFileSize } from '../../core/utils/format-file-size';
import { DepartmentsService } from '../departments/departments.service';
import type { Folder } from '../folders/folders.models';
import { FoldersService } from '../folders/folders.service';
import { UiButton } from '../../shared/ui/button/button';
import { UiField } from '../../shared/ui/field/field';
import { DocumentsService } from './documents.service';

/**
 * Create (upload) + edit (metadata only) in one component, same pattern as
 * the other forms. The file itself is NOT part of `documentForm` — Signal
 * Forms has no story for `<input type="file">`, so the selected `File` is
 * a plain signal, same technique already used for the role/user checkbox
 * lists. The file input only renders on create; the backend has no
 * "replace the file" endpoint (see `UpdateDocumentInput`'s doc-comment).
 */
@Component({
  selector: 'app-document-form-page',
  imports: [FormField, RouterLink, UiButton, UiField],
  templateUrl: './document-form.page.html',
  styleUrl: './document-form.page.scss',
})
export class DocumentFormPage {
  private readonly documentsService = inject(DocumentsService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly foldersService = inject(FoldersService);
  private readonly toastService = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  /** `?folderId=...` — set when arriving via "Subir documento" from inside a folder (see `document-list.page.html`); binds automatically via `withComponentInputBinding()`. Ignored in edit mode. */
  readonly folderId = input<string>();
  protected readonly isEdit = computed(() => this.id() !== 'nuevo');
  protected readonly formatFileSize = formatFileSize;

  protected readonly existing = resource({
    params: () => (this.isEdit() ? this.id() : undefined),
    loader: ({ params }) => (params ? this.documentsService.get(params) : Promise.resolve(null)),
  });

  protected readonly departmentsResource = resource({ loader: () => this.departmentsService.listAll() });
  protected readonly foldersResource = resource({ loader: () => this.foldersService.list() });
  private readonly departmentNameById = computed(
    () => new Map((this.departmentsResource.value() ?? []).map((d) => [d.id, d.name])),
  );

  /** Folders flattened with a depth-based indent prefix, root-first, siblings alphabetical — so the flat `<select>` still reads as a tree. */
  protected readonly folderOptions = computed(() => {
    const folders = this.foldersResource.value() ?? [];
    const byParent = new Map<string | null, Folder[]>();
    for (const folder of folders) {
      const siblings = byParent.get(folder.parentId) ?? [];
      siblings.push(folder);
      byParent.set(folder.parentId, siblings);
    }
    for (const siblings of byParent.values()) {
      siblings.sort((a, b) => a.name.localeCompare(b.name));
    }

    const options: { id: string; label: string }[] = [];
    const walk = (parentId: string | null, depth: number): void => {
      for (const folder of byParent.get(parentId) ?? []) {
        options.push({ id: folder.id, label: `${'—'.repeat(depth)} ${folder.name}`.trim() });
        walk(folder.id, depth + 1);
      }
    };
    walk(null, 0);
    return options;
  });

  protected readonly model = linkedSignal(() => {
    const doc = this.existing.value();
    return {
      title: doc?.title ?? '',
      description: doc?.description ?? '',
      // On create, defaults to the uploader's own department — the common
      // case needs zero extra clicks, see docs/adr/0006-*.md. Empty only
      // if the uploader themself has no department (rare — an admin, or
      // a user created without one); the field is still required, so
      // that case just means picking one explicitly.
      departmentId: doc?.departmentId ?? this.authService.user()?.departmentId ?? '',
      // On create, default to the folder we navigated in from (?folderId=…); irrelevant once `doc` exists (edit mode).
      folderId: doc?.folderId ?? this.folderId() ?? '',
    };
  });

  /** The document's department *before* any edit in this session — compared against on submit to decide whether the department-change confirmation is needed. `undefined` until `existing` resolves, `null` for a create (nothing to compare against). */
  private readonly originalDepartmentId = computed<string | null | undefined>(() =>
    this.isEdit() ? (this.existing.value()?.departmentId ?? null) : null,
  );

  protected readonly documentForm = form(this.model, (p) => {
    required(p.title, { message: 'El título es obligatorio.' });
    minLength(p.title, 2, { message: 'Debe tener al menos 2 caracteres.' });
    required(p.departmentId, { message: 'El departamento es obligatorio.' });
  });

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isDragging = signal(false);

  protected readonly canSubmit = computed(
    () => !this.documentForm().invalid() && (this.isEdit() || this.selectedFile() !== null),
  );

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected onFileChange(files: FileList | null): void {
    this.selectedFile.set(files?.[0] ?? null);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(): void {
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.selectedFile.set(file);
  }

  protected onSubmit(): void {
    submit(this.documentForm, async () => {
      // Stated up front, at the exact moment it matters, not buried in a
      // help page — see docs/adr/0006-department-scoped-visibility.md.
      // Checked before touching loading/error state so declining is a
      // true no-op.
      if (this.isEdit() && !(await this.confirmDepartmentChangeIfAny())) {
        return;
      }

      this.serverError.set(null);
      this.submitting.set(true);
      try {
        const value = this.model();
        const departmentId = value.departmentId;
        const folderId = value.folderId || undefined;

        if (this.isEdit()) {
          await this.documentsService.update(this.id(), {
            title: value.title,
            description: value.description || undefined,
            departmentId,
            folderId,
          });
        } else {
          const file = this.selectedFile();
          if (!file) {
            this.serverError.set('Seleccioná un archivo.');
            return;
          }
          await this.documentsService.upload({
            title: value.title,
            description: value.description || undefined,
            departmentId,
            folderId,
            file,
          });
        }

        this.toastService.success(this.isEdit() ? 'Documento actualizado.' : 'Documento subido.');
        await this.router.navigateByUrl('/documentos');
      } catch (error) {
        this.serverError.set(toApiErrorMessage(error));
      } finally {
        this.submitting.set(false);
      }
    });
  }

  /**
   * `true` (proceed) when the department wasn't touched, or the user
   * confirms losing the old department's access. `false` aborts the
   * submit entirely. A department that had none before (`originalDepartmentId`
   * is `null`) never prompts — there's no prior access to lose.
   */
  private async confirmDepartmentChangeIfAny(): Promise<boolean> {
    const original = this.originalDepartmentId();
    const next = this.model().departmentId;
    if (!original || original === next) return true;

    const originalName = this.departmentNameById().get(original) ?? 'El departamento actual';
    return this.confirmService.confirm({
      title: 'Cambiar de departamento',
      message: `${originalName} perderá acceso a este documento salvo que lo compartas. ¿Confirmás el cambio?`,
      confirmLabel: 'Cambiar departamento',
    });
  }

  protected readonly fieldError = fieldError;
}
