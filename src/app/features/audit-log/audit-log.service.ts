import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../core/api/api-url';
import type { ApiResponse } from '../../core/api/api-response';
import type { PaginatedResponse } from '../../core/api/paginated-response';
import type { AuditLogEntry } from './audit-log.models';

export interface ListAuditLogParams {
  page?: number;
  pageSize?: number;
  resourceType?: string;
  from?: string;
  to?: string;
}

const BASE_URL = `${API_URL}/audit-log`;

/** Same one-method-per-endpoint shape as every other feature service — this one only ever reads, see `backend/src/modules/audit-log/audit-log.service.ts`. */
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);

  async list(params: ListAuditLogParams = {}): Promise<PaginatedResponse<AuditLogEntry>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    if (params.resourceType) httpParams = httpParams.set('resourceType', params.resourceType);
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);

    const response = await firstValueFrom(
      this.http.get<ApiResponse<PaginatedResponse<AuditLogEntry>>>(BASE_URL, { params: httpParams }),
    );
    return response.data;
  }
}
