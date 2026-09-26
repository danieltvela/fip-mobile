import { Test } from '@nestjs/testing';
import { MediaService } from './media.service';
import { StorageService } from './storage.service';
import { PrismaService } from '../prisma.service';

const RAW_ITEMS = [
  {
    id: 'recent',
    title: 'Press conference wide shot',
    type: 'image',
    topic: 'Foro 2026',
    previewKey: 'preview/recent.png',
    originalKey: 'original/recent.png',
    mimeType: 'image/png',
    sizeBytes: 69580,
    publishedAt: new Date('2026-09-15T18:00:00Z'),
    editionId: null,
    eventId: 'ev1',
  },
  {
    id: 'older',
    title: 'Credential ceremony photo',
    type: 'image',
    topic: 'Ceremony',
    previewKey: 'preview/older.png',
    originalKey: 'original/older.png',
    mimeType: 'image/png',
    sizeBytes: 69580,
    publishedAt: new Date('2026-09-13T10:30:00Z'),
    editionId: 'ed1',
    eventId: null,
  },
];

describe(MediaService.name, () => {
  let service: MediaService;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue(RAW_ITEMS.map((row) => ({ ...row })));
    const moduleRef = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: StorageService, useValue: {} },
        { provide: PrismaService, useValue: { mediaItem: { findMany } } },
      ],
    }).compile();
    service = moduleRef.get(MediaService);
  });

  it('queries media scoped to one event, newest first', async () => {
    await service.list({ eventId: 'ev1' });
    expect(findMany).toHaveBeenCalledWith({
      where: { eventId: 'ev1' },
      orderBy: { publishedAt: 'desc' },
    });
  });

  it('maps records to DTOs with preview and download URLs', async () => {
    const dtos = await service.list({});
    expect(dtos[0]).toMatchObject({
      id: 'recent',
      previewUrl: '/media/recent/preview',
      downloadUrl: '/media/recent/download',
      publishedAt: '2026-09-15T18:00:00.000Z',
      editionId: null,
      eventId: 'ev1',
    });
  });
});
