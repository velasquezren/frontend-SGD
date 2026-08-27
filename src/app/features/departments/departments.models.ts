/** Mirrors the `Department` model in `backend/prisma/schema.prisma`. */
export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Mirrors `backend/src/modules/departments/dto/create-department.dto.ts`. */
export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
}

/** Mirrors `backend/src/modules/departments/dto/update-department.dto.ts`. */
export interface UpdateDepartmentInput extends Partial<CreateDepartmentInput> {
  isActive?: boolean;
}
