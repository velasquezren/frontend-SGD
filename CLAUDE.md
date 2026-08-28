You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## Design System (Clínica Montalvo)

The full design system — brand colors, typography, spacing, verified
contrast pairs, and component conventions — is documented in
`DESIGN_SYSTEM.md` and implemented as CSS custom properties in
`src/styles/_tokens.scss`. Read `DESIGN_SYSTEM.md` before building or
styling any UI.

Hard rules:

- Never hardcode a color, font stack, spacing, radius, shadow, or timing
  value in a component. Always consume the corresponding `var(--...)`
  token from `src/styles/_tokens.scss`.
- Use the semantic color aliases (`--color-primary`, `--color-surface`,
  `--color-text`, `--color-on-primary`, etc.), not the raw numbered
  scales (`--color-primary-500`), inside product components.
- `--color-secondary` (teal) pairs with dark text (`--color-on-secondary`),
  never white — white-on-teal fails WCAG AA contrast. Use
  `--color-accent-text` (teal-700) when teal needs to work as text color.
- The brand script font (`--font-accent`, "Bufalo") is for marketing/print
  headlines only — never for interface or body copy.
- New shared UI primitives go in `src/app/shared/ui/<name>/`, follow the
  pattern in `src/app/shared/ui/button/`, and use `@use 'mixins' as m;` /
  `@use 'settings' as s;` (available from any file via
  `stylePreprocessorOptions.includePaths` in `angular.json`) rather than
  relative-path imports.
- No charting library (Chart.js, ngx-charts, ...) — `shared/ui/bar-chart/`
  and `shared/ui/sparkline/` are small, hand-built DOM/SVG components that
  consume design tokens directly (see the dashboard for both in use).
  They exist because a canvas-based library brings its own color/theming
  system, which fights the token-only rule above, and because the app's
  chart needs are genuinely simple (a handful of bars, one trend line).
  Reach for the same approach — not a new dependency — the next time a
  screen needs a chart, unless the shape of the data actually outgrows
  what a bar/line can show.
- Brand logo assets live in `public/` (`favicon.svg`/`.ico`,
  `favicon-96x96.png`, `apple-touch-icon.png`,
  `web-app-manifest-{192,512}x512.png`) — see `DESIGN_SYSTEM.md` §1 for
  where each is used and the still-missing white/light variant for dark
  backgrounds. Don't regenerate or replace these without going through
  the same source (realfavicongenerator.net from the real brand mark).
- Dark mode is not enabled. Do not add a `prefers-color-scheme: dark`
  override without first reviewing contrast per `DESIGN_SYSTEM.md` §8.

## PWA (installable app)

Set up via `ng add @angular/pwa` (added `@angular/service-worker`,
`ngsw-config.json`, `serviceWorker: "ngsw-config.json"` on the
`production` build configuration in `angular.json`,
`provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), ...
})` in `app.config.ts`) — that's the standard Angular PWA path, don't
hand-roll service worker registration.

- **`ngsw-config.json`** caches the app shell (JS/CSS/HTML, prefetch) and
  static assets (images/fonts, lazy) for fast repeat loads and offline
  installability. **Deliberately no `dataGroups` for `/api/**`** — this is
  a clinic document system; showing a stale cached document list/detail
  when the network is actually reachable is a correctness risk worse than
  a failed request, and `core/http/api-error.util.ts` already turns a
  network failure into a clear message (`error.status === 0`). If offline
  data access is ever genuinely needed, scope a `dataGroups` entry
  narrowly (read-only list endpoints, explicitly excluding
  `/api/documents/*/download` — those can be tens of MB each) rather than
  a blanket `/api/**` freshness group.
- **`core/pwa/pwa-update.service.ts`** (`PwaUpdateService`) — polls
  `SwUpdate.checkForUpdate()` every 6h once the app is stable, and on a
  `VERSION_READY` event asks via the existing `ConfirmService` before
  reloading (never a silent auto-reload — see its doc-comment).
- **`core/pwa/install-prompt.service.ts`** (`InstallPromptService`) —
  captures `beforeinstallprompt`, exposes `canInstall()` /
  `promptInstall()`; `AppShell`'s topbar shows an "Instalar app" button
  gated by `canInstall()`. iOS/Safari never fires that event (platform
  limitation, not a bug) — the button simply never appears there.
