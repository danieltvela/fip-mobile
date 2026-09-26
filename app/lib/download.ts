import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import type { MediaItemDto } from '@fip/shared';
import { absoluteUrl } from './api';

export type DownloadPhase = 'idle' | 'downloading' | 'saving' | 'done' | 'error';

export interface DownloadProgress {
  phase: DownloadPhase;
  fraction: number;
  error?: string;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'video/mp4': '.mp4',
  'audio/wav': '.wav',
  'audio/mpeg': '.mp3',
  'application/pdf': '.pdf',
};

/**
 * Downloads the full-quality rendition to device storage, reporting
 * progress in [0, 1]. Images and videos are additionally saved to the
 * device media library (camera roll); other types land in the app's
 * document directory.
 */
export async function downloadToDevice(
  item: MediaItemDto,
  onProgress: (progress: DownloadProgress) => void,
): Promise<void> {
  onProgress({ phase: 'downloading', fraction: 0 });
  const target = `${FileSystem.documentDirectory ?? ''}${filenameFor(item)}`;

  const resumable = FileSystem.createDownloadResumable(
    absoluteUrl(item.downloadUrl),
    target,
    {},
    (info) => {
      const total = info.totalBytesExpectedToWrite;
      const fraction = total > 0 ? info.totalBytesWritten / total : 0;
      onProgress({ phase: 'downloading', fraction });
    },
  );

  let result: FileSystem.FileSystemDownloadResult | null = null;
  try {
    result = (await resumable.downloadAsync()) ?? null;
  } catch (error) {
    onProgress({ phase: 'error', fraction: 0, error: String(error) });
    return;
  }
  if (!result?.uri) {
    onProgress({ phase: 'error', fraction: 0, error: 'Download produced no file' });
    return;
  }

  if (item.type === 'image' || item.type === 'video') {
    onProgress({ phase: 'saving', fraction: 1 });
    try {
      await MediaLibrary.saveToLibraryAsync(result.uri);
    } catch (error) {
      onProgress({ phase: 'error', fraction: 0, error: String(error) });
      return;
    }
  }

  onProgress({ phase: 'done', fraction: 1 });
}

function filenameFor(item: MediaItemDto): string {
  const base = item.title.replace(/[^a-zA-Z0-9._-]+/g, '_') || 'media';
  const extension = EXTENSION_BY_MIME[item.mimeType] ?? '.bin';
  return base.endsWith(extension) ? base : base + extension;
}
