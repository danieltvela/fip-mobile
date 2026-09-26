import { Injectable, NotFoundException } from '@nestjs/common';
import type { MediaType } from '@prisma/client';
import type { GalleryRefDto, MediaItemDto } from '@fip/shared';
import { PrismaService } from '../prisma.service';
import { StorageService } from './storage.service';

const toDate = (d: Date): string => d.toISOString();

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Gallery listing: newest first, optionally scoped to one edition or
   * event. Pagination is out of scope here (see issue #8).
   */
  async list(scope: { editionId?: string; eventId?: string }): Promise<MediaItemDto[]> {
    const items = await this.prisma.mediaItem.findMany({
      where: scope,
      orderBy: { publishedAt: 'desc' },
    });
    return items.map((item) => this.toDto(item));
  }

  /**
   * Galleries available for scoping the media list: editions and events,
   * each with its item count.
   */
  async listGalleries(): Promise<GalleryRefDto[]> {
    const [editions, events] = await Promise.all([
      this.prisma.edition.findMany({ include: { _count: { select: { items: true } } } }),
      this.prisma.event.findMany({ include: { _count: { select: { items: true } } } }),
    ]);
    return [
      ...editions.map((e) => ({ id: e.id, name: e.name, itemCount: e._count.items, kind: 'edition' as const })),
      ...events.map((e) => ({ id: e.id, name: e.name, itemCount: e._count.items, kind: 'event' as const })),
    ];
  }

  async get(id: string): Promise<MediaItemDto> {
    const item = await this.prisma.mediaItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Media item ${id} not found`);
    }
    return this.toDto(item);
  }

  /** Raw record including storage keys, which the public DTO omits. */
  async getRaw(id: string) {
    const item = await this.prisma.mediaItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Media item ${id} not found`);
    }
    return item;
  }

  async open(key: string): Promise<{ stream: NodeJS.ReadableStream; size: number }> {
    const size = await this.storage.size(key);
    return { stream: this.storage.stream(key), size };
  }

  contentTypeFor(key: string): string {
    return this.storage.contentTypeFor(key);
  }

  toDto(item: {
    id: string;
    title: string;
    type: MediaType;
    topic: string;
    previewKey: string;
    originalKey: string;
    mimeType: string;
    sizeBytes: number;
    publishedAt: Date;
    editionId: string | null;
    eventId: string | null;
  }): MediaItemDto {
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      topic: item.topic,
      previewUrl: `/media/${item.id}/preview`,
      downloadUrl: `/media/${item.id}/download`,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      publishedAt: toDate(item.publishedAt),
      editionId: item.editionId,
      eventId: item.eventId,
    };
  }
}
