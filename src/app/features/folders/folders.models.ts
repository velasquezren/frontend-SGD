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
  departmentId?: string;
}

/** Mirrors `backend/src/modules/folders/dto/update-folder.dto.ts`. */
export type UpdateFolderInput = Partial<CreateFolderInput>;
