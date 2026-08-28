import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InstallPromptService } from './core/pwa/install-prompt.service';
import { PwaUpdateService } from './core/pwa/pwa-update.service';
import { ConfirmDialogHost } from './shared/ui/confirm-dialog-host/confirm-dialog-host';
import { ToastViewport } from './shared/ui/toast/toast-viewport';

@Component({
  imports: [RouterOutlet, ToastViewport, ConfirmDialogHost],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  // Injected only to start their constructor-driven listening (service
  // worker update polling, `beforeinstallprompt` capture) from the moment
  // the app boots — see each service's doc-comment. Nothing here reads
  // their state; `AppShell` injects the same singletons where the UI
  // (update dialog via ConfirmService, "Instalar app" button) lives.
  private readonly pwaUpdateService = inject(PwaUpdateService);
  private readonly installPromptService = inject(InstallPromptService);
}
