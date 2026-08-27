import { Component, input } from '@angular/core';

/**
 * Label + hint/error scaffolding around a projected native form control.
 *
 * Signal Forms binds `[formField]` straight onto the native `<input>` (no
 * value-accessor wrapper component), so this primitive only owns the
 * surrounding markup — the caller places the real `<input class="ui-input"
 * [formField]="...">` in the projected content and points `for`/`id` at
 * each other. See `src/styles/_forms.scss` for the token-only `.ui-input`
 * class and `DESIGN_SYSTEM.md` §7 for why this differs from `ui-button`.
 */
@Component({
  selector: 'ui-field',
  template: `
    <div class="ui-field" [class.ui-field--invalid]="invalid()">
      <label class="ui-label" [attr.for]="for()">{{ label() }}</label>
      <ng-content />
      @if (error(); as message) {
        <p class="ui-field__error" [id]="for() + '-error'" role="alert">{{ message }}</p>
      } @else if (hint(); as message) {
        <p class="ui-field__hint" [id]="for() + '-hint'">{{ message }}</p>
      }
    </div>
  `,
})
export class UiField {
  /** Must match the projected control's `id`. */
  readonly for = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly invalid = input(false);
}
