import { hashPassword } from '../src/common/password';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'press@fip.org';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: 'Press Team Admin',
        passwordHash: hashPassword(process.env.SEED_PASSWORD ?? 'changeme123'),
        role: 'PRESS_TEAM',
      },
    });
    console.log(`Seeded press team user ${email}`);
  }

  if ((await prisma.agendaRequest.count()) === 0) {
    await prisma.agendaRequest.create({
      data: {
        journalistId: 'demo-journalist',
        eventId: 'demo-event',
        eventTitle: 'Building inauguration',
        note: 'Requesting access to the ribbon cutting',
        status: 'PENDING',
      },
    });
    console.log('Seeded demo agenda request');
  }

  if ((await prisma.conversation.count()) === 0) {
    const user = await prisma.user.findFirst({ where: { role: 'JOURNALIST' } });
    const conversation = await prisma.conversation.create({
      data: {
        userId: user?.id ?? 'demo-user',
        subject: 'Credential help',
        messages: {
          create: {
            authorRole: 'user',
            body: 'Hello, I lost my credential locator code.',
          },
        },
      },
    });
    console.log(`Seeded demo conversation ${conversation.id}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
