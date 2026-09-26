/** Categories of agenda items in the FIP agenda. */
export type AgendaCategory = 'forum' | 'event';

/** A single agenda item shown in the FIP agenda. */
export interface AgendaEvent {
  id: string;
  title: string;
  category: AgendaCategory;
  /** ISO 8601 date, e.g. `2026-11-10`. */
  date: string;
  /** Local time of day, e.g. `10:00`. */
  time: string;
  venue: string;
}

/** Fake-but-realistic agenda used until the agenda admin module ships (#17). */
export const AGENDA_EVENTS: readonly AgendaEvent[] = [
  {
    id: 'forum-opening',
    title: 'Opening forum: Parallel Institutions in Spain',
    category: 'forum',
    date: '2026-11-10',
    time: '10:00',
    venue: 'Auditorio Reina Sofía, Madrid',
  },
  {
    id: 'forum-media',
    title: 'Forum: Media freedom and institutional transparency',
    category: 'forum',
    date: '2026-11-10',
    time: '16:00',
    venue: 'Sala Europa, Casa de América',
  },
  {
    id: 'event-press-briefing',
    title: 'Press briefing with FIP spokespersons',
    category: 'event',
    date: '2026-11-11',
    time: '09:30',
    venue: 'FIP headquarters, Calle Serrano 21',
  },
  {
    id: 'forum-economy',
    title: 'Forum: Parallel economic institutions',
    category: 'forum',
    date: '2026-11-11',
    time: '12:00',
    venue: 'Colegio de Economistas, Madrid',
  },
  {
    id: 'event-gallery',
    title: 'Photo gallery opening night',
    category: 'event',
    date: '2026-11-12',
    time: '19:00',
    venue: 'Centro Cultural Conde Duque',
  },
] as const;
