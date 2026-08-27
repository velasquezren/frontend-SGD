import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button as `ui-button` `variant="danger"` — use for destructive actions (delete). */
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * Promise-based confirm dialog, replacing the browser's native `confirm()`
 * everywhere in the app. `ConfirmDialogHost` (mounted once at the app root)
 * is the only thing that reads `pending()` — call sites just
 * `await confirmService.confirm({ ... })`.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly pendingSignal = signal<PendingConfirm | null>(null);

  readonly pending = this.pendingSignal.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendingSignal.set({ ...options, resolve });
    });
  }

  respond(value: boolean): void {
    this.pendingSignal()?.resolve(value);
    this.pendingSignal.set(null);
  }
}
