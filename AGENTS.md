# AGENTS.md

## Project

Mobile app for the press/media team of **Fundación Instituciones Paralelas (FIP)**, built from the spec in `doc/2026 Mobile App Comunicacion - FIP.pdf` (note: the PDF is in Spanish; everything else in the project must be English).

Functional scope: real-time notification center + push notifications, mobile press room with smart search and media gallery (downloadable), event agenda with filters/favorites, journalist agenda management (requests with states: confirmed / pending / rejected / accepted), digital press credential with locator code, and a chat-style contact channel with the press office.

## Stack decisions (agreed with owner, do not relitigate without asking)

Targets iOS + Android; owner holds both Apple Developer and Google Play accounts; infrastructure is **self-hosted** (no managed PaaS); admin panel (#17) is a custom frontend, not a generated admin.

- **Monorepo**: pnpm workspaces — `app/` (mobile), `server/` (API), `admin/` (panel), `shared/` (types + API client).
- **Mobile**: React Native + Expo (managed workflow) + Expo Router, TypeScript.
- **Backend**: NestJS + Prisma + PostgreSQL; auth = JWT (access+refresh) via Passport; realtime = Socket.io (`@nestjs/websockets`).
- **API contracts**: OpenAPI generated from NestJS (`@nestjs/swagger`); typed clients generated for `app/` and `admin/`.
- **Admin**: Next.js (App Router) + TanStack Query.
- **Media storage**: MinIO (S3-compatible) in Docker, pre-signed URLs for downloads.
- **Push**: `expo-server-sdk` server-side → APNs/FCM, with Expo Router deep-linking into the notification center.
- **Tooling**: ESLint + Prettier + Vitest/Jest; CI in GitHub Actions (lint → typecheck → test → build).
- **Runtime**: Docker Compose brings up PostgreSQL + MinIO + server.

## Commands (verified, run at repo root)

Prereqs: Node >= 22, pnpm (installed via npm; v12 uses `allowBuilds` in `pnpm-workspace.yaml`, not `onlyBuiltDependencies`) (approved builds: prisma/@prisma engines/@parcel watcher/unrs-resolver).

- `pnpm install` — installs the whole workspace (shared lockfile, pnpm 12).
- `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm dev` — all orchestrated by Turborepo across the 4 packages. `pnpm test`/`build` are currently green; run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` before finishing any change (same order CI uses).
- Tests run with `--passWithNoTests` everywhere until real suites exist.
- `server` boots standalone via `node server/dist/main.js` (prints Nest startup logs); port from `PORT` env, default 3000.
- `pnpm --filter @fip/server run db:migrate:dev -- --name <change>` creates a Prisma migration; `db:migrate:deploy` replays all migrations in a clean environment. Copy `server/.env.example` to `server/.env` for the local `DATABASE_URL`.
- `admin` (Next.js) writes `.next/`, `server` builds to `dist/`, `shared` compiles to `dist/` via `tsc`.
- `app` (Expo) has no `build` task in turbo; dev happens with `pnpm --filter @fip/app start` (interactive).

## Gotchas

- Do not add `"noEmit": true` to `server/tsconfig.json` or `shared/tsconfig.json` — `nest build`/`tsc build` emit `noEmit` warnings is misleading; typecheck scripts already pass `--noEmit` explicitly.
- ESLint root flat config ignores `*.config.{js,mjs}` — keep config files outside pattern if a rule is needed on them.
- All package `build` tasks depend on upstream `^build` in `turbo.json`; `@fip/shared` must be built before consumers typecheck.

## Language convention

**All project content is in English**: code, UI strings, docs, commit messages, and especially GitHub issues. This was a deliberate decision by the owner — never write new issues, comments, or UI text in Spanish.

## Issue numbering

Issues #1 and #2 don't exist — active issues are #3–#18. Some issue bodies originally contained off-by-one cross-references; the correct dependency map is: #12 (request backend) is consumed by #13, #15 (messaging backend) is consumed by #16, and #17 depends on #3, #12, #15.

## Repository & issue tracking

- Remote: `github.com/danieltvela/fip-mobile` (SSH). The repo is greenfield — a single initial commit with an empty `README.md`. No build/test tooling exists yet; commands will need to be chosen and documented here as they are introduced.
- Work items live as **GitHub issues** (not local tracking files). Labels in use: `status:backlog`, `swe`.
- Issues map roughly to the spec sections: ceremony/order = #3→#5, press room = #8–#10, agenda = #11–#13, credential = #14, chat = #15/#16, admin panel = #17, E2E = #18.
