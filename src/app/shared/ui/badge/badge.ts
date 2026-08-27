import { Component, computed, input } from '@angular/core';

export type BadgeVariant = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/** Small tag for a role/permission/status label. Same pattern as `ui-button`: typed variant, tokens-only. */
@Component({
  selector: 'ui-badge',
  template: `<span class="ui-badge" [class]="classes()"><ng-content /></span>`,
  styleUrl: './badge.scss',
})
export class UiBadge {
  readonly variant = input<BadgeVariant>('neutral');

  protected readonly classes = computed(() => `ui-badge--${this.variant()}`);
}
