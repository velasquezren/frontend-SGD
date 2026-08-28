/** Mirrors the `Folder` model in `backend/prisma/schema.prisma`. */
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Mirrors `backend/src/modules/folders/dto/create-folder.dto.ts`. */
export interface CreateFolderInput {
  name: string;
  parentId?: string;
  /** Owning department — required since ADR 0006, see docs/adr/0006-department-scoped-visibility.md. */
  departmentId: string;
}

/** Mirrors `backend/src/modules/folders/dto/update-folder.dto.ts`. */
export type UpdateFolderInput = Partial<CreateFolderInput>;
