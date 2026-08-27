import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/notifications/toast.service';

/** Mounted once at the app root (`app.html`) — see `ToastService` for why. */
@Component({
  selector: 'app-toast-viewport',
  template: `
    <div class="toast-viewport">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.variant" [attr.role]="toast.variant === 'error' ? 'alert' : 'status'">
          <span class="toast__message">{{ toast.message }}</span>
          <button type="button" class="toast__close" (click)="toastService.dismiss(toast.id)" aria-label="Cerrar notificación">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-viewport.scss',
})
export class ToastViewport {
  protected readonly toastService = inject(ToastService);
}
