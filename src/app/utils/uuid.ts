/**
 * Safe UUID generator that works on all WebViews.
 * Uses crypto.randomUUID() when available, falls back otherwise.
 */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}