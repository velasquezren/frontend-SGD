import { Component, computed, input } from '@angular/core';

export interface SparklinePoint {
  date: string;
  count: number;
}

/**
 * Minimal trend line for a single series over time (e.g. uploads/day) — no
 * axes, no grid, no tooltip: a sparkline's job is "is this going up or
 * down," not precise reading (see the `dataviz` skill's form heuristic —
 * a headline number plus this shape covers what a full line chart's axes
 * would otherwise be for here). `viewBox` + `vector-effect:
 * non-scaling-stroke` keep the 2px line crisp at any container width
 * without JS-measured layout.
 */
@Component({
  selector: 'ui-sparkline',
  template: `
    @if (data().length > 1) {
      <svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none" role="img" [attr.aria-label]="ariaLabel()">
        <polyline class="sparkline__line" [attr.points]="points()" />
      </svg>
    } @else {
      <p class="sparkline__empty">Sin datos todavía.</p>
    }
  `,
  styleUrl: './sparkline.scss',
})
export class UiSparkline {
  readonly data = input.required<SparklinePoint[]>();

  private readonly max = computed(() => Math.max(1, ...this.data().map((d) => d.count)));

  protected readonly points = computed(() => {
    const data = this.data();
    if (data.length < 2) return '';
    const stepX = 100 / (data.length - 1);
    return data
      .map((d, i) => `${(i * stepX).toFixed(2)},${(29 - (d.count / this.max()) * 27).toFixed(2)}`)
      .join(' ');
  });

  protected readonly ariaLabel = computed(() => {
    const total = this.data().reduce((sum, d) => sum + d.count, 0);
    return `${total} documentos subidos en los últimos ${this.data().length} días`;
  });
}
