import { NotificationPage } from '@fip/shared';

/**
 * Loads one page of the chronological notification listing. The unread
 * count travels with every page so the red badge stays consistent.
 */
export async function fetchNotifications(
  apiBaseUrl: string,
  query: { page?: number; pageSize?: number } = {},
): Promise<NotificationPage> {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));
  const qs = params.toString();
  const res = await fetch(`${apiBaseUrl}/notifications${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error(`Failed to load notifications (HTTP ${res.status})`);
  }
  return res.json();
}

/** Marks a notification as read on open; returns the new unread count. */
export async function markNotificationRead(
  apiBaseUrl: string,
  id: string,
): Promise<number> {
  const res = await fetch(`${apiBaseUrl}/notifications/${id}/read`, { method: 'PATCH' });
  if (!res.ok) {
    throw new Error(`Failed to mark notification as read (HTTP ${res.status})`);
  }
  const body = (await res.json()) as { unreadCount: number };
  return body.unreadCount;
}
