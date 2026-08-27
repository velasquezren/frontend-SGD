import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../core/api/api-url';
import type { ApiResponse } from '../../core/api/api-response';
import type { PaginatedResponse } from '../../core/api/paginated-response';
import type { CreateDepartmentInput, Department, UpdateDepartmentInput } from './departments.models';

export interface ListDepartmentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

const BASE_URL = `${API_URL}/departments`;

/**
 * Thin wrapper around `HttpClient`, one method per backend endpoint — same
 * shape as `backend/src/modules/departments/departments.service.ts` on
 * purpose. No generic `ApiResource<T>` base: this is the reference module,
 * copy this file's shape for a new one instead of trying to derive from it.
 */
@Injectable({ providedIn: 'root' })
export class DepartmentsService {
  private readonly http = inject(HttpClient);

  async list(params: ListDepartmentsParams = {}): Promise<PaginatedResponse<Department>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);

    const response = await firstValueFrom(
      this.http.get<ApiResponse<PaginatedResponse<Department>>>(BASE_URL, { params: httpParams }),
    );
    return response.data;
  }

  /** Every department, unpaginated — for the department `<select>` on the user form and the list's department column. */
  async listAll(): Promise<Department[]> {
    return (await this.list({ pageSize: 100 })).items;
  }

  async get(id: string): Promise<Department> {
    const response = await firstValueFrom(this.http.get<ApiResponse<Department>>(`${BASE_URL}/${id}`));
    return response.data;
  }

  async create(input: CreateDepartmentInput): Promise<Department> {
    const response = await firstValueFrom(this.http.post<ApiResponse<Department>>(BASE_URL, input));
    return response.data;
  }

  async update(id: string, input: UpdateDepartmentInput): Promise<Department> {
    const response = await firstValueFrom(this.http.patch<ApiResponse<Department>>(`${BASE_URL}/${id}`, input));
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/${id}`));
  }
}
