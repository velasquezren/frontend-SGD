import { ApplicationRef, Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { concat, first, interval } from 'rxjs';
import { ConfirmService } from '../dialogs/confirm.service';
import { ToastService } from '../notifications/toast.service';

/** Matches the interval Angular's own docs use for `checkForUpdate()` polling — frequent enough that a tab left open for days doesn't run stale code for long, infrequent enough to not matter for battery/data. */
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Wires the Angular service worker's update lifecycle into the app's own
 * UI. Left to its default, an installed/cached PWA only picks up a new
 * version on the *next* full reload — for a clinic tab that can stay open
 * for a whole shift, that's not good enough. This service, instantiated
 * once via `inject()` in `App`'s constructor so it starts listening the
 * moment the app boots:
 *
 * 1. Polls `checkForUpdate()` every 6h once the app is stable (never
 *    competes with first paint — see `ApplicationRef.isStable`).
 * 2. On `VERSION_READY`, asks via the existing `ConfirmService` (not a
 *    silent auto-reload — a form mid-edit shouldn't vanish) and reloads
 *    only if the user agrees.
 * 3. On `unrecoverable` (the running app and the cached index.html have
 *    drifted apart beyond repair), tells the user to reload via the
 *    existing `ToastService` rather than failing silently.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly updates = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);
  private readonly confirmService = inject(ConfirmService);
  private readonly toastService = inject(ToastService);

  constructor() {
    if (!this.updates.isEnabled) return;

    this.pollForUpdatesOnceStable();
    this.promptOnVersionReady();
    this.notifyOnUnrecoverable();
  }

  private pollForUpdatesOnceStable(): void {
    const appIsStable$ = this.appRef.isStable.pipe(first((isStable) => isStable));
    const everyInterval$ = interval(UPDATE_CHECK_INTERVAL_MS);
    concat(appIsStable$, everyInterval$).subscribe(() => {
      void this.updates.checkForUpdate();
    });
  }

  private promptOnVersionReady(): void {
    this.updates.versionUpdates.subscribe((event) => {
      if (event.type !== 'VERSION_READY') return;
      void this.offerReload();
    });
  }

  private async offerReload(): Promise<void> {
    const shouldReload = await this.confirmService.confirm({
      title: 'Nueva versión disponible',
      message: 'Hay una actualización de SGD Montalvo lista. Se recomienda actualizar ahora para evitar inconsistencias con el servidor.',
      confirmLabel: 'Actualizar ahora',
      cancelLabel: 'Más tarde',
    });
    if (shouldReload) {
      document.location.reload();
    }
  }

  private notifyOnUnrecoverable(): void {
    this.updates.unrecoverable.subscribe((event) => {
      this.toastService.error(`La aplicación quedó en un estado inconsistente (${event.reason}). Recargá la página.`);
    });
  }
}
