import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../core/api/api-url';
import type { ApiResponse } from '../../core/api/api-response';
import type { CreateFolderInput, Folder, UpdateFolderInput } from './folders.models';

const BASE_URL = `${API_URL}/folders`;

/**
 * Thin wrapper around `HttpClient`, same shape as `DepartmentsService` —
 * see its doc-comment. One difference: `list()` is unpaginated (mirrors
 * `GET /folders` on the backend, see `ListFoldersQueryDto`'s doc-comment)
 * because the frontend needs every folder at once to build the tree.
 */
@Injectable({ providedIn: 'root' })
export class FoldersService {
  private readonly http = inject(HttpClient);

  async list(): Promise<Folder[]> {
    const response = await firstValueFrom(this.http.get<ApiResponse<Folder[]>>(BASE_URL));
    return response.data;
  }

  async create(input: CreateFolderInput): Promise<Folder> {
    const response = await firstValueFrom(this.http.post<ApiResponse<Folder>>(BASE_URL, input));
    return response.data;
  }

  async update(id: string, input: UpdateFolderInput): Promise<Folder> {
    const response = await firstValueFrom(this.http.patch<ApiResponse<Folder>>(`${BASE_URL}/${id}`, input));
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/${id}`));
  }
}
