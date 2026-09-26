'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../../lib/session';
import type { AgendaRequestRecord } from '../../../lib/types';

const STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'ACCEPTED'];

export default function AgendaRequestsPage() {
  const { apiFetch } = useSession();
  const queryClient = useQueryClient();
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['agenda-requests'],
    queryFn: () => apiFetch<AgendaRequestRecord[]>('/agenda-requests'),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/agenda-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agenda-requests'] }),
  });

  if (isLoading) return <p>Loading agenda requests…</p>;
  if (error) return <p className="error">{String(error)}</p>;

  return (
    <>
      <h1>Agenda requests</h1>
      <table>
        <thead>
          <tr><th>Event</th><th>Status</th><th>Change status</th></tr>
        </thead>
        <tbody>
          {(requests ?? []).map((request) => (
            <tr key={request.id}>
              <td>{request.eventTitle}<br /><small>{request.note}</small></td>
              <td>{request.status}</td>
              <td>
                {STATUSES.map((status) => (
                  <span key={status} style={{ marginRight: 6 }}>
                    <button
                      disabled={status === request.status || setStatus.isPending}
                      onClick={() => setStatus.mutate({ id: request.id, status })}
                    >
                      {status.toLowerCase()}
                    </button>
                  </span>
                ))}
              </td>
            </tr>
          ))}
          {(requests ?? []).length === 0 && (
            <tr><td colSpan={3}>No agenda requests yet.</td></tr>
          )}
        </tbody>
      </table>
    </>
  );
}
