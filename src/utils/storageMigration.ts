/**
 * Non-destructive localStorage migration helper for Khair NGO Platform.
 * Replaces blanket localStorage.clear() calls on SYSTEM_VERSION updates.
 */
export const KHAIR_VERSION_KEY = 'KHAIR_SYSTEM_VERSION';
export const KHAIR_STATE_PREFIX = 'KHAIR_APP_STATE_';

export function migrateKhairLocalStorage(currentVersion: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const savedVersion = localStorage.getItem(KHAIR_VERSION_KEY);
    if (savedVersion === currentVersion) return;

    let latestStatePayload: Record<string, unknown> | null = null;
    const staleStateKeys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith(KHAIR_STATE_PREFIX) &&
        key !== `${KHAIR_STATE_PREFIX}${currentVersion}`
      ) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              latestStatePayload = parsed as Record<string, unknown>;
            }
          }
        } catch {
          // Ignore malformed legacy state entry
        }
        staleStateKeys.push(key);
      }
    }

    staleStateKeys.forEach((key) => localStorage.removeItem(key));

    const targetKey = `${KHAIR_STATE_PREFIX}${currentVersion}`;
    if (latestStatePayload && !localStorage.getItem(targetKey)) {
      localStorage.setItem(targetKey, JSON.stringify(latestStatePayload));
    }

    localStorage.setItem(KHAIR_VERSION_KEY, currentVersion);
  } catch (err) {
    console.warn('[Khair] Storage migration warning:', err);
  }
}
