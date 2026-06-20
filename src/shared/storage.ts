// ─── Storage keys ─────────────────────────────────────────────────────────────

export const KEYS = {
  AI_TOOLS:          'config:aiTools',
  DOCK_ITEMS:        'config:dockItems',
  SETTINGS:          'config:settings',
  FOCUS_SESSIONS:    'focus:sessions',
  CURRENT_SESSION:   'focus:current',
  TASKS:             'productivity:tasks',
  ROLLUP_DAILY:      'productivity:rollup:daily',
  ROLLUP_WEEKLY:     'productivity:rollup:weekly',
  ROLLUP_MONTHLY:    'productivity:rollup:monthly',
  TAB_SNAPSHOT:      'tabs:snapshot',
  SECURITY_CACHE:    'security:reports',   // object keyed by origin
} as const;

// ─── Generic get / set ────────────────────────────────────────────────────────

export async function storageGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] as T | undefined);
    });
  });
}

export async function storageSet(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

export async function storageGetAll<T extends Record<string, unknown>>(
  keys: string[]
): Promise<Partial<T>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result as Partial<T>));
  });
}

export async function storageRemove(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve);
  });
}

/** Subscribe to a specific key change. Returns an unsubscribe function. */
export function storageSubscribe<T>(
  key: string,
  callback: (newValue: T, oldValue: T | undefined) => void
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string
  ) => {
    if (area === 'local' && key in changes) {
      callback(changes[key].newValue as T, changes[key].oldValue as T | undefined);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

/** Subscribe to any of several keys. Callback receives the changed key + new value. */
export function storageSubscribeAny(
  keys: string[],
  callback: (key: string, newValue: unknown) => void
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string
  ) => {
    if (area !== 'local') return;
    for (const key of keys) {
      if (key in changes) callback(key, changes[key].newValue);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
