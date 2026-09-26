import { Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Readable } from 'node:stream';

/**
 * Blob storage for media payloads. Local disk for now; the interface is
 * shaped so a MinIO/S3 implementation can replace it without touching
 * callers (key in → bytes/stream out).
 */
@Injectable()
export class StorageService {
  private readonly root = resolve(
    process.env.MEDIA_STORAGE_DIR ?? join(process.cwd(), 'storage'),
  );

  async put(key: string, data: Uint8Array): Promise<void> {
    const path = this.path(key);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, data);
  }

  async size(key: string): Promise<number> {
    const s = await stat(this.path(key)).catch(() => null);
    if (!s) {
      throw new NotFoundException(`Blob not found: ${key}`);
    }
    return s.size;
  }

  stream(key: string): Readable {
    return createReadStream(this.path(key));
  }

  private path(key: string): string {
    if (key.includes('..') || key.startsWith('/')) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return join(this.root, key);
  }

  /// Content type inferred from the stored blob's extension.
  contentTypeFor(key: string): string {
    const MIME_BY_EXTENSION: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.pdf': 'application/pdf',
    };
    const extension = key.slice(key.lastIndexOf('.')).toLowerCase();
    return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
  }
}
