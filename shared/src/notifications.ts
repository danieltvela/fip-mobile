/**
 * Notification center domain types shared between the API server and the
 * mobile app (issue #6). Typologies follow the spec: press notes, agenda
 * changes, interviews, private communications and incidents.
 */

export const NOTIFICATION_TYPOLOGIES = [
  'press_note',
  'agenda_change',
  'interview',
  'private_communication',
  'incident',
] as const;

export type NotificationTypology = (typeof NOTIFICATION_TYPOLOGIES)[number];

/** A notification as delivered to a journalist. */
export interface NotificationDto {
  id: string;
  typology: NotificationTypology;
  title: string;
  body: string;
  /** Reception timestamp (ISO 8601); the list orders by it, newest first. */
  receivedAt: string;
  /** Null while the notification is unread. */
  readAt: string | null;
}

/** One page of the chronological (newest-first) notification listing. */
export interface NotificationPage {
  items: NotificationDto[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  /** Number of unread notifications for the requesting user. */
  unreadCount: number;
}

/** Query parameters accepted by GET /notifications. */
export interface NotificationQuery {
  page?: number;
  pageSize?: number;
}
