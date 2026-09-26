'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../../lib/session';
import type { UserRecord } from '../../../lib/types';

export default function JournalistsPage() {
  const { apiFetch } = useSession();
  const queryClient = useQueryClient();
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['journalists'],
    queryFn: () => apiFetch<UserRecord[]>('/journalists'),
  });

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/journalists', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journalists'] }),
  });

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await create.mutateAsync({ email, name, password });
      setEmail('');
      setName('');
      setPassword('');
    } catch {
      // error surfaces through create.error
    }
  };

  if (isLoading) return <p>Loading journalists…</p>;
  if (error) return <p className="error">{String(error)}</p>;

  return (
    <>
      <h1>Journalist accounts</h1>
      <section className="card">
        <h2>Create journalist</h2>
        <form onSubmit={submit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Password (min 8 chars)
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </label>
          {create.error instanceof Error && <p className="error">{create.error.message}</p>}
          <button type="submit" disabled={create.isPending}>Create account</button>
        </form>
      </section>
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr>
        </thead>
        <tbody>
          {(users ?? []).map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
