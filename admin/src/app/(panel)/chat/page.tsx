'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../../lib/session';
import type { ConversationRecord } from '../../../lib/types';

export default function ChatPage() {
  const { apiFetch } = useSession();
  const queryClient = useQueryClient();
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['chat'],
    queryFn: () => apiFetch<ConversationRecord[]>('/chat/conversations'),
  });

  const reply = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      apiFetch(`/chat/conversations/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat'] }),
  });

  if (isLoading) return <p>Loading conversations…</p>;
  if (error) return <p className="error">{String(error)}</p>;

  return (
    <>
      <h1>Chat conversations</h1>
      {(conversations ?? []).map((conversation) => (
        <ConversationCard key={conversation.id} conversation={conversation} onReply={(body) => reply.mutateAsync({ id: conversation.id, body })} busy={reply.isPending} />
      ))}
      {(conversations ?? []).length === 0 && <p>No conversations yet.</p>}
    </>
  );
}

function ConversationCard({
  conversation,
  onReply,
  busy,
}: {
  conversation: ConversationRecord;
  onReply: (body: string) => Promise<unknown>;
  busy: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await onReply(draft);
      setDraft('');
    } catch {
      setError('Reply failed');
    }
  };

  return (
    <section className="card">
      <h2>{conversation.subject}</h2>
      <ul>
        {conversation.messages.map((message) => (
          <li key={message.id}>
            <strong>{message.authorRole === 'press_team' ? 'Press office' : 'Journalist'}:</strong> {message.body}
          </li>
        ))}
      </ul>
      {error && <p className="error">{error}</p>}
      <form onSubmit={submit}>
        <label>
          Reply as press office
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} required />
        </label>
        <button type="submit" disabled={busy}>Send reply</button>
      </form>
    </section>
  );
}
