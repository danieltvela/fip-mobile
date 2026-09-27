import type { GalleryRefDto, MediaItemDto } from '@fip/shared';

/**
 * Base URL of the FIP API. `EXPO_PUBLIC_API_URL` is required: Expo inlines
 * `EXPO_PUBLIC_*` vars at bundle time, and localhost never resolves on a
 * physical device — see doc/media-download-e2e.md for the dev setup.
 */
export const API_BASE = requiredApiBase();

function requiredApiBase(): string {
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is required. Start the app with it set, e.g. '
        + 'EXPO_PUBLIC_API_URL=http://<LAN-IP>:3311 pnpm --filter @fip/app start',
    );
  }
  return base.replace(/\/$/, '');
}

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
