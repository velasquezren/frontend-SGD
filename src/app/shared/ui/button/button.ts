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
      [attr.aria-label]="ariaLabel()"
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
  /**
   * A plain `aria-label="..."` written on `<ui-button>` lands on this
   * component's *host* element by default (Angular attribute passthrough)
   * — inert there, since the host has no ARIA role and isn't the actual
   * interactive control. Aliased so it's still written the same way at
   * every call site, but now actually forwarded to the inner `<button>`
   * screen readers need it on. Every icon-only `ui-button` (no visible
   * text label) must set this — see `pdf-viewer.ts`'s zoom controls.
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  protected readonly classes = computed(
    () => `ui-button--${this.variant()} ui-button--${this.size()}${this.fullWidth() ? ' ui-button--full' : ''}`,
  );
}
