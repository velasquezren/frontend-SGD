/** Mirrors `DocumentShare`/`FolderShare` in `backend/prisma/schema.prisma` — same shape for both, see `SharingService`'s doc-comment on the backend. */
export interface ShareEntry {
  id: string;
  departmentId: string | null;
  userId: string | null;
  sharedById: string | null;
  createdAt: string;
}

/** Mirrors `backend/src/modules/sharing/dto/create-share.dto.ts` — exactly one of the two, checked server-side. */
export interface CreateShareInput {
  departmentId?: string;
  userId?: string;
}
