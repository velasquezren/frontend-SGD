import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

/**
 * Global, signal-based toast queue. `ToastViewport` (mounted once at the
 * app root, in `app.html`, outside the router outlet) is the only consumer
 * of `toasts()` — everything else just calls `success`/`error`/`info`.
 * Surviving route navigation is the point: fire a toast right before
 * `router.navigateByUrl(...)` on a form's success path and it's still
 * visible on the list page that follows.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSignal = signal<Toast[]>([]);
  private idCounter = 0;

  readonly toasts = this.toastsSignal.asReadonly();

  success(message: string): void {
    this.push(message, 'success', 4000);
  }

  error(message: string): void {
    this.push(message, 'error', 6000);
  }

  info(message: string): void {
    this.push(message, 'info', 4000);
  }

  dismiss(id: number): void {
    this.toastsSignal.update((list) => list.filter((toast) => toast.id !== id));
  }

  private push(message: string, variant: ToastVariant, durationMs: number): void {
    this.idCounter += 1;
    const id = this.idCounter;
    this.toastsSignal.update((list) => [...list, { id, message, variant }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }
}
