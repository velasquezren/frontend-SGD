import type { FieldState } from '@angular/forms/signals';

/**
 * Only show a field's validation error after the user has interacted with
 * it — an untouched, pristine field must never display "required" before
 * they've had a chance to fill it in. Every form's `[error]` binding uses
 * this (previously each form redefined its own, un-gated version, which is
 * why a fresh form used to show every "obligatorio" message immediately).
 */
export function fieldError(state: FieldState<string>): string | undefined {
  return state.touched() ? state.errors()[0]?.message : undefined;
}
