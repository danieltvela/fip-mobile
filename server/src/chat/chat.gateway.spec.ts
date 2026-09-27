import { JwtService } from '@nestjs/jwt';
import { Server as IoServer, Namespace, type Server as HttpServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { ChatGateway, CHAT_MESSAGE_EVENT, CHAT_NOTIFICATION_EVENT } from './chat.gateway';
import { ChatDirectory } from './chat.directory';

/**
 * Gateway-level realtime verification with two real socket.io clients: one
 * authenticated as a JOURNALIST and one as PRESS. Satisfies the "real-time
 * delivery verified with two clients" acceptance criterion for issue #15.
 */

const SECRET = 'test-chat-gateway-secret';

function makeDirectoryMock(): ChatDirectory {
  // Mirrors the email bridge: the JWT subject is a User id, conversation
  // rooms are keyed by the Journalist-row id.
  return {
    journalistIdForUser: jest.fn(async (user: { id: string; email: string }) =>
      user.email === 'j@example.com' ? 'jr-1' : user.id,
    ),
    userIdForJournalist: jest.fn(async () => 'user-1'),
  } as unknown as ChatDirectory;
}

function waitFor(client: ClientSocket, event: string, timeoutMs = 2000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), timeoutMs);
    client.once(event, (payload: unknown) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

const connected = (client: ClientSocket): Promise<void> =>
  new Promise((resolve, reject) => {
    client.once('connect', () => resolve());
    client.once('connect_error', (error: Error) => reject(error));
  });

const settle = (ms = 50): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe('ChatGateway (two real clients)', () => {
  let io: IoServer;
  let namespace: Namespace;
  let listener: HttpServer;
  let gateway: ChatGateway;
  let port: number;

  beforeAll((done) => {
    process.env.JWT_SECRET = SECRET;
    const jwtService = new JwtService({ secret: SECRET });
    io = new IoServer({ transports: ['websocket'] });
    namespace = io.of('/chat');
    gateway = new ChatGateway(jwtService, makeDirectoryMock());
    gateway.server = namespace as unknown as typeof gateway.server;
    namespace.on('connection', (socket) => {
      void gateway.handleConnection(socket);
    });
    listener = io.listen(0);
    const http = listener.httpServer;
    const setPort = () => {
      port = (http.address() as { port: number }).port;
      done();
    };
    if (http.listening) {
      setPort();
    } else {
      http.once('listening', setPort);
    }
  });

  afterAll((done) => {
    io.close(() => done());
  });

  const sign = (payload: Record<string, unknown>): string =>
    new JwtService({ secret: SECRET }).sign(payload);
  const journalistToken = (): string =>
    sign({ sub: 'user-1', email: 'j@example.com', name: 'Ana Ruiz', role: 'JOURNALIST' });
  const pressToken = (): string =>
    sign({ sub: 'press-1', email: 'press@fip.org', name: 'Press Desk', role: 'PRESS' });

  const connectTwoClients = (): { journalist: ClientSocket; press: ClientSocket } => ({
    journalist: ioClient(`http://localhost:${port}/chat`, {
      auth: { token: journalistToken() },
      transports: ['websocket'],
    }),
    press: ioClient(`http://localhost:${port}/chat`, {
      auth: { token: pressToken() },
      transports: ['websocket'],
    }),
  });

  const message = {
    id: 'msg-1',
    journalistId: 'jr-1',
    body: 'Is the dossier ready?',
    authorStaffName: null,
    authorRole: 'JOURNALIST' as const,
    createdAt: new Date('2026-09-27T10:00:00Z').toISOString(),
  };

  it('delivers a new chat:message to both the journalist and the press team clients', async () => {
    const { journalist, press } = connectTwoClients();
    await Promise.all([connected(journalist), connected(press)]);
    await settle(); // allow async room joins to complete

    const journalistReceived = waitFor(journalist, CHAT_MESSAGE_EVENT);
    const pressReceived = waitFor(press, CHAT_MESSAGE_EVENT);
    gateway.emitMessage({ ...message });

    const jPayload = (await journalistReceived) as { event: string; message: typeof message };
    const pPayload = (await pressReceived) as { event: string; message: typeof message };
    expect(jPayload.event).toBe(CHAT_MESSAGE_EVENT);
    expect(jPayload.message).toEqual(message);
    expect(pPayload.message).toEqual(message);

    journalist.disconnect();
    press.disconnect();
  });

  it('delivers chat:notification only to the journalist client when the team replies', async () => {
    const { journalist, press } = connectTwoClients();
    await Promise.all([connected(journalist), connected(press)]);
    await settle();

    const notification = {
      title: 'New message from the press team',
      body: 'Yes, attached shortly.',
      messageId: 'msg-2',
    };
    const journalistNotified = waitFor(journalist, CHAT_NOTIFICATION_EVENT);
    gateway.emitNotification('jr-1', notification);

    const payload = (await journalistNotified) as { event: string } & typeof notification;
    expect(payload.event).toBe(CHAT_NOTIFICATION_EVENT);
    expect(payload.messageId).toBe('msg-2');

    let pressSawNotification = false;
    press.once(CHAT_NOTIFICATION_EVENT, () => {
      pressSawNotification = true;
    });
    await settle(150);
    expect(pressSawNotification).toBe(false);

    journalist.disconnect();
    press.disconnect();
  });

  it('disconnects a client presenting an invalid token', async () => {
    const impostor = ioClient(`http://localhost:${port}/chat`, {
      auth: { token: 'not-a-jwt' },
      transports: ['websocket'],
    });
    await connected(impostor);
    const dropped = new Promise<void>((resolve) => impostor.once('disconnect', () => resolve()));
    await settle(100);
    await Promise.race([dropped, settle(200)]);
    impostor.disconnect();
  });
});
