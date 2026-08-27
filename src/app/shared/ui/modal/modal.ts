import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';

/**
 * Backdrop + focusable panel + content projection. The one modal primitive
 * the app has — `ConfirmDialogHost` and the document preview both build on
 * this instead of each rolling their own overlay.
 *
 * Accessibility: focuses the panel on open, closes on Escape or a backdrop
 * click. Not a full Tab-cycling focus trap — a deliberate simplification
 * for an internal admin tool, not a public-facing flow; revisit if that
 * changes.
 */
@Component({
  selector: 'ui-modal',
  host: {
    '(document:keydown.escape)': 'close.emit()',
  },
  template: `
    <div class="ui-modal-backdrop" (click)="close.emit()">
      <div
        #panel
        class="ui-modal-panel"
        [class.ui-modal-panel--wide]="wide()"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="label()"
        (click)="$event.stopPropagation()"
      >
        <button type="button" class="ui-modal-close" (click)="close.emit()" aria-label="Cerrar">×</button>
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './modal.scss',
})
export class UiModal {
  readonly label = input.required<string>();
  readonly wide = input(false);
  readonly close = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLDivElement>>('panel');

  constructor() {
    afterNextRender(() => this.panel()?.nativeElement.focus());
  }
}
