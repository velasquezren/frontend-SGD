import { Injectable, signal } from '@angular/core';

/** Not yet in `lib.dom.d.ts` — the standard is still a W3C draft. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * Wraps the `beforeinstallprompt` event so the UI can offer an explicit
 * "Instalar app" action (`AppShell`'s topbar) instead of relying on
 * people noticing the browser's own install icon in the address bar,
 * which most never do. `providedIn: 'root'` + injected once from `App`'s
 * constructor (alongside `PwaUpdateService`) so the listener is attached
 * from the moment the app boots, not only once someone happens to open
 * the page the button lives on.
 *
 * Chrome/Edge/Android fire `beforeinstallprompt`; Safari/iOS never does —
 * "Add to Home Screen" stays a manual Share-sheet action there by
 * platform design, no JS API exists to trigger it. `canInstall()` simply
 * stays `false` on iOS, so the button never renders there — no separate
 * "how to install on iOS" instructions are added here as a deliberate
 * scope cut; add them if iOS install rate ever turns out to matter.
 */
@Injectable({ providedIn: 'root' })
export class InstallPromptService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private readonly canInstallSignal = signal(false);

  readonly canInstall = this.canInstallSignal.asReadonly();

  constructor() {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Stop the browser's own mini-infobar so our button is the only entry point — avoids the two ever disagreeing about install state.
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstallSignal.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstallSignal.set(false);
    });
  }

  /** No-op if the browser hasn't offered a prompt (button is hidden in that case anyway — see `canInstall`). The captured event is one-shot: consumed here, a new one only arrives if the browser decides to offer again later. */
  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) return;
    const prompt = this.deferredPrompt;
    this.deferredPrompt = null;
    this.canInstallSignal.set(false);
    await prompt.prompt();
    await prompt.userChoice;
  }
}
