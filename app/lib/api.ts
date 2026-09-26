import type { GalleryRefDto, MediaItemDto } from '@fip/shared';

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3311';

export function absoluteUrl(path: string): string {
  return path.startsWith('/') ? `${API_BASE}${path}` : path;
}

export async function listMedia(scope: {
  editionId?: string;
  eventId?: string;
}): Promise<MediaItemDto[]> {
  const params = new URLSearchParams(
    Object.entries(scope).filter(([, value]) => value != null),
  );
  const query = params.size > 0 ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/media${query}`);
  if (!res.ok) {
    throw new Error(`Failed to load media (${res.status})`);
  }
  return res.json();
}

export async function listGalleries(): Promise<GalleryRefDto[]> {
  const res = await fetch(`${API_BASE}/media/galleries`);
  if (!res.ok) {
    throw new Error(`Failed to load galleries (${res.status})`);
  }
  return res.json();
}

export async function getMedia(id: string): Promise<MediaItemDto> {
  const res = await fetch(`${API_BASE}/media/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to load media item (${res.status})`);
  }
  return res.json();
}
