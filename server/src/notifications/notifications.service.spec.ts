import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

const HOUR = 60 * 60 * 1000;
const NOW = new Date('2026-09-27T12:00:00.000Z');

interface Row {
  id: string;
  typology: string;
  title: string;
  body: string;
  userId: string;
  createdAt: Date;
  readAt: Date | null;
}

const USER = 'user-1';
const OTHER = 'user-2';

/** Known dataset: mixed typologies, some unread, covering several pages. */
function dataset(): Row[] {
  return [
    { id: 'n1', typology: 'INCIDENT', title: 'Access change', body: 'Gate B.', userId: USER, createdAt: new Date(NOW.getTime() - 1 * HOUR), readAt: null },
    { id: 'n2', typology: 'INTERVIEW', title: 'Interview confirmed', body: 'At 10:30.', userId: USER, createdAt: new Date(NOW.getTime() - 5 * HOUR), readAt: null },
    { id: 'n3', typology: 'AGENDA_CHANGE', title: 'Briefing moved', body: '09:30 to 12:00.', userId: USER, createdAt: new Date(NOW.getTime() - 26 * HOUR), readAt: null },
    { id: 'n4', typology: 'PRESS_NOTE', title: 'Forum conclusions', body: 'Now available.', userId: USER, createdAt: new Date(NOW.getTime() - 50 * HOUR), readAt: new Date(NOW.getTime() - 40 * HOUR) },
    { id: 'n5', typology: 'PRIVATE_COMMUNICATION', title: 'Press office reply', body: 'About accreditation.', userId: USER, createdAt: new Date(NOW.getTime() - 72 * HOUR), readAt: new Date(NOW.getTime() - 70 * HOUR) },
    { id: 'n6', typology: 'PRESS_NOTE', title: 'Other user note', body: 'Not yours.', userId: OTHER, createdAt: new Date(NOW.getTime() - 2 * HOUR), readAt: null },
  ];
}

function fakeRepo(rows: Row[]) {
  return {
    notification: {
      count(args: { where: { userId: string; readAt?: Date | null } }) {
        return rows.filter(
          (row) =>
            row.userId === args.where.userId
            && ('readAt' in args.where && args.where.readAt === null ? row.readAt === null : true),
        ).length;
      },
      findMany(args: { where: { userId: string }; orderBy: object; skip: number; take: number }) {
        return rows
          .filter((row) => row.userId === args.where.userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(args.skip, args.skip + args.take);
      },
      findFirst(args: { where: { id: string; userId: string } }) {
        return rows.find((row) => row.id === args.where.id && row.userId === args.where.userId) ?? null;
      },
      update(args: { where: { id: string }; data: { readAt: Date } }) {
        const row = rows.find((r) => r.id === args.where.id)!;
        row.readAt = args.data.readAt;
        return row;
      },
      create(args: { data: Row }) {
        rows.push(args.data);
        return args.data;
      },
    },
  };
}

function serviceWith(rows: Row[]) {
  return new NotificationsService(fakeRepo(rows) as never);
}

describe('NotificationsService', () => {
  it('lists the user notifications newest first with typology, unread highlight data and unread count', async () => {
    const page = await serviceWith(dataset()).list(USER, {});
    expect(page.total).toBe(5);
    expect(page.unreadCount).toBe(3);
    expect(page.hasMore).toBe(false);
    expect(page.items.map((item) => item.id)).toEqual(['n1', 'n2', 'n3', 'n4', 'n5']);
    expect(page.items[0].typology).toBe('incident');
    expect(page.items[3].readAt).toBe('2026-09-25T20:00:00.000Z');
  });

  it('paginates the full browsable history', async () => {
    const service = serviceWith(dataset());
    const first = await service.list(USER, { page: 1, pageSize: 2 });
    expect(first.items.map((item) => item.id)).toEqual(['n1', 'n2']);
    expect(first.hasMore).toBe(true);
    const second = await service.list(USER, { page: 2, pageSize: 2 });
    expect(second.items.map((item) => item.id)).toEqual(['n3', 'n4']);
    expect(second.hasMore).toBe(true);
    const third = await service.list(USER, { page: 3, pageSize: 2 });
    expect(third.items.map((item) => item.id)).toEqual(['n5']);
    expect(third.hasMore).toBe(false);
  });

  it('marks an unread notification as read and refreshes the unread count', async () => {
    const rows = dataset();
    const service = serviceWith(rows);
    const before = await service.list(USER, {});
    expect(before.unreadCount).toBe(3);

    const result = await service.markAsRead(USER, 'n1');
    expect(result.readAt).not.toBeNull();
    expect(result.unreadCount).toBe(2);
    expect(rows.find((row) => row.id === 'n1')!.readAt).not.toBeNull();
  });

  it('is idempotent: marking an already read notification keeps its original readAt', async () => {
    const rows = dataset();
    const service = serviceWith(rows);
    const result = await service.markAsRead(USER, 'n4');
    expect(result.readAt).toBe('2026-09-25T20:00:00.000Z');
    expect(result.unreadCount).toBe(3);
  });

  it('rejects notifications that do not belong to the requesting user', async () => {
    await expect(serviceWith(dataset()).markAsRead(USER, 'n6')).rejects.toThrow(NotFoundException);
  });
});
