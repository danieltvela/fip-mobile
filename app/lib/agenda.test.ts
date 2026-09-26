import { AGENDA_EVENTS } from '@fip/shared';
import {
  AGENDA_FILTERS,
  applyAgendaFilter,
} from '../lib/agenda';
import {
  loadFavorites,
  saveFavorites,
  toggleFavorite,
} from '../lib/favorites';

const memoryStorage = {
  store: new Map<string, string>(),
  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  },
};

describe('agenda filters', () => {
  const events = AGENDA_EVENTS;

  it('exposes All, Forums, Events and Favorites filters', () => {
    expect(AGENDA_FILTERS).toEqual(['all', 'forums', 'events', 'favorites']);
  });

  it('All returns every event', () => {
    expect(applyAgendaFilter(events, 'all', new Set())).toHaveLength(events.length);
  });

  it('Forums returns only forum-category events', () => {
    const forums = applyAgendaFilter(events, 'forums', new Set());
    expect(forums.length).toBeGreaterThan(0);
    expect(forums.every((event) => event.category === 'forum')).toBe(true);
    expect(forums.length).toBeLessThan(events.length);
  });

  it('Events returns only event-category items', () => {
    const eventsOnly = applyAgendaFilter(events, 'events', new Set());
    expect(eventsOnly.length).toBeGreaterThan(0);
    expect(eventsOnly.every((event) => event.category === 'event')).toBe(true);
  });

  it('Favorites returns only favorited events', () => {
    const only = new Set([events[0].id]);
    expect(applyAgendaFilter(events, 'favorites', only)).toEqual([events[0]]);
    expect(applyAgendaFilter(events, 'favorites', new Set())).toEqual([]);
  });

  it('every event carries date, time and venue', () => {
    for (const event of events) {
      expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(event.time).toMatch(/^\d{2}:\d{2}$/);
      expect(event.venue.length).toBeGreaterThan(0);
    }
  });
});

describe('favorites persistence', () => {
  beforeEach(() => {
    memoryStorage.store.clear();
  });

  it('persists toggled favorites across sessions', async () => {
    // Session 1: favorite an event.
    await saveFavorites(memoryStorage, toggleFavorite(new Set(), AGENDA_EVENTS[0].id));

    // Session 2: reload from storage.
    const restored = await loadFavorites(memoryStorage);
    expect(restored.has(AGENDA_EVENTS[0].id)).toBe(true);

    // Toggle off and reload: unset persists too.
    await saveFavorites(memoryStorage, toggleFavorite(restored, AGENDA_EVENTS[0].id));
    expect((await loadFavorites(memoryStorage)).has(AGENDA_EVENTS[0].id)).toBe(false);
  });
});
