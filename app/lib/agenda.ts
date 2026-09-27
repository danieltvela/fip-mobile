import { AgendaEvent } from '@fip/shared';

export type AgendaFilter = 'all' | 'forums' | 'events' | 'favorites';

export const AGENDA_FILTERS: readonly AgendaFilter[] = [
  'all',
  'forums',
  'events',
  'favorites',
] as const;

/**
 * Applies an agenda filter to a list of events.
 *
 * @param events full agenda
 * @param filter active filter chip
 * @param favoriteIds ids of events starred by the user
 */
export function applyAgendaFilter(
  events: readonly AgendaEvent[],
  filter: AgendaFilter,
  favoriteIds: ReadonlySet<string>,
): readonly AgendaEvent[] {
  switch (filter) {
    case 'forums':
      return events.filter((event) => event.category === 'forum');
    case 'events':
      return events.filter((event) => event.category === 'event');
    case 'favorites':
      return events.filter((event) => favoriteIds.has(event.id));
    case 'all':
      return events;
  }
}
