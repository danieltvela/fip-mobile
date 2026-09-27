import { BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatDirectory } from './chat.directory';

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

/**
 * Directory mock bridging JWT subjects (User ids) to Journalist rows, exactly
 * as the real ChatDirectory resolves them through the shared email.
 */
function makeDirectoryMock() {
  return {
    journalistIdForUser: jest.fn(async (user: { id: string; email: string }) => {
      if (user.email === 'j@example.com') return 'jr-1';
      throw new BadRequestException('Authenticated token is missing an email to resolve the journalist profile');
    }),
    userIdForJournalist: jest.fn(async (journalistId: string) => {
      if (journalistId === 'jr-1') return 'user-1';
      throw new BadRequestException('Journalist conversation not found');
    }),
  };
}

function makeGatewayMock() {
  return {
    emitMessage: jest.fn(),
    emitNotification: jest.fn(),
  };
}

describe('ChatService', () => {
  // The JWT subject is a User id and does NOT match the Journalist row id:
  // this mirrors the live FK-mismatch regression reported by QA.
  const journalist = { id: 'user-1', email: 'j@example.com', name: 'Ana Ruiz', role: 'JOURNALIST' as const };
  const press = { id: 'press-1', email: 'press@fip.org', name: 'Press Desk', role: 'PRESS' as const };

  function makeService(existing: MessageRow[] = [], gateway = makeGatewayMock()) {
    const prisma = makePrismaMock(existing);
    const directory = makeDirectoryMock();
    return {
      service: new ChatService(
        prisma as never,
        gateway as unknown as ChatGateway,
        directory as unknown as ChatDirectory,
      ),
      prisma,
      gateway,
      directory,
    };
  }

  it('a journalist posts into their own Journalist conversation, not their User id', async () => {
    const { service, prisma, gateway } = makeService();
    const message = await service.send(journalist, { body: 'Is the dossier ready?' });

    expect(message.journalistId).toBe('jr-1');
    expect(message.authorRole).toBe('JOURNALIST');
    expect(message.authorStaffName).toBeNull();
    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: { journalistId: 'jr-1', body: 'Is the dossier ready?', authorStaffName: null },
    });
    expect(gateway.emitMessage).toHaveBeenCalledWith(message);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('the press team replies into the target conversation and notifies the journalist User', async () => {
    const { service, prisma, gateway, directory } = makeService();
    const message = await service.send(press, { journalistId: 'jr-1', body: 'Yes, attached shortly.' });

    expect(message.journalistId).toBe('jr-1');
    expect(message.authorRole).toBe('PRESS');
    expect(message.authorStaffName).toBe('Press Desk');
    expect(directory.userIdForJournalist).toHaveBeenCalledWith('jr-1');
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    const notification = prisma.notifications[0];
    expect(notification.userId).toBe('user-1');
    expect(notification.typology).toBe('PRIVATE_COMMUNICATION');
    expect(gateway.emitMessage).toHaveBeenCalledWith(message);
    expect(gateway.emitNotification).toHaveBeenCalledWith(
      'jr-1',
      expect.objectContaining({ title: 'New message from the press team', body: 'Yes, attached shortly.' }),
    );
  });

  it('rejects a press reply to an unknown journalist conversation', async () => {
    const { service, prisma, gateway } = makeService();
    await expect(service.send(press, { journalistId: 'jr-unknown', body: 'hello' })).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(gateway.emitMessage).not.toHaveBeenCalled();
  });

  it('rejects a press reply without a target journalist', async () => {
    const { service, prisma, gateway } = makeService();
    await expect(service.send(press, { body: 'hello' })).rejects.toThrow(BadRequestException);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
    expect(gateway.emitMessage).not.toHaveBeenCalled();
  });

  it('journalists read their own history (resolved by email); the press team reads a targeted conversation', async () => {
    const { service, directory } = makeService([
      { id: 'm1', journalistId: 'jr-1', body: 'hi', authorStaffName: null, createdAt: new Date(0) },
    ]);
    expect((await service.list(journalist)).map((m) => m.id)).toEqual(['m1']);
    expect(directory.journalistIdForUser).toHaveBeenCalledWith(journalist);
    expect((await service.list(press, 'jr-1')).map((m) => m.id)).toEqual(['m1']);
    await expect(service.list(press)).rejects.toThrow(BadRequestException);
  });
});
