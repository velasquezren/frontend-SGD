import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { AuthService } from '../../core/auth/auth.service';
import { PERMISSIONS } from '../../core/auth/permissions';
import { ConfirmService } from '../../core/dialogs/confirm.service';
import { toApiErrorMessage } from '../../core/http/api-error.util';
import { ToastService } from '../../core/notifications/toast.service';
import { debounce } from '../../core/utils/debounce';
import { fieldError } from '../../core/utils/field-error';
import { formatFileSize } from '../../core/utils/format-file-size';
import { DepartmentsService } from '../departments/departments.service';
import type { Folder } from '../folders/folders.models';
import { FoldersService } from '../folders/folders.service';
import { UiBadge } from '../../shared/ui/badge/badge';
import { UiButton } from '../../shared/ui/button/button';
import { UiField } from '../../shared/ui/field/field';
import { UiModal } from '../../shared/ui/modal/modal';
import { UiPagination } from '../../shared/ui/pagination/pagination';
import { UiPdfViewer } from '../../shared/ui/pdf-viewer/pdf-viewer';
import type { DocumentFile } from './documents.models';
import { DocumentsService } from './documents.service';

const PAGE_SIZE = 20;

/** Mime types the preview modal can actually render — everything else only gets a download button. */
const PREVIEWABLE_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);

interface PreviewState {
  document: DocumentFile;
  url: string;
}

@Component({
  selector: 'app-document-list-page',
  imports: [FormField, RouterLink, UiBadge, UiButton, UiField, UiModal, UiPagination, UiPdfViewer],
  templateUrl: './document-list.page.html',
  styleUrl: './document-list.page.scss',
})
export class DocumentListPage {
  private readonly documentsService = inject(DocumentsService);
  private readonly departmentsService = inject(DepartmentsService);
  private readonly foldersService = inject(FoldersService);
  private readonly confirmService = inject(ConfirmService);
  private readonly toastService = inject(ToastService);
  protected readonly authService = inject(AuthService);
  protected readonly PERMISSIONS = PERMISSIONS;
  protected readonly formatFileSize = formatFileSize;
  protected readonly fieldError = fieldError;

  protected readonly searchTerm = signal('');
  private readonly search = signal('');
  protected readonly page = signal(1);

  private readonly debouncedSearch = debounce((value: string) => {
    this.search.set(value);
    this.page.set(1);
  }, 300);

  // Folder currently being browsed — `null` is the root ("Documentos").
  // Not synced to the URL, same convention as `search` above.
  protected readonly currentFolderId = signal<string | null>(null);

  protected readonly foldersResource = resource({ loader: () => this.foldersService.list() });

  private readonly foldersById = computed(() => {
    const map = new Map<string, Folder>();
    for (const folder of this.foldersResource.value() ?? []) {
      map.set(folder.id, folder);
    }
    return map;
  });

  /** Root → current folder, for the breadcrumb. Walks `parentId` up from the current folder. */
  protected readonly breadcrumb = computed(() => {
    const byId = this.foldersById();
    const trail: Folder[] = [];
    let current = this.currentFolderId() ? byId.get(this.currentFolderId()!) : undefined;
    while (current) {
      trail.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return trail;
  });

  /** Folders directly inside the folder being browsed. */
  protected readonly subfolders = computed(() =>
    (this.foldersResource.value() ?? [])
      .filter((folder) => folder.parentId === this.currentFolderId())
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  // At the root, show every document (unfiled + all folders combined) —
  // same behavior as before folders existed. Inside a folder, filter to it.
  protected readonly documentsResource = resource({
    params: () => ({ page: this.page(), search: this.search(), folderId: this.currentFolderId() }),
    loader: ({ params }) =>
      this.documentsService.list({
        page: params.page,
        pageSize: PAGE_SIZE,
        search: params.search || undefined,
        folderId: params.folderId ?? undefined,
      }),
  });

  private readonly departmentsResource = resource({ loader: () => this.departmentsService.listAll() });

  protected readonly departmentNameById = computed(() => {
    const map = new Map<string, string>();
    for (const department of this.departmentsResource.value() ?? []) {
      map.set(department.id, department.name);
    }
    return map;
  });

  protected readonly preview = signal<PreviewState | null>(null);

  protected readonly newFolderOpen = signal(false);
  private readonly newFolderModel = signal({ name: '' });
  protected readonly newFolderForm = form(this.newFolderModel, (p) => {
    required(p.name, { message: 'El nombre es obligatorio.' });
    minLength(p.name, 2, { message: 'Debe tener al menos 2 caracteres.' });
  });
  protected readonly creatingFolder = signal(false);

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.debouncedSearch(value);
  }

  protected canPreview(doc: DocumentFile): boolean {
    return PREVIEWABLE_MIME_TYPES.has(doc.mimeType);
  }

  protected isImage(doc: DocumentFile): boolean {
    return doc.mimeType.startsWith('image/');
  }

  protected async onPreview(doc: DocumentFile): Promise<void> {
    try {
      const url = await this.documentsService.getPreviewUrl(doc.id);
      this.preview.set({ document: doc, url });
    } catch (error) {
      this.toastService.error(toApiErrorMessage(error));
    }
  }

  protected closePreview(): void {
    const current = this.preview();
    if (current) URL.revokeObjectURL(current.url);
    this.preview.set(null);
  }

  protected async onDownload(doc: DocumentFile): Promise<void> {
    await this.documentsService.download(doc.id, doc.fileName);
  }

  protected async onDelete(doc: DocumentFile): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar documento',
      message: `¿Eliminar "${doc.title}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await this.documentsService.remove(doc.id);
      this.toastService.success(`Documento "${doc.title}" eliminado.`);
      this.documentsResource.reload();
    } catch (error) {
      this.toastService.error(toApiErrorMessage(error));
    }
  }

  protected openFolder(folder: Folder): void {
    this.currentFolderId.set(folder.id);
    this.page.set(1);
  }

  protected goToRoot(): void {
    this.currentFolderId.set(null);
    this.page.set(1);
  }

  protected openNewFolderModal(): void {
    this.newFolderModel.set({ name: '' });
    this.newFolderOpen.set(true);
  }

  protected closeNewFolderModal(): void {
    this.newFolderOpen.set(false);
  }

  protected onSubmitNewFolder(): void {
    submit(this.newFolderForm, async () => {
      this.creatingFolder.set(true);
      try {
        const parentId = this.currentFolderId();
        await this.foldersService.create({ name: this.newFolderModel().name, parentId: parentId ?? undefined });
        this.toastService.success('Carpeta creada.');
        this.newFolderOpen.set(false);
        this.foldersResource.reload();
      } catch (error) {
        this.toastService.error(toApiErrorMessage(error));
      } finally {
        this.creatingFolder.set(false);
      }
    });
  }

  protected async onDeleteFolder(folder: Folder): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar carpeta',
      message: `¿Eliminar "${folder.name}"? Sus subcarpetas se moverán un nivel arriba; los documentos que contiene no se eliminan.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await this.foldersService.remove(folder.id);
      this.toastService.success(`Carpeta "${folder.name}" eliminada.`);
      this.foldersResource.reload();
    } catch (error) {
      this.toastService.error(toApiErrorMessage(error));
    }
  }
}
