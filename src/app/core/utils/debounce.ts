/** Delays invoking `fn` until `delayMs` have passed since the last call. Used by every list page's search box. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, delayMs: number): (...args: A) => void {
  let handle: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delayMs);
  };
}
