import { BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

type MessageRow = {
  id: string;
  journalistId: string;
  body: string;
  authorStaffName: string | null;
  createdAt: Date;
};

let messageSeq = 0;

function makePrismaMock(existing: MessageRow[] = []) {
  const messages = [...existing];
  const notifications: Array<Record<string, unknown>> = [];
  return {
    messages,
    notifications,
    contactMessage: {
      findMany: jest.fn(async ({ where }: { where: { journalistId: string } }) =>
        messages.filter((m) => m.journalistId === where.journalistId),
      ),
      create: jest.fn(async ({ data }: { data: Omit<MessageRow, 'id' | 'createdAt'> }) => {
        const row: MessageRow = {
          id: `msg-${++messageSeq}`,
          journalistId: data.journalistId,
          body: data.body,
          authorStaffName: data.authorStaffName,
          createdAt: new Date('2026-09-27T10:00:00Z'),
        };
        messages.push(row);
        return row;
      }),
    },
    notification: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        notifications.push(data);
        return data;
      }),
    },
  };
}

function makeGatewayMock() {
  return {
    emitMessage: jest.fn(),
    emitNotification: jest.fn(),
  };
}

describe('ChatService', () => {
  const journalist = { id: 'journalist-1', email: 'j@example.com', name: 'Ana Ruiz', role: 'JOURNALIST' as const };
  const press = { id: 'press-1', email: 'press@fip.org', name: 'Press Desk', role: 'PRESS' as const };

  function makeService(existing: MessageRow[] = [], gateway = makeGatewayMock()) {
    const prisma = makePrismaMock(existing);
    return {
      service: new ChatService(prisma as never, gateway as unknown as ChatGateway),
      prisma,
      gateway,
    };
  }

  it('a journalist posts into their own conversation without authorStaffName', async () => {
    const { service, prisma, gateway } = makeService();
    const message = await service.send(journalist, { body: 'Is the dossier ready?' });

    expect(message.journalistId).toBe('journalist-1');
    expect(message.authorRole).toBe('JOURNALIST');
    expect(message.authorStaffName).toBeNull();
    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: { journalistId: 'journalist-1', body: 'Is the dossier ready?', authorStaffName: null },
    });
    expect(gateway.emitMessage).toHaveBeenCalledWith(message);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('the press team replies into the target conversation and notifies the journalist', async () => {
    const { service, prisma, gateway } = makeService();
    const message = await service.send(press, { journalistId: 'journalist-1', body: 'Yes, attached shortly.' });

    expect(message.journalistId).toBe('journalist-1');
    expect(message.authorRole).toBe('PRESS');
    expect(message.authorStaffName).toBe('Press Desk');
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    const notification = prisma.notifications[0];
    expect(notification.userId).toBe('journalist-1');
    expect(notification.typology).toBe('PRIVATE_COMMUNICATION');
    expect(gateway.emitMessage).toHaveBeenCalledWith(message);
    expect(gateway.emitNotification).toHaveBeenCalledWith(
      'journalist-1',
      expect.objectContaining({ title: 'New message from the press team', body: 'Yes, attached shortly.' }),
    );
  });

  it('rejects a press reply without a target journalist', async () => {
    const { service, prisma, gateway } = makeService();
    await expect(service.send(press, { body: 'hello' })).rejects.toThrow(BadRequestException);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
    expect(gateway.emitMessage).not.toHaveBeenCalled();
  });

  it('journalists read their own history; the press team reads a targeted conversation', async () => {
    const { service } = makeService([
      { id: 'm1', journalistId: 'journalist-1', body: 'hi', authorStaffName: null, createdAt: new Date(0) },
    ]);
    expect((await service.list(journalist)).map((m) => m.id)).toEqual(['m1']);
    expect((await service.list(press, 'journalist-1')).map((m) => m.id)).toEqual(['m1']);
    await expect(service.list(press)).rejects.toThrow(BadRequestException);
  });
});