- Both services are `providedIn: 'root'` but do their real work in the
  constructor, so they're `inject()`-ed once in `App` (`app.ts`) purely to
  force early instantiation — see the comment there before assuming
  they're unused.
- **`public/manifest.webmanifest` is hand-maintained**, not the one
  `ng add @angular/pwa` generates by default (that one used placeholder
  Angular icons) — if re-running `ng add @angular/pwa` for a future
  Angular major, restore this file's real content (name/icons/shortcuts)
  and delete any regenerated `public/icons/` placeholder set afterward.
- **The service worker only activates in a production build** — `ng
  serve` never registers one (`enabled: !isDevMode()`). To actually test
  install/update behavior locally: `ng build`, then serve
  `dist/frontend/browser` with any static file server (e.g.
  `npx http-server dist/frontend/browser -p 4300`) and hit that, not
  `ng serve`'s port.

## Application architecture (established patterns — follow, don't reinvent)

Talks to the NestJS backend documented in `../backend/docs/ARCHITECTURE.md`.
Every feature module (`departments`, `users`, `documents`) follows the same
shape — copy `features/departments/` for a new one, not
`features/documents/` (it has two extra, module-specific mechanics:
multipart upload and blob download/preview). There is no `features/roles/`
— roles are a fixed set (`core/auth/roles.ts`), picked as a plain field on
the Usuarios form, not their own resource. See
`../backend/docs/adr/0005-fixed-roles.md` before assuming a "Roles" screen
should exist.

Two features deliberately don't fit the list/form pair: `features/audit-log/`
is list-only (no form page — nothing there is ever created/edited by a
user, see `backend/docs/RBAC.md`'s `audit:read` row), and
`features/profile/` is a single page with no list at all (there's exactly
one record, the caller's own — self-service password change via
`POST /auth/change-password`, added to `AuthService`, not a new module,
since it's an auth action, not a resource).

```
features/<name>/
  <name>.models.ts     // types mirroring the backend's DTOs/entities
  <name>.service.ts    // HttpClient, one method per endpoint, ApiResponse<T> unwrapped
  <name>-list.page.ts  // resource() + debounced search + ui-pagination + permission-gated actions
  <name>-form.page.ts  // one component for create AND edit — route :id === 'nuevo' means create
```

- **Auth/permissions**: `core/auth/auth.service.ts` (session signals,
  `hasPermission()`), `core/auth/permissions.ts` (typed mirror of the
  backend's permission catalog — keep in sync by hand), `core/auth/auth.guard.ts`
  (`authGuard`/`guestGuard`), `core/http/auth.interceptor.ts` (attaches the
  token, clears session on 401).
- **Forms**: Signal Forms (`@angular/forms/signals`) for every validated
  field, including `role` (`<select [formField]="userForm.role">` — it's
  just a fixed-option string field, see `core/auth/roles.ts`). The one
  thing Signal Forms can't do — a file input — is a plain signal toggled
  by hand instead (`documents/document-form.page.ts`'s `selectedFile`),
  never `[formField]`; the same technique applies if a future field needs
  to bind an array (Signal Forms checkboxes only bind to `boolean`, never
  `string[]`). Edit-mode prefill uses `linkedSignal()` off a `resource()`,
  not a manual `effect()`.
- **Feedback**: `core/notifications/toast.service.ts`
  (`success`/`error`/`info`, `<app-toast-viewport>` mounted once in
  `app.html`) for one-shot outcomes; `core/dialogs/confirm.service.ts`
  (`await confirmService.confirm({...})`, `<app-confirm-dialog-host>` also
  in `app.html`) instead of the browser's native `confirm()`. Both build on
  `shared/ui/modal/modal.ts`, the one modal primitive — a new dialog-style
  UI reuses `ui-modal`, it doesn't roll its own overlay.
- **Errors**: `core/http/api-error.util.ts` (`toApiErrorMessage`) turns a
  failed `HttpClient` call into the backend's actual validation message —
  every service/form catch block uses it instead of a generic string.
- **Layout**: `layout/app-shell/` is the parent route for everything
  authenticated (sidebar nav items are permission-gated, same list drives
  the dashboard cards in `features/dashboard/`).
