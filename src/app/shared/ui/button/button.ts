import { Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Base button primitive for the Clínica Montalvo design system.
 *
 * Every visual value comes from design tokens (src/styles/_tokens.scss) —
 * see button.scss. Treat this component as the reference pattern for new
 * `ui-*` primitives: signal-based inputs, tokens-only styling, no
 * hardcoded colors/sizes.
 */
@Component({
  selector: 'ui-button',
  host: {
    // :host is `display: inline-block` by default (see button.scss); a
    // full-width button needs its host to actually take up the row too,
    // not just the inner <button> element.
    '[class.ui-button-host--full]': 'fullWidth()',
  },
  template: `
    <button
      class="ui-button"
      [class]="classes()"
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() || null"
    >
      @if (loading()) {
        <span class="ui-button__spinner" aria-hidden="true"></span>
      }
      <span class="ui-button__label"><ng-content /></span>
    </button>
  `,
  styleUrl: './button.scss',
})
export class UiButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly fullWidth = input(false);

  protected readonly classes = computed(
    () => `ui-button--${this.variant()} ui-button--${this.size()}${this.fullWidth() ? ' ui-button--full' : ''}`,
  );
}
