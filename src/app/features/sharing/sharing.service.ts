import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../core/api/api-url';
import type { ApiResponse } from '../../core/api/api-response';
import type { CreateShareInput, ShareEntry } from './sharing.models';

export type ShareableResourceType = 'documents' | 'folders';

/**
 * One service for both documents and folders — the routes are identical
 * shape (`/:resourceType/:id/shares`), same reasoning `AuditLogService`
 * used for being the one place that talks to a read-mostly sub-resource.
 * See `backend/src/modules/sharing/sharing.service.ts`.
 */
@Injectable({ providedIn: 'root' })
export class SharingService {
  private readonly http = inject(HttpClient);

  async list(resourceType: ShareableResourceType, resourceId: string): Promise<ShareEntry[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<ShareEntry[]>>(`${API_URL}/${resourceType}/${resourceId}/shares`),
    );
    return response.data;
  }

  async share(resourceType: ShareableResourceType, resourceId: string, input: CreateShareInput): Promise<ShareEntry> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<ShareEntry>>(`${API_URL}/${resourceType}/${resourceId}/shares`, input),
    );
    return response.data;
  }

  async unshare(resourceType: ShareableResourceType, resourceId: string, shareId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${API_URL}/${resourceType}/${resourceId}/shares/${shareId}`));
  }
}
