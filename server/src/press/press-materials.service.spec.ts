import { PressMaterialsService, NEW_WINDOW_MS } from './press-materials.service';
import { SeedMaterial } from './seed';

const HOUR = 60 * 60 * 1000;

function fixedNow(): number {
  return Date.parse('2026-09-26T12:00:00Z');
}

const fixtures: SeedMaterial[] = [
  { id: 'old-1', title: 'Old note', summary: '', type: 'note', topic: 'Events', ageMs: 30 * 24 * HOUR },
  { id: 'new-1', title: 'Fresh video', summary: '', type: 'video', topic: 'Media', ageMs: 2 * HOUR },
  { id: 'mid-1', title: 'Mid dossier', summary: '', type: 'dossier', topic: 'Monitoring', ageMs: 3 * 24 * HOUR },
  { id: 'new-2', title: 'Fresh image', summary: '', type: 'image', topic: 'Events', ageMs: 20 * HOUR },
  { id: 'old-2', title: 'Old audio', summary: '', type: 'audio', topic: 'Media', ageMs: 40 * 24 * HOUR },
];

describe('PressMaterialsService', () => {
  const service = new PressMaterialsService(fixtures, fixedNow);

  it('orders the listing newest first', () => {
    const page = service.list(1, 10);
    expect(page.items.map((m) => m.id)).toEqual(['new-1', 'new-2', 'mid-1', 'old-1', 'old-2']);
  });

  it('marks only recently published materials as new', () => {
    const byId = Object.fromEntries(service.list(1, 10).items.map((m) => [m.id, m]));
    expect(byId['new-1'].isNew).toBe(true);
    expect(byId['new-2'].isNew).toBe(true);
    expect(byId['mid-1'].isNew).toBe(false);
  });

  it('paginates newest first across pages', () => {
    const first = service.list(1, 2);
    const second = service.list(2, 2);
    const last = service.list(3, 2);

    expect(first.items.map((m) => m.id)).toEqual(['new-1', 'new-2']);
    expect(first.hasMore).toBe(true);
    expect(first.total).toBe(5);
    expect(second.items.map((m) => m.id)).toEqual(['mid-1', 'old-1']);
    expect(second.hasMore).toBe(true);
    expect(last.items.map((m) => m.id)).toEqual(['old-2']);
    expect(last.hasMore).toBe(false);
  });

  it('clamps invalid page and pageSize values', () => {
    expect(service.list(-1, 500).pageSize).toBe(50);
    expect(service.list(0, 0).pageSize).toBe(1);
    expect(service.list(99, 10).items).toEqual([]);
  });

  it('keeps the new-window definition stable', () => {
    expect(NEW_WINDOW_MS).toBe(24 * HOUR);
  });
});
