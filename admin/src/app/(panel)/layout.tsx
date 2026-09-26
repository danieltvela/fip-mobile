'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '../../lib/session';

const NAV = [
  { href: '/', label: 'Materials' },
  { href: '/journalists', label: 'Journalists' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/agenda-requests', label: 'Agenda requests' },
  { href: '/chat', label: 'Chat' },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, hydrated } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && (!user || user.role !== 'PRESS_TEAM')) router.replace('/login');
  }, [hydrated, user, router]);

  if (!hydrated || !user || user.role !== 'PRESS_TEAM') return <p>Loading…</p>;

  return (
    <div>
      <nav aria-label="Panel navigation">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} style={{ fontWeight: pathname === item.href ? 700 : 400, marginRight: 16 }}>
            {item.label}
          </Link>
        ))}
        <span style={{ marginLeft: 'auto' }}>
          {user.email} <button onClick={logout}>Sign out</button>
        </span>
      </nav>
      <hr />
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}
