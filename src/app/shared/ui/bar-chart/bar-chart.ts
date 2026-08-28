import { Component, computed, input } from '@angular/core';

export interface BarChartDatum {
  label: string;
  value: number;
}

/**
 * Horizontal bar chart, single series (one color, `--color-primary` —
 * identity here comes from the row label, not from color, so a second hue
 * per bar would be noise, not signal: see the `dataviz` skill's color
 * formula). CSS/DOM bars rather than hand-rolled SVG scaling — every label
 * is real, selectable text, so screen readers get it for free with no
 * separate table fallback needed. Reused for both the dashboard's
 * documents-by-department and users-by-role widgets rather than two
 * near-identical components.
 */
@Component({
  selector: 'ui-bar-chart',
  template: `
    @if (data().length) {
      <div class="bar-chart" role="img" [attr.aria-label]="ariaLabel()">
        @for (item of data(); track item.label) {
          <div class="bar-chart__row">
            <span class="bar-chart__label">{{ item.label }}</span>
            <div class="bar-chart__track">
              <div class="bar-chart__fill" [style.inline-size.%]="percentFor(item.value)"></div>
            </div>
            <span class="bar-chart__value">{{ item.value }}</span>
          </div>
        }
      </div>
    } @else {
      <p class="bar-chart__empty">{{ emptyMessage() }}</p>
    }
  `,
  styleUrl: './bar-chart.scss',
})
export class UiBarChart {
  readonly data = input.required<BarChartDatum[]>();
  readonly unitLabel = input('');
  readonly emptyMessage = input('Sin datos todavía.');

  private readonly max = computed(() => Math.max(1, ...this.data().map((d) => d.value)));

  protected readonly ariaLabel = computed(() =>
    this.data()
      .map((d) => `${d.label}: ${d.value}${this.unitLabel() ? ' ' + this.unitLabel() : ''}`)
      .join('. '),
  );

  protected percentFor(value: number): number {
    if (value <= 0) return 0;
    // Floor of 3% so a small-but-nonzero value is still visible as a sliver, not an invisible bar.
    return Math.max(3, (value / this.max()) * 100);
  }
}
