import { typologyFor, AgendaService } from './agenda.service';

type AgendaRequestRow = {
  id: string;
  journalistId: string;
  kind: 'INTERVIEW' | 'MEETING' | 'SHOOTING_SLOT' | 'EVENT';
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
};

function makePrismaMock() {
  const requests: AgendaRequestRow[] = [];
  const notifications: Array<Record<string, unknown>> = [];
  return {
    requests,
    notifications,
    agendaRequest: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) =>
        requests.find((r) => r.id === where.id) ?? null,
      ),
      create: jest.fn(async ({ data }: { data: AgendaRequestRow }) => {
        const row = { id: 'req-new', status: 'PENDING' as const, journalistId: data.journalistId, kind: data.kind };
        requests.push(row);
        return row;
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: { status: AgendaRequestRow['status'] } }) => {
        const row = requests.find((r) => r.id === where.id)!;
        row.status = data.status;
        return row;
      }),
      findMany: jest.fn(async ({ where }: { where: { journalistId: string } }) =>
        requests.filter((r) => r.journalistId === where.journalistId),
      ),
    },
    notification: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        notifications.push(data);
        return data;
      }),
    },
  };
}

describe('AgendaService', () => {
  const user = { id: 'journalist-1', email: 'j@example.com', name: 'Jour', role: 'JOURNALIST' as const };
  const press = { id: 'press-1', email: 'press@fip.org', name: 'Press Desk', role: 'PRESS' as const };

  function makeService(prisma = makePrismaMock()) {
    return { service: new AgendaService(prisma as never), prisma };
  }

  it('creates a request in pending state for the authenticated journalist', async () => {
    const { service, prisma } = makeService();
    const created = await service.create(user, {
      kind: 'INTERVIEW',
      scheduledAt: new Date('2026-10-01T10:00:00Z').toISOString(),
      notes: 'About the annual report',
  });
    expect(created.status).toBe('PENDING');
    expect(created.journalistId).toBe('journalist-1');
    expect(prisma.agendaRequest.create).toHaveBeenCalledTimes(1);
  });

  it('lists only the requesting journalist requests', async () => {
    const { service, prisma } = makeService();
    await service.create(user, { kind: 'MEETING', scheduledAt: new Date().toISOString() });
    await service.create({ ...user, id: 'journalist-2' }, { kind: 'EVENT', scheduledAt: new Date().toISOString() });
    const mine = await service.listByJournalist('journalist-1');
    expect(mine).toHaveLength(1);
    expect(mine[0].journalistId).toBe('journalist-1');
    expect(prisma.agendaRequest.findMany).toHaveBeenCalledWith({
      where: { journalistId: 'journalist-1' },
      orderBy: { scheduledAt: 'asc' },
    });
  });

  it('confirms a pending request and notifies the journalist with interview typology', async () => {
    const { service, prisma } = makeService();
    prisma.requests.push({ id: 'req-1', journalistId: 'journalist-1', kind: 'INTERVIEW', status: 'PENDING' });
    const updated = await service.updateStatus(press, 'req-1', 'CONFIRMED');
    expect(updated!.status).toBe('CONFIRMED');
    expect(prisma.notifications).toHaveLength(1);
    expect(prisma.notifications[0]).toMatchObject({
      userId: 'journalist-1',
      typology: 'INTERVIEW',
      data: { requestId: 'req-1', status: 'CONFIRMED' },
    });
  });

  it('notifies with agenda-change typology for non-interview kinds', async () => {
    const { service, prisma } = makeService();
    prisma.requests.push({ id: 'req-2', journalistId: 'journalist-1', kind: 'MEETING', status: 'PENDING' });
    await service.updateStatus(press, 'req-2', 'CONFIRMED');
    expect(prisma.notifications[0].typology).toBe('AGENDA_CHANGE');
  });

  it('forbids journalists (even the request owner) from changing statuses', async () => {
    const { service, prisma } = makeService();
    prisma.requests.push({ id: 'req-3', journalistId: 'journalist-1', kind: 'INTERVIEW', status: 'PENDING' });
    await expect(service.updateStatus(user, 'req-3', 'CONFIRMED')).rejects.toMatchObject({
      status: 403,
    });
    expect(prisma.agendaRequest.update).not.toHaveBeenCalled();
    expect(prisma.notifications).toHaveLength(0);
  });

  it('rejects invalid transitions without notifying anyone', async () => {
    const { service, prisma } = makeService();
    prisma.requests.push({ id: 'req-1', journalistId: 'journalist-1', kind: 'INTERVIEW', status: 'REJECTED' });
    await expect(service.updateStatus(press, 'req-1', 'CONFIRMED')).rejects.toThrow(
      'Cannot transition agenda request from REJECTED to CONFIRMED',
    );
    expect(prisma.agendaRequest.update).not.toHaveBeenCalled();
    expect(prisma.notifications).toHaveLength(0);
  });

  it('returns null for an unknown request without notifying', async () => {
    const { service, prisma } = makeService();
    await expect(service.updateStatus(press, 'missing', 'CONFIRMED')).resolves.toBeNull();
    expect(prisma.notifications).toHaveLength(0);
  });
});

describe('typologyFor', () => {
  it('maps confirmed/rejected interviews to the interview typology', () => {
    expect(typologyFor('INTERVIEW', 'CONFIRMED')).toBe('INTERVIEW');
    expect(typologyFor('INTERVIEW', 'REJECTED')).toBe('INTERVIEW');
  });

  it('maps everything else to the agenda-change typology', () => {
    expect(typologyFor('INTERVIEW', 'PENDING')).toBe('AGENDA_CHANGE');
    expect(typologyFor('MEETING', 'CONFIRMED')).toBe('AGENDA_CHANGE');
    expect(typologyFor('EVENT', 'REJECTED')).toBe('AGENDA_CHANGE');
    expect(typologyFor('SHOOTING_SLOT', 'REJECTED')).toBe('AGENDA_CHANGE');
  });
});
