/** Mirrors the `Document` model in `backend/prisma/schema.prisma`. */
export interface DocumentFile {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  departmentId: string | null;
  folderId: string | null;
  uploadedById: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Mirrors `backend/src/modules/documents/dto/update-document.dto.ts` — no file, metadata only (see its doc-comment: delete + re-upload to replace a file). */
export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  departmentId?: string;
  folderId?: string;
}
