import { Component, computed, input, output } from '@angular/core';
import type { PaginationMeta } from '../../../core/api/paginated-response';
import { UiButton } from '../button/button';

/** Prev/next pager shared by every list page — the control itself is identical across modules, unlike the table columns. */
@Component({
  selector: 'ui-pagination',
  imports: [UiButton],
  template: `
    <div class="ui-pagination">
      <span>{{ summary() }}</span>
      <div class="ui-pagination__controls">
        <ui-button variant="ghost" size="sm" [disabled]="meta().page <= 1" (click)="pageChange.emit(meta().page - 1)">
          Anterior
        </ui-button>
        <ui-button
          variant="ghost"
          size="sm"
          [disabled]="meta().page >= meta().totalPages"
          (click)="pageChange.emit(meta().page + 1)"
        >
          Siguiente
        </ui-button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .ui-pagination__controls {
      display: flex;
      gap: var(--space-2);
    }
  `,
})
export class UiPagination {
  readonly meta = input.required<PaginationMeta>();
  readonly pageChange = output<number>();

  protected readonly summary = computed(() => {
    const m = this.meta();
    if (m.total === 0) return 'Sin resultados';
    const start = (m.page - 1) * m.pageSize + 1;
    const end = Math.min(m.page * m.pageSize, m.total);
    return `${start}–${end} de ${m.total}`;
  });
}
