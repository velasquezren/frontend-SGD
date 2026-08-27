import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a user-facing message from a failed API call. Backend errors are
 * shaped by its global `HttpExceptionFilter`
 * (`backend/src/common/filters/http-exception.filter.ts`):
 * `{ statusCode, error, message, path, timestamp }`, where `message` is a
 * string, or a string array for class-validator DTO errors.
 */
export function toApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado. Intentá de nuevo.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con el servidor. ¿Está corriendo el backend?';
    const body = error.error as { message?: string | string[] } | undefined;
    const message = body?.message;
    if (Array.isArray(message) && message.length) return message[0];
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
