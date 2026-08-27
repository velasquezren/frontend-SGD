import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../core/api/api-url';
import type { ApiResponse } from '../../core/api/api-response';
import type { PaginatedResponse } from '../../core/api/paginated-response';
import type { DocumentFile, UpdateDocumentInput } from './documents.models';

export interface ListDocumentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
  folderId?: string;
}

export interface UploadDocumentInput {
  title: string;
  description?: string;
  departmentId?: string;
  folderId?: string;
  file: File;
}

const BASE_URL = `${API_URL}/documents`;

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly http = inject(HttpClient);

  async list(params: ListDocumentsParams = {}): Promise<PaginatedResponse<DocumentFile>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.departmentId) httpParams = httpParams.set('departmentId', params.departmentId);
    if (params.folderId) httpParams = httpParams.set('folderId', params.folderId);

    const response = await firstValueFrom(
      this.http.get<ApiResponse<PaginatedResponse<DocumentFile>>>(BASE_URL, { params: httpParams }),
    );
    return response.data;
  }

  async get(id: string): Promise<DocumentFile> {
    const response = await firstValueFrom(this.http.get<ApiResponse<DocumentFile>>(`${BASE_URL}/${id}`));
    return response.data;
  }

  /** Multipart upload — don't set a Content-Type header manually, the browser adds the multipart boundary for `FormData` itself; `authInterceptor` only adds `Authorization`, so this stays compatible. */
  async upload(input: UploadDocumentInput): Promise<DocumentFile> {
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('title', input.title);
    if (input.description) formData.append('description', input.description);
    if (input.departmentId) formData.append('departmentId', input.departmentId);
    if (input.folderId) formData.append('folderId', input.folderId);

    const response = await firstValueFrom(this.http.post<ApiResponse<DocumentFile>>(BASE_URL, formData));
    return response.data;
  }

  async update(id: string, input: UpdateDocumentInput): Promise<DocumentFile> {
    const response = await firstValueFrom(this.http.patch<ApiResponse<DocumentFile>>(`${BASE_URL}/${id}`, input));
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${BASE_URL}/${id}`));
  }

  /**
   * A plain `<a href>` can't send the `Authorization` header, so the
   * download has to go through `HttpClient` as a blob, then get handed to
   * the browser via a throwaway object URL — the standard pattern for an
   * authenticated file download.
   */
  async download(id: string, fileName: string): Promise<void> {
    const url = await this.fetchBlobUrl(id);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Same fetch as `download`, but the caller decides what to do with the
   * object URL (render it in an `<iframe>`/`<img>`) instead of triggering a
   * save — used by the document preview modal. Caller owns revoking it
   * (`URL.revokeObjectURL`) once the preview closes.
   */
  async getPreviewUrl(id: string): Promise<string> {
    return this.fetchBlobUrl(id);
  }

  private async fetchBlobUrl(id: string): Promise<string> {
    const blob = await firstValueFrom(this.http.get(`${BASE_URL}/${id}/download`, { responseType: 'blob' }));
    return URL.createObjectURL(blob);
  }
}
