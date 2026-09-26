# Domain data model

Versioned with Prisma Migrations. The source of truth is `prisma/schema.prisma`;
every change ships with a migration under `prisma/migrations/` (created via
`pnpm --filter @fip/server run db:migrate:dev -- --name <change>` against a local
PostgreSQL instance, `DATABASE_URL` in `server/.env`).

## Reproducing in a clean environment

1. Bring up PostgreSQL (any instance reachable at `DATABASE_URL`).
2. `pnpm --filter @fip/server run db:migrate:deploy` — replays all migrations in
   order and records them in `_prisma_migrations`.
3. `pnpm exec prisma generate` regenerates the typed client (already done
   automatically on install/dev).

Schema version = contents of `prisma/migrations/` (one ordered SQL file per change).

## Entities

| Model | Table | Purpose |
| --- | --- | --- |
| `Outlet` | `outlets` | Media organization; journalists belong to one. |
| `Journalist` | `journalists` | Press professional, optionally linked to an outlet. |
| `Topic` | `topics` | Slug-tagged topic for press materials. |
| `PressMaterial` | `press_materials` | Press-room content; `kind` ∈ NOTE, DOSSIER, IMAGE, VIDEO, AUDIO. Notes/dossiers carry `body`, media files carry a MinIO object key (`mediaKey`) downloaded via pre-signed URLs. Topics are attached through `press_material_topics`. |
| `AgendaItem` | `agenda_items` | Agenda event; `parentId` chains sessions to a parent event. |
| `AgendaRequest` | `agenda_requests` | Journalist request to attend an item; `status` ∈ CONFIRMED, PENDING, REJECTED. Unique per (journalist, item). |
| `Credential` | `credentials` | Digital press credential; `locatorCode` is globally unique. |
| `Notification` | `notifications` | Notification-center entry; `typology` ∈ PRESS_NOTE, AGENDA_CHANGE, INTERVIEW, PRIVATE_COMMUNICATION, INCIDENT. `data` is a JSON payload for deep links. |
| `ContactMessage` | `contact_messages` | Chat-style message between a journalist and the press office (`authorStaffName` set ⇒ written by staff). |
