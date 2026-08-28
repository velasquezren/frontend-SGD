import { Component, computed, inject, input, resource, signal } from '@angular/core';
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
import { ShareDialog } from '../sharing/share-dialog';
import { UiBadge } from '../../shared/ui/badge/badge';
import { UiButton } from '../../shared/ui/button/button';
import { UiField } from '../../shared/ui/field/field';
import { UiModal } from '../../shared/ui/modal/modal';
import { UiPagination } from '../../shared/ui/pagination/pagination';
import { UiPdfViewer } from '../../shared/ui/pdf-viewer/pdf-viewer';
import type { DocumentFile } from './documents.models';
import { DocumentsService } from './documents.service';

const PAGE_SIZE = 20;

/** What's open in the "Compartir" dialog — a document or a folder, same component either way (see `ShareDialog`). */
interface SharingTarget {
  resourceType: 'documents' | 'folders';
  resourceId: string;
  resourceName: string;
  ownerDepartmentId: string | null;
}

/** Mime types the preview modal can actually render — everything else only gets a download button. */
const PREVIEWABLE_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);

interface PreviewState {
  document: DocumentFile;
  url: string;
}

@Component({
  selector: 'app-document-list-page',
  imports: [FormField, RouterLink, ShareDialog, UiBadge, UiButton, UiField, UiModal, UiPagination, UiPdfViewer],
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

  /**
   * `?search=...` — lets a link deep into a filtered view of this list
   * (e.g. one pasted into an email or chat) land pre-filtered instead of
   * a bare "open the app and find it yourself." Binds automatically via
   * `withComponentInputBinding()` (see `app.config.ts`); the alias keeps
   * the URL param name independent of this field's own name. Not used by
   * the WhatsApp share button below anymore — that shares the actual file
   * now, not a link — but kept as its own small, independently useful
   * piece (bookmarking/sharing a filtered view by any other means).
   */
  readonly searchQuery = input('', { alias: 'search' });

  protected readonly searchTerm = signal(this.searchQuery());
  private readonly search = signal(this.searchQuery());
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

  // `protected`, not `private`: the new-folder modal's department `<select>` reads this directly (the name-lookup map below isn't enough there — it needs the full list to render options).
  protected readonly departmentsResource = resource({ loader: () => this.departmentsService.listAll() });

  protected readonly departmentNameById = computed(() => {
    const map = new Map<string, string>();
    for (const department of this.departmentsResource.value() ?? []) {
      map.set(department.id, department.name);
    }
    return map;
  });

  protected readonly preview = signal<PreviewState | null>(null);
  protected readonly sharingTarget = signal<SharingTarget | null>(null);

  /** The folder currently being browsed, if any — used to default a new subfolder's department to its parent's, and read by the "Compartir"/ownership checks below. */
  private readonly currentFolder = computed(() =>
    this.currentFolderId() ? (this.foldersById().get(this.currentFolderId()!) ?? null) : null,
  );

  protected readonly newFolderOpen = signal(false);
  private readonly newFolderModel = signal({ name: '', departmentId: '' });
  protected readonly newFolderForm = form(this.newFolderModel, (p) => {
    required(p.name, { message: 'El nombre es obligatorio.' });
    minLength(p.name, 2, { message: 'Debe tener al menos 2 caracteres.' });
    required(p.departmentId, { message: 'El departamento es obligatorio.' });
  });
  protected readonly creatingFolder = signal(false);

  /** Own department, or ADMINISTRADOR — the same rule `SharingService.isOwner` enforces server-side, mirrored here purely to decide what to render (the server is still the real gate). */
  protected isOwnedByMe(departmentId: string | null): boolean {
    const user = this.authService.user();
    if (!user) return false;
    return user.role === 'ADMINISTRADOR' || (departmentId !== null && departmentId === user.departmentId);
  }

  /** Shows a "Compartido" badge — visible in the list, but not through direct department ownership, so it must be here via a share. Never true for ADMINISTRADOR (they see everything regardless, the badge would be meaningless). */
  protected isSharedNotOwned(departmentId: string | null): boolean {
    const user = this.authService.user();
    if (!user || user.role === 'ADMINISTRADOR') return false;
    return departmentId !== user.departmentId;
  }

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

  /**
   * The document id currently being prepared for sharing — download is
   * async (fetches the actual file bytes first), so each row's "WhatsApp"
   * button needs its own loading state rather than one global flag.
   */
  protected readonly sharingDocId = signal<string | null>(null);

  /**
   * Shares the actual file, not a link to it — WhatsApp's own web
   * integration (`wa.me`/`api.whatsapp.com`) only ever accepts pre-filled
   * *text*; there is no public WhatsApp URL that attaches a file, by
   * WhatsApp's own design (nothing this app can do about that). The only
   * real way a web page hands a file to WhatsApp is the OS's native share
   * sheet, via the Web Share API's `files` support — this fetches the
   * document's bytes (same authenticated endpoint `onDownload` uses, see
   * `DocumentsService.getFileBlob`), wraps them in a `File`, and lets the
   * OS sheet open with WhatsApp as one of the apps offered (assuming it's
   * installed — this can't target WhatsApp specifically, only "share",
   * same as every other app using this API).
   *
   * Where the browser can't share files at all (`canShare` false — most
   * desktop Firefox, and any non-HTTPS/non-localhost context), this falls
   * back to a plain download with a toast explaining why, rather than
   * silently reverting to the old link-only behavior the file-sharing
   * request was specifically asking to move away from.
   *
   * Available to anyone who can already see the document (no ownership
   * gate) — sending a copy of something you can already read doesn't
   * grant anyone new access, same read-only spirit as the "Compartir"
   * department/user sharing feature without actually being it.
   */
  protected async shareViaWhatsapp(doc: DocumentFile): Promise<void> {
    this.sharingDocId.set(doc.id);
    try {
      const blob = await this.documentsService.getFileBlob(doc.id);
      const file = new File([blob], doc.fileName, { type: doc.mimeType });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: doc.title });
        return;
      }

      // No file-sharing support in this browser/context — hand over the
      // actual file the only way still available (a download) instead of
      // falling back to a link.
      const url = URL.createObjectURL(file);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        link.click();
      } finally {
        URL.revokeObjectURL(url);
      }
      this.toastService.info('Este navegador no permite compartir archivos directamente. Se descargó el documento — adjuntalo desde WhatsApp manualmente.');
    } catch (error) {
      // The user closing the native share sheet without picking anything
      // throws AbortError — that's a cancel, not a failure.
      if (error instanceof Error && error.name === 'AbortError') return;
      this.toastService.error(toApiErrorMessage(error));
    } finally {
      this.sharingDocId.set(null);
    }
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
    // Defaults to the folder being browsed's own department when creating
    // a subfolder (a subfolder naturally belongs with its parent), else
    // the caller's own department.
    const defaultDepartmentId = this.currentFolder()?.departmentId ?? this.authService.user()?.departmentId ?? '';
    this.newFolderModel.set({ name: '', departmentId: defaultDepartmentId });
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
        const { name, departmentId } = this.newFolderModel();
        await this.foldersService.create({ name, departmentId, parentId: parentId ?? undefined });
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

  protected openShareDialog(target: SharingTarget): void {
    this.sharingTarget.set(target);
  }

  protected closeShareDialog(): void {
    this.sharingTarget.set(null);
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
