import { environment } from '../../../environments/environment';

/**
 * Backend base URL — `environment.ts` (dev, `ng serve`/`ng test`) or
 * `environment.production.ts` (swapped in for `ng build` via
 * `fileReplacements` in `angular.json`). Edit the value there, not here —
 * see `environment.production.ts`'s doc-comment before deploying.
 */
export const API_URL = environment.apiUrl;
