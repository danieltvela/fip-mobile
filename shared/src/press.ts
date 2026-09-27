/**
 * Press room domain types shared between the API server and the mobile app.
 */

export const MATERIAL_TYPES = ['note', 'dossier', 'image', 'video', 'audio'] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

/** A downloadable/consumable press material published by the press office. */
export interface PressMaterial {
  id: string;
  title: string;
  summary: string;
  type: MaterialType;
  topic: string;
  /** Publication timestamp (ISO 8601) used for newest-first ordering. */
  publishedAt: string;
  /**
   * True while the material is considered "new" (recently published).
   * The mobile app renders a dot indicator for new materials.
   */
  isNew: boolean;
}

/** A single page of the newest-first, paginated press material listing. */
export interface PressMaterialPage {
  items: PressMaterial[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/** Query parameters accepted by GET /press/materials. */
export interface PressMaterialQuery {
  page?: number;
  pageSize?: number;
}
