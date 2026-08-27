const UNITS = ['KB', 'MB', 'GB'];

/** `1536` -> `"1.5 KB"`. Used by the document list/detail screens. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${UNITS[unitIndex]}`;
}
