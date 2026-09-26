# fip-mobile

Mobile app for the press/media team of **Fundación Instituciones Paralelas (FIP)**, built from the product spec in [`doc/2026 Mobile App Comunicacion - FIP.pdf`](doc/2026%20Mobile%20App%20Comunicacion%20-%20FIP.pdf).

Features: real-time notification center with push notifications, mobile press room with smart search and downloadable media gallery, FIP event agenda with filters and favorites, journalist agenda management (request states: confirmed / pending / rejected), digital press credential with locator code, and a chat-style contact channel with the press office.

## Monorepo layout

| Package | Path | Description |
|---|---|---|
| `app` | [`app/`](app/) | Mobile app — React Native + Expo (managed workflow) + Expo Router, TypeScript |
| `server` | [`server/`](server/) | API — NestJS + Prisma + PostgreSQL, JWT auth (Passport), Socket.io realtime |
| `admin` | [`admin/`](admin/) | Press team management panel — Next.js (App Router) + TanStack Query |
| `shared` | [`shared/`](shared/) | Shared types and API contracts (OpenAPI-generated clients) |

## Getting started

Prerequisites: Node >= 22 and [pnpm](https://pnpm.io) >= 10.

```bash
pnpm install          # install all workspace dependencies
pnpm dev              # run all workspaces in dev mode (via turbo)
```

Useful commands:

```bash
pnpm lint             # ESLint across workspaces
pnpm typecheck        # TypeScript project-wide
pnpm test             # unit tests (Vitest/Jest per workspace)
pnpm build            # build all workspaces
pnpm format           # Prettier
```

## Infrastructure (self-hosted)

Docker Compose brings up PostgreSQL, MinIO (S3-compatible media storage) and the API server. Push notifications go out through `expo-server-sdk` directly to APNs/FCM using the owner's Apple Developer and Google Play credentials.

## Work status

Work items are tracked as GitHub issues in `danieltvela/fip-mobile`. Repo conventions and stack decisions are documented in [`AGENTS.md`](AGENTS.md).
