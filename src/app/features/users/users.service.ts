import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../core/api/api-url';
import type { ApiResponse } from '../../core/api/api-response';
import type { PaginatedResponse } from '../../core/api/paginated-response';
import type { CreateUserInput, UpdateUserInput, User, UserStats } from './users.models';

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
  isActive?: boolean;
}

const BASE_URL = `${API_URL}/users`;

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  async list(params: ListUsersParams = {}): Promise<PaginatedResponse<User>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.departmentId) httpParams = httpParams.set('departmentId', params.departmentId);
    if (params.isActive !== undefined) httpParams = httpParams.set('isActive', String(params.isActive));

    const response = await firstValueFrom(
      this.http.get<ApiResponse<PaginatedResponse<User>>>(BASE_URL, { params: httpParams }),
    );
    return response.data;
  }

  async get(id: string): Promise<User> {
    const response = await firstValueFrom(this.http.get<ApiResponse<User>>(`${BASE_URL}/${id}`));
    return response.data;
  }

  /** Admin-only (same `users:read` gate as `list()`) — powers the dashboard's users-by-role chart. */
  async getStats(): Promise<UserStats> {
    const response = await firstValueFrom(this.http.get<ApiResponse<UserStats>>(`${BASE_URL}/stats`));
    return response.data;
  }

  async create(input: CreateUserInput): Promise<User> {
    const response = await firstValueFrom(this.http.post<ApiResponse<User>>(BASE_URL, input));
    return response.data;
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const response = await firstValueFrom(this.http.patch<ApiResponse<User>>(`${BASE_URL}/${id}`, input));
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/${id}`));
  }
}
