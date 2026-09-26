'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../lib/session';
import type { PressMaterialRecord } from '../../lib/types';

const TYPES = ['PRESS_RELEASE', 'NOTE', 'PHOTOGRAPH', 'VIDEO', 'AUDIO'];

export default function MaterialsPage() {
  const { apiFetch } = useSession();
  const queryClient = useQueryClient();
  const { data: materials, isLoading, error } = useQuery({
    queryKey: ['materials'],
    queryFn: () => apiFetch<PressMaterialRecord[]>('/materials'),
  });

  

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['materials'] });

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch('/materials', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch(`/materials/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/materials/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  if (isLoading) return <p>Loading materials…</p>;
  if (error) return <p className="error">{String(error)}</p>;

  return (
    <>
      <h1>Press materials</h1>
      <section className="card">
        <h2>New material</h2>
        <MaterialForm
          onSubmit={(body) => create.mutateAsync(body)}
          busy={create.isPending}
          error={create.error instanceof Error ? create.error.message : null}
        />
      </section>
      <table>
        <thead>
          <tr>
            <th>Title</th><th>Type</th><th>Topic</th><th>Published</th><th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {(materials ?? []).map((material) => (
            <tr key={material.id}>
              <td>{material.title}<br /><small>{material.topic}</small></td>
              <td>{material.type}</td>
              <td>{material.published ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => remove.mutate(material.id)}>Delete</button>
                <span> </span>
                <button onClick={() => update.mutate({ id: material.id, body: { published: !material.published } })}>
                  {material.published ? 'Unpublish' : 'Publish'}
                </button>
              </td>
              <td>
                <MaterialForm
                  initial={material}
                  onSubmit={(body) => update.mutateAsync({ id: material.id, body })}
                  busy={update.isPending}
                  error={null}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function MaterialForm({
  initial,
  onSubmit,
  busy,
  error,
}: {
  initial?: PressMaterialRecord;
  onSubmit: (body: Record<string, unknown>) => Promise<unknown>;
  busy: boolean;
  error: string | null;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<string>(initial?.type ?? 'PRESS_RELEASE');
  const [topic, setTopic] = useState(initial?.topic ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [mediaUrl, setMediaUrl] = useState(initial?.mediaUrl ?? '');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: Record<string, unknown> = { title, type, topic, body };
    if (mediaUrl) payload.mediaUrl = mediaUrl;
    try {
      await onSubmit(payload);
    } catch {
      // surfaced through parent error state where applicable
    }
  };

  return (
    <form onSubmit={submit}>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ').toLowerCase()}</option>
          ))}
        </select>
      </label>
      <label>
        Topic
        <input value={topic} onChange={(e) => setTopic(e.target.value)} required />
      </label>
      <label>
        Body
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
      </label>
      <label>
        Media URL (optional)
        <input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>{initial ? 'Save changes' : 'Create'}</button>
    </form>
  );
}
