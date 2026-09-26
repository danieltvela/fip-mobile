// Seeds demo journalists issued by the press team. Run: node prisma/seed.mjs
// Credential numbers are generated to be Luhn-valid VISA/MasterCard numbers.
/* eslint-disable no-undef */
import { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';

const prisma = new PrismaClient();
const scrypt = promisify(scryptCb);

async function hashCredential(credential) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(credential, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

const demoJournalists = [
  { credentialNumber: '4000123456789017', name: 'Ana Rueda', outlet: 'El Faro Digital', role: 'Staff reporter' },
  { credentialNumber: '5512123456789007', name: 'Marc Soler', outlet: 'Cadena Norte', role: 'Foreign correspondent' },
  { credentialNumber: '4218001122334400', name: 'Lucía Ferrán', outlet: 'Agencia Mirall', role: 'Editor' },
];

async function main() {
  for (const demo of demoJournalists) {
    await prisma.journalist.upsert({
      where: { credentialNumber: demo.credentialNumber },
      update: {},
      create: { ...demo, credentialHash: await hashCredential(demo.credentialNumber) },
    });
  }
  console.log(`Seeded ${demoJournalists.length} journalists`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
