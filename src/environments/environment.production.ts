/**
 * Swapped in for `ng build` (the `production` configuration is the
 * default target) via `fileReplacements` in `angular.json`. This is the
 * file Vercel actually builds with — replace the placeholder below with
 * the real HTTPS URL of the deployed backend (e.g. the VPS behind Caddy,
 * see `backend/docs/DEPLOYMENT.md`) before shipping. Must be `https://`:
 * the app is a PWA — a service worker will not register, and the browser
 * will block the request as mixed content, if this points at plain HTTP.
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.REPLACE-WITH-YOUR-DOMAIN.io/api',
};
