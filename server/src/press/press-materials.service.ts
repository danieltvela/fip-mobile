import { Injectable, Optional } from '@nestjs/common';
import { PressMaterial, PressMaterialPage } from '@fip/shared';
import { SEED_MATERIALS, SeedMaterial } from './seed';

/** Materials published within this window are flagged as new. */
export const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

const MAX_PAGE_SIZE = 50;

@Injectable()
export class PressMaterialsService {
  private readonly seeds: SeedMaterial[];
  private readonly now: () => number;

  constructor(@Optional() seed: SeedMaterial[] = SEED_MATERIALS, @Optional() now: () => number = Date.now) {
    this.seeds = seed;
    this.now = now;
  }

  /**
   * Newest-first paginated listing. Sorting by publishedAt happens before
   * slicing so pagination always advances through the full catalog.
   */
  list(page: number, pageSize: number): PressMaterialPage {
    const size = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
    const currentPage = Math.max(page, 1);

    const materials = [...this.seeds]
      .map((seed) => this.toMaterial(seed))
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

    const total = materials.length;
    const start = (currentPage - 1) * size;
    const items = materials.slice(start, start + size);

    return {
      items,
      page: currentPage,
      pageSize: size,
      total,
      hasMore: start + items.length < total,
    };
  }

  private toMaterial(seed: SeedMaterial): PressMaterial {
    const publishedAt = new Date(this.now() - seed.ageMs).toISOString();
    return {
      id: seed.id,
      title: seed.title,
      summary: seed.summary,
      type: seed.type,
      topic: seed.topic,
      publishedAt,
      isNew: seed.ageMs < NEW_WINDOW_MS,
    };
  }
}
