/**
 * Every backend response is wrapped in this envelope by its global
 * `ResponseInterceptor` (see `backend/src/common/interceptors/response.interceptor.ts`).
 * Mirror it here rather than reading `.data` ad hoc in each call site.
 */
export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

/** Matches `backend/src/app.service.ts`'s `HealthStatus`. */
export interface HealthStatus {
  status: 'ok';
  service: string;
  timestamp: string;
}
