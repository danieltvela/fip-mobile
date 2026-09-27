import { MaterialsService } from './materials.service';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = new Date('2026-09-26T12:00:00.000Z');

interface Row {
  id: string;
  title: string;
  type: string;
  topic: string;
  createdAt: Date;
}

/** Known dataset: mixed types/topics, some inside the 48h "new" window. */
const DATASET: Row[] = [
  { id: '1', title: 'President speech video', type: 'video', topic: 'institutional', createdAt: new Date(NOW.getTime() - 1 * HOUR) },
  { id: '2', title: 'Forum program note', type: 'note', topic: 'forums', createdAt: new Date(NOW.getTime() - 3 * HOUR) },
  { id: '3', title: 'Agenda photo set', type: 'image', topic: 'agenda', createdAt: new Date(NOW.getTime() - 49 * HOUR) },
  { id: '4', title: 'Annual dossier', type: 'dossier', topic: 'institutional', createdAt: new Date(NOW.getTime() - 4 * DAY) },
  { id: '5', title: 'Event highlights video', type: 'video', topic: 'events', createdAt: new Date(NOW.getTime() - 5 * DAY) },
  { id: '6', title: 'Forum closing note', type: 'note', topic: 'forums', createdAt: new Date(NOW.getTime() - 6 * DAY) },
  { id: '7', title: 'Institutional audio spot', type: 'audio', topic: 'institutional', createdAt: new Date(NOW.getTime() - 7 * DAY) },
  { id: '8', title: 'Old event photos', type: 'image', topic: 'events', createdAt: new Date(NOW.getTime() - 30 * DAY) },
];

function matchesFilters(row: Row, where: { type?: string; topic?: string }): boolean {
  return (!where.type || row.type === where.type) && (!where.topic || row.topic === where.topic);
}

function fakeRepo(rows: Row[]) {
  return {
    material: {
      count: (args: { where: { type?: string; topic?: string } }) =>
        rows.filter((row) => matchesFilters(row, args.where)).length,
      findMany: (args: {
        where: { type?: string; topic?: string };
        orderBy: object;
        skip: number;
        take: number;
      }) =>
        rows
          .filter((row) => matchesFilters(row, args.where))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(args.skip, args.skip + args.take),
    },
  };
}

function serviceWith(rows: Row[]): MaterialsService {
  return new MaterialsService(fakeRepo(rows) as never);
}

describe('MaterialsService', () => {
  it('lists the whole dataset newest first with isNew marking', async () => {
    const list = await serviceWith(DATASET).findMaterials({});
    expect(list.total).toBe(8);
    expect(list.items.map((item) => item.id)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    expect(list.items[0].isNew).toBe(true);
    expect(list.items[1].isNew).toBe(true);
    expect(list.items[2].isNew).toBe(false);
    expect(list.items[7].isNew).toBe(false);
  });

  it('filters by type only', async () => {
    const list = await serviceWith(DATASET).findMaterials({ type: 'video' });
    expect(list.total).toBe(2);
    expect(list.items.map((item) => item.title)).toEqual([
      'President speech video',
      'Event highlights video',
    ]);
  });

  it('filters by topic only', async () => {
    const list = await serviceWith(DATASET).findMaterials({ topic: 'forums' });
    expect(list.total).toBe(2);
    expect(list.items.every((item) => item.topic === 'forums')).toBe(true);
  });

  it('combines type and topic filters', async () => {
    const list = await serviceWith(DATASET).findMaterials({ type: 'video', topic: 'events' });
    expect(list.total).toBe(1);
    expect(list.items[0].title).toBe('Event highlights video');
  });

  it('returns empty results when the combination matches nothing', async () => {
    const list = await serviceWith(DATASET).findMaterials({ type: 'audio', topic: 'agenda' });
    expect(list.total).toBe(0);
    expect(list.items).toEqual([]);
  });

  it('paginates filtered results', async () => {
    const page1 = await serviceWith(DATASET).findMaterials({ topic: 'institutional', page: 1, pageSize: 2 });
    const page2 = await serviceWith(DATASET).findMaterials({ topic: 'institutional', page: 2, pageSize: 2 });
    expect(page1.total).toBe(3);
    expect(page1.items).toHaveLength(2);
    expect(page2.items.map((item) => item.id)).toEqual(['7']);
  });
});

