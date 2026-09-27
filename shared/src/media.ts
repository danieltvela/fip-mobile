/// Mirrors the server-side `MediaType` Prisma enum.
export type MediaType = 'note' | 'dossier' | 'image' | 'video' | 'audio';

/** DTO for a media item as served by the API. */
export interface MediaItemDto {
  id: string;
  title: string;
  type: MediaType;
  topic: string;
  /** Relative URL for the compact preview rendition. */
  previewUrl: string;
  /** Relative URL for the full-quality rendition, used on detail screens. */
  fullPreviewUrl: string;
  /** Relative URL for the full-quality download. */
  downloadUrl: string;
  mimeType: string;
  sizeBytes: number;
  publishedAt: string;
  editionId: string | null;
  eventId: string | null;
}

/** Container/grouping for galleries. */
export interface GalleryRefDto {
  id: string;
  name: string;
  itemCount: number;
  kind: 'edition' | 'event';
}
