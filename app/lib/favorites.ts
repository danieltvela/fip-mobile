const STORAGE_KEY = 'fip.agenda.favorites';

/**
 * Loads persisted favorite event ids from AsyncStorage.
 *
 * The module is injected so callers can pass a platform storage
 * implementation (AsyncStorage in the app, an in-memory mock in tests).
 *
 * @param storage key/value string storage such as AsyncStorage
 */
export async function loadFavorites(storage: {
  getItem(key: string): Promise<string | null>;
}): Promise<Set<string>> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (raw == null) return new Set();
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return new Set();
  return new Set(parsed.filter((id): id is string => typeof id === 'string'));
}

/**
 * Persists favorite event ids, returning the stored set for convenience.
 *
 * @param storage key/value string storage such as AsyncStorage
 * @param ids favorite event ids to save
 */
export async function saveFavorites(
  storage: { setItem(key: string, value: string): Promise<void> },
  ids: Iterable<string>,
): Promise<Set<string>> {
  const set = new Set(ids);
  await storage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  return set;
}

/**
 * Toggles one favorite id, returning the resulting set.
 *
 * @param ids current favorite ids
 * @param id event id to toggle
 */
export function toggleFavorite(ids: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(ids);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}
