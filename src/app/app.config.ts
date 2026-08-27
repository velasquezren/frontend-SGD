import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    // withComponentInputBinding: route params (e.g. `:id`) bind straight to
    // a matching `input()` on the routed component — see
    // DepartmentFormPage.id and its siblings.
    provideRouter(routes, withComponentInputBinding())
  ]
};
