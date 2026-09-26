'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../../lib/session';
import type { NotificationRecord } from '../../../lib/types';

const TYPOLOGIES = ['BREAKING_NEWS', 'EVENT_REMINDER', 'NEW_MATERIAL', 'GENERAL'];
const SEGMENTS = ['ALL', 'JOURNALISTS', 'CONFIRMED_AGENDA'];

export default function NotificationsPage() {
  const { apiFetch } = useSession();
  const queryClient = useQueryClient();
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<NotificationRecord[]>('/notifications'),
  });

  const publish = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/notifications', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [typology, setTypology] = useState('GENERAL');
  const [segment, setSegment] = useState('ALL');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await publish.mutateAsync({ title, body, typology, segment });
      setTitle('');
      setBody('');
    } catch {
      // error surfaces through publish.error
    }
  };

  if (isLoading) return <p>Loading notifications…</p>;
  if (error) return <p className="error">{String(error)}</p>;

  return (
    <>
      <h1>Publish notifications</h1>
      <section className="card">
        <form onSubmit={submit}>
          <label>
            Typology
            <select value={typology} onChange={(e) => setTypology(e.target.value)}>
              {TYPOLOGIES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ').toLowerCase()}</option>
              ))}
            </select>
          </label>
          <label>
            Target segment
            <select value={segment} onChange={(e) => setSegment(e.target.value)}>
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ').toLowerCase()}</option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Body
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          </label>
          {publish.error instanceof Error && <p className="error">{publish.error.message}</p>}
          <button type="submit" disabled={publish.isPending}>Publish notification</button>
        </form>
      </section>
      <table>
        <thead>
          <tr><th>Title</th><th>Typology</th><th>Segment</th><th>Published</th></tr>
        </thead>
        <tbody>
          {(notifications ?? []).map((notification) => (
            <tr key={notification.id}>
              <td>{notification.title}</td>
              <td>{notification.typology}</td>
              <td>{notification.segment}</td>
              <td>{new Date(notification.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
