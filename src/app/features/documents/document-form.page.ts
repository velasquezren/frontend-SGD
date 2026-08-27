import { Component, computed, inject, input, linkedSignal, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
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
      departmentId: doc?.departmentId ?? '',
      // On create, default to the folder we navigated in from (?folderId=…); irrelevant once `doc` exists (edit mode).
      folderId: doc?.folderId ?? this.folderId() ?? '',
    };
  });

  protected readonly documentForm = form(this.model, (p) => {
    required(p.title, { message: 'El título es obligatorio.' });
    minLength(p.title, 2, { message: 'Debe tener al menos 2 caracteres.' });
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
      this.serverError.set(null);
      this.submitting.set(true);
      try {
        const value = this.model();
        const departmentId = value.departmentId || undefined;
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

  protected readonly fieldError = fieldError;
}
