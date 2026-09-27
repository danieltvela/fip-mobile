import { MATERIAL_TYPES, MaterialType } from '@fip/shared';

/**
 * Seed catalog used by the press materials service until the Prisma data
 * layer lands. Ordering and pagination logic operates on these records the
 * same way it will operate on database rows.
 */

export interface SeedMaterial {
  id: string;
  title: string;
  summary: string;
  type: MaterialType;
  topic: string;
  /** Age in milliseconds counted backwards from server boot. */
  ageMs: number;
}

export const SEED_MATERIALS: SeedMaterial[] = [
  { id: 'pm-001', title: 'Launch of the 2026 institutional report', summary: 'Full report and executive summary of the 2026 institutional comparison.', type: 'note', topic: 'Institutions', ageMs: 30 * 60 * 1000 },
  { id: 'pm-002', title: 'Parallel institutions monitoring dossier, September', summary: 'Monthly dossier tracking activity across parallel institutions.', type: 'dossier', topic: 'Monitoring', ageMs: 5 * 60 * 60 * 1000 },
  { id: 'pm-003', title: 'Opening ceremony photo set', summary: 'High-resolution photos from the latest opening ceremony.', type: 'image', topic: 'Events', ageMs: 26 * 60 * 60 * 1000 },
  { id: 'pm-004', title: 'Interview with the foundation director', summary: 'Recorded interview on the foundation roadmap for the year.', type: 'video', topic: 'Interviews', ageMs: 2 * 24 * 60 * 60 * 1000 },
  { id: 'pm-005', title: 'Radio appearance: transparency agenda', summary: 'Audio clip from the morning radio program.', type: 'audio', topic: 'Media', ageMs: 3 * 24 * 60 * 60 * 1000 },
  { id: 'pm-006', title: 'Statement on electoral observation', summary: 'Official statement regarding the electoral observation cycle.', type: 'note', topic: 'Elections', ageMs: 4 * 24 * 60 * 60 * 1000 },
  { id: 'pm-007', title: 'Legislative comparison dossier, Q3', summary: 'Quarterly comparison of legislative activity.', type: 'dossier', topic: 'Monitoring', ageMs: 6 * 24 * 60 * 60 * 1000 },
  { id: 'pm-008', title: 'Panel discussion photo set', summary: 'Photo gallery from the annual panel discussion.', type: 'image', topic: 'Events', ageMs: 8 * 24 * 60 * 60 * 1000 },
  { id: 'pm-009', title: 'Briefing video: methodology overview', summary: 'Explainer video on the comparison methodology.', type: 'video', topic: 'Methodology', ageMs: 10 * 24 * 60 * 60 * 1000 },
  { id: 'pm-010', title: 'Podcast episode: parallel institutions 101', summary: 'Podcast episode introducing the project.', type: 'audio', topic: 'Media', ageMs: 12 * 24 * 60 * 60 * 1000 },
  { id: 'pm-011', title: 'Workshop summary note', summary: 'Summary of outcomes from the journalist workshop.', type: 'note', topic: 'Training', ageMs: 15 * 24 * 60 * 60 * 1000 },
  { id: 'pm-012', title: 'Anniversary gala photo set', summary: 'Photos from the foundation anniversary gala.', type: 'image', topic: 'Events', ageMs: 20 * 24 * 60 * 60 * 1000 },
];

export function validateType(value: string): value is MaterialType {
  return (MATERIAL_TYPES as readonly string[]).includes(value);
}
