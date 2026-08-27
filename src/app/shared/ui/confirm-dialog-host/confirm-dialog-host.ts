import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../../core/dialogs/confirm.service';
import { UiButton } from '../button/button';
import { UiModal } from '../modal/modal';

/** Mounted once at the app root (`app.html`) — see `ConfirmService`. */
@Component({
  selector: 'app-confirm-dialog-host',
  imports: [UiButton, UiModal],
  template: `
    @if (confirmService.pending(); as request) {
      <ui-modal [label]="request.title" (close)="confirmService.respond(false)">
        <h2 class="confirm-dialog__title">{{ request.title }}</h2>
        <p class="confirm-dialog__message">{{ request.message }}</p>
        <div class="ui-form-actions">
          <ui-button [variant]="request.danger ? 'danger' : 'primary'" (click)="confirmService.respond(true)">
            {{ request.confirmLabel ?? 'Confirmar' }}
          </ui-button>
          <ui-button variant="ghost" (click)="confirmService.respond(false)">
            {{ request.cancelLabel ?? 'Cancelar' }}
          </ui-button>
        </div>
      </ui-modal>
    }
  `,
  styleUrl: './confirm-dialog-host.scss',
})
export class ConfirmDialogHost {
  protected readonly confirmService = inject(ConfirmService);
}
