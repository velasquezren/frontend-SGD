import { Component, ElementRef, computed, effect, input, resource, signal, viewChild } from '@angular/core';
import { UiButton } from '../button/button';

// Type-only — erased at compile time, so referencing it here doesn't pull
// `pdfjs-dist`'s ~340KB into whatever chunk this file ends up in. The
// actual module is loaded at runtime by `loadPdfjs()` below.
type PdfjsModule = typeof import('pdfjs-dist');
type PdfDocument = Awaited<ReturnType<PdfjsModule['getDocument']>['promise']>;

let pdfjsModulePromise: Promise<PdfjsModule> | undefined;

/**
 * Loads `pdfjs-dist` on first actual use, not at app-bundle time. It used
 * to be a top-level `import * as pdfjsLib from 'pdfjs-dist'` — that put the
 * whole library in whatever chunk imported `UiPdfViewer` even when no
 * preview was ever opened, which is why `document-list-page` was the
 * heaviest chunk in the app (449 KB raw / 112 KB transfer, confirmed via
 * `npm run build`) despite most visits never previewing a PDF. A dynamic
 * `import()` here makes the Angular/esbuild build split `pdfjs-dist` into
 * its own on-demand chunk instead.
 *
 * `GlobalWorkerOptions.workerSrc` still points at the fixed public path
 * `angular.json`'s `assets` config copies `pdf.worker.min.mjs` to — same
 * reasoning as before, just set once the module actually resolves instead
 * of at import time.
 */
function loadPdfjs(): Promise<PdfjsModule> {
  pdfjsModulePromise ??= import('pdfjs-dist').then((mod) => {
    mod.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    return mod;
  });
  return pdfjsModulePromise;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.6;
const SCALE_STEP = 0.2;

/**
 * Renders a PDF page-by-page onto a `<canvas>` using `pdfjs-dist` — the
 * actual engine Chrome/Firefox use internally — instead of a raw
 * `<iframe src="blob:...">`, which silently renders blank whenever the
 * browser has no built-in PDF plugin (confirmed via a real headless-Chromium
 * screenshot before this component existed). Deliberately not a pre-styled
 * third-party viewer component (e.g. ngx-extended-pdf-viewer): the toolbar
 * here is `ui-button`, same tokens as everything else.
 */
@Component({
  selector: 'ui-pdf-viewer',
  imports: [UiButton],
  template: `
    <div class="pdf-viewer">
      <div class="pdf-viewer__toolbar">
        <ui-button variant="ghost" size="sm" [disabled]="pageNumber() <= 1" (click)="previousPage()">
          ← Anterior
        </ui-button>

        <span class="pdf-viewer__status">
          @if (documentResource.isLoading()) {
            Cargando…
          } @else if (documentResource.error()) {
            No se pudo mostrar el PDF.
          } @else {
            Página {{ pageNumber() }} de {{ pageCount() }}
          }
        </span>

        <ui-button variant="ghost" size="sm" [disabled]="pageNumber() >= pageCount()" (click)="nextPage()">
          Siguiente →
        </ui-button>

        <span class="pdf-viewer__toolbar-spacer"></span>

        <ui-button variant="ghost" size="sm" [disabled]="scale() <= minScale" (click)="zoomOut()" aria-label="Alejar">
          −
        </ui-button>
        <span class="pdf-viewer__status">{{ zoomPercent() }}%</span>
        <ui-button variant="ghost" size="sm" [disabled]="scale() >= maxScale" (click)="zoomIn()" aria-label="Acercar">
          +
        </ui-button>
      </div>

      <div class="pdf-viewer__canvas-wrap">
        <canvas #canvas class="pdf-viewer__canvas"></canvas>
      </div>
    </div>
  `,
  styleUrl: './pdf-viewer.scss',
})
export class UiPdfViewer {
  readonly url = input.required<string>();

  protected readonly minScale = MIN_SCALE;
  protected readonly maxScale = MAX_SCALE;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly pageNumber = signal(1);
  protected readonly scale = signal(1.3);
  protected readonly zoomPercent = computed(() => Math.round((this.scale() / 1.3) * 100));

  protected readonly documentResource = resource({
    params: () => this.url(),
    loader: async ({ params: url }) => {
      const pdfjsLib = await loadPdfjs();
      return pdfjsLib.getDocument({ url }).promise;
    },
  });

  protected readonly pageCount = computed(() => this.documentResource.value()?.numPages ?? 0);

  constructor() {
    // Re-render whenever the loaded document, the current page, or the
    // zoom level changes. `render()` is async; the effect itself stays sync
    // (fire-and-forget is correct here — a stale in-flight render is simply
    // overwritten by the next one).
    effect(() => {
      const doc = this.documentResource.value();
      const pageNumber = this.pageNumber();
      const scale = this.scale();
      if (!doc) return;
      void this.renderPage(doc, pageNumber, scale);
    });
  }

  protected previousPage(): void {
    this.pageNumber.update((n) => Math.max(1, n - 1));
  }

  protected nextPage(): void {
    this.pageNumber.update((n) => Math.min(this.pageCount(), n + 1));
  }

  protected zoomIn(): void {
    this.scale.update((s) => Math.min(MAX_SCALE, Number((s + SCALE_STEP).toFixed(2))));
  }

  protected zoomOut(): void {
    this.scale.update((s) => Math.max(MIN_SCALE, Number((s - SCALE_STEP).toFixed(2))));
  }

  private async renderPage(doc: PdfDocument, pageNumber: number, scale: number): Promise<void> {
    const page = await doc.getPage(Math.min(pageNumber, doc.numPages));
    const viewport = page.getViewport({ scale });
    const canvas = this.canvas().nativeElement;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport, canvas }).promise;
  }
}
