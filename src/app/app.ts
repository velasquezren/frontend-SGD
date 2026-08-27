import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogHost } from './shared/ui/confirm-dialog-host/confirm-dialog-host';
import { ToastViewport } from './shared/ui/toast/toast-viewport';

@Component({
  imports: [RouterOutlet, ToastViewport, ConfirmDialogHost],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
