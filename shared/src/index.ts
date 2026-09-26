// Domain model for the press room smart search (issues #8, #9).
export const MATERIAL_TYPES = ['note', 'dossier', 'image', 'video', 'audio'] as const;
export const MATERIAL_TOPICS = ['events', 'forums', 'agenda', 'institutional', 'other'] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];
export type MaterialTopic = (typeof MATERIAL_TOPICS)[number];

/** Search facets exposed by the toggle button in the press room. */
export const SEARCH_MODES = ['type', 'topic'] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

export const NEW_MATERIAL_WINDOW_HOURS = 48;

export interface Material {
  id: string;
  title: string;
  type: MaterialType;
  topic: MaterialTopic;
  createdAt: string;
  /** True when the material was added within the "new" window. */
  isNew: boolean;
}

export interface MaterialQuery {
  type?: MaterialType;
  topic?: MaterialTopic;
  page?: number;
  pageSize?: number;
}

export interface MaterialList {
  items: Material[];
  page: number;
  pageSize: number;
  total: number;
}

export function isMaterialType(value: unknown): value is MaterialType {
  return typeof value === 'string' && (MATERIAL_TYPES as readonly string[]).includes(value);
}

export function isMaterialTopic(value: unknown): value is MaterialTopic {
  return typeof value === 'string' && (MATERIAL_TOPICS as readonly string[]).includes(value);
}

/** A material counts as new when it was added within the "new" window. */
export function isRecentMaterial(createdAt: string | Date, now: Date = new Date()): boolean {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const cutoff = now.getTime() - NEW_MATERIAL_WINDOW_HOURS * 60 * 60 * 1000;
  return created.getTime() >= cutoff;
}

/** Builds the query string for GET /materials (omitting undefined params). */
export function buildMaterialsQueryString(query: MaterialQuery): string {
  const params = new URLSearchParams();
  if (query.type) params.set('type', query.type);
  if (query.topic) params.set('topic', query.topic);
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchMaterials(apiBaseUrl: string, query: MaterialQuery): Promise<MaterialList> {
  const response = await fetch(`${apiBaseUrl}/materials${buildMaterialsQueryString(query)}`);
  if (!response.ok) {
    throw new Error(`Failed to load materials (HTTP ${response.status})`);
  }
  return (await response.json()) as MaterialList;
}
