#!/usr/bin/env node
// Seeds real, decodable media payloads so downloads can be verified
// end-to-end with actual files. PNG encoding is inlined here to avoid
// adding native image dependencies to the seed path.
import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaClient, MediaType } from '@prisma/client';

const prisma = new PrismaClient();
const storageRoot = resolve(
  process.env.MEDIA_STORAGE_DIR ?? join(process.cwd(), 'storage'),
);

const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (const byte of buf) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

/// Encodes an RGBA PNG; pixel(x, y) returns [r, g, b].
function encodePng(width, height, pixel) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  const raw = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Deterministic gradient renders predictably in previews.
const gradientPixel = (label) => (x, y) => [
  Math.floor((x / label.width) * 200) + 30,
  Math.floor((y / label.height) * 160) + 40,
  120,
];

async function putImage(keyPrefix, width, height) {
  const png = encodePng(width, height, gradientPixel({ width, height }));
  const key = `${keyPrefix}/${randomUUID()}.png`;
  await mkdir(join(storageRoot, keyPrefix), { recursive: true });
  await writeFile(join(storageRoot, key), png);
  return { key, size: png.length };
}

async function putOpaque(keyPrefix, extension, mimeType, bytes) {
  const key = `${keyPrefix}/${randomUUID()}.${extension}`;
  await mkdir(join(storageRoot, keyPrefix), { recursive: true });
  await writeFile(join(storageRoot, key), bytes);
  return { key, size: bytes.length };
}

const day = (n, hour) => new Date(`2026-09-${String(10 + n).padStart(2, '0')}T${hour}:00Z`);

async function main() {
  await prisma.mediaItem.deleteMany();
  await prisma.edition.deleteMany();
  await prisma.event.deleteMany();

  const editionSeptember = await prisma.edition.create({
    data: { name: 'Boletín 2026-09' },
  });
  const editionAugust = await prisma.edition.create({
    data: { name: 'Boletín 2026-08' },
  });
  const summit = await prisma.event.create({
    data: { name: 'Foro de Instituciones Paralelas 2026' },
  });

  const photoOriginal = await putImage('original', 1024, 768);
  const photoPreview = await putImage('preview', 320, 240);
  const wideOriginal = await putImage('original', 1280, 720);
  const widePreview = await putImage('preview', 320, 180);

  // Video/audio payloads are real byte containers; decoding them is the
  // player's concern, the download path only needs authentic files.
  const mp4Header = Buffer.from(
    '000000206674797069736F6D0000020069736F6D6D70334131000000086D6574610000000000',
    'hex',
  );
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0, 'ascii');
  wavHeader.writeUInt32LE(36, 4);
  wavHeader.write('WAVEfmt ', 8, 'ascii');
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(1, 22);
  wavHeader.writeUInt32LE(44100, 24);
  wavHeader.writeUInt32LE(44100 * 2, 28);
  wavHeader.writeUInt16LE(2, 32);
  wavHeader.writeUInt16LE(16, 34);
  wavHeader.write('data', 36, 'ascii');

  const rows = [
    {
      title: 'Press conference wide shot',
      type: MediaType.image,
      topic: 'Institutional transparency',
      mimeType: 'image/png',
      previewKey: widePreview.key,
      originalKey: wideOriginal.key,
      sizeBytes: wideOriginal.size,
      publishedAt: day(5, '18:00'),
      eventId: summit.id,
    },
    {
      title: 'Credential ceremony photo',
      type: MediaType.image,
      mimeType: 'image/png',
      topic: 'Ceremony',
      previewKey: photoPreview.key,
      originalKey: photoOriginal.key,
      sizeBytes: photoOriginal.size,
      publishedAt: day(3, '10:30'),
      editionId: editionSeptember.id,
    },
    {
      title: 'Panel discussion recording',
      type: MediaType.video,
      mimeType: 'video/mp4',
      topic: 'Foro 2026',
      previewKey: widePreview.key,
      originalKey: (await putOpaque('original', 'mp4', 'video/mp4', mp4Header)).key,
      sizeBytes: mp4Header.length,
      publishedAt: day(4, '12:00'),
      eventId: summit.id,
    },
    {
      title: 'August bulletin statement',
      type: MediaType.audio,
      mimeType: 'audio/wav',
      topic: 'Bulletins',
      previewKey: photoPreview.key,
      originalKey: (await putOpaque('original', 'wav', 'audio/wav', wavHeader)).key,
      sizeBytes: wavHeader.length,
      publishedAt: day(2, '09:00'),
      editionId: editionAugust.id,
    },
  ];

  for (const row of rows) {
    await prisma.mediaItem.create({ data: row });
  }
  console.log(`Seeded ${rows.length} media items into ${storageRoot}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
