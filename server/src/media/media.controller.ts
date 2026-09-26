import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Readable } from 'node:stream';
import type { GalleryRefDto, MediaItemDto } from '@fip/shared';
import { MediaService } from './media.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /// Gallery listing; filter by `editionId` or `eventId`, newest first.
  @Get()
  async list(
    @Query('editionId') editionId?: string,
    @Query('eventId') eventId?: string,
  ): Promise<MediaItemDto[]> {
    return this.media.list({ editionId, eventId });
  }

  /// Galleries (editions and events) that scope the media list.
  @Get('galleries')
  async galleries(): Promise<GalleryRefDto[]> {
    return this.media.listGalleries();
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<MediaItemDto> {
    return this.media.get(id);
  }

  /// Compact rendition used for previews/thumbnails.
  @Get(':id/preview')
  @Header('Cache-Control', 'public, max-age=86400')
  @ApiProduces('image/*')
  async preview(@Param('id') id: string): Promise<StreamableFile> {
    const item = await this.media.getRaw(id);
    const { stream, size } = await this.media.open(item.previewKey);
    return new StreamableFile(stream as Readable, {
      type: this.media.contentTypeFor(item.previewKey),
      length: size,
    });
  }

  /// Full-quality rendition; this is what the app downloads.
  @Get(':id/download')
  async download(@Param('id') id: string): Promise<StreamableFile> {
    const item = await this.media.getRaw(id);
    const { stream, size } = await this.media.open(item.originalKey);
    return new StreamableFile(stream as Readable, {
      type: item.mimeType,
      length: size,
      disposition: `attachment; filename="${encodeURIComponent(item.title)}"`,
    });
  }
}
