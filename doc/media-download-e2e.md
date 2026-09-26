# Media gallery download — end-to-end verification

How to reproduce the full download flow (issue #10) against real seeded files.

## Dev setup

1. Start infrastructure and API:

   ```sh
   docker compose up -d
   pnpm --filter @fip/server db:seed   # writes real PNG/PDF/etc. blobs to server/storage/
   pnpm --filter @fip/server build && node server/dist/main.js
   ```

   The API listens on `PORT` (default 3000; the worktree CI/dev convention is 3311 via `PORT=3311`).

2. `EXPO_PUBLIC_API_URL` is **required** — there is no localhost fallback. Expo inlines
   `EXPO_PUBLIC_*` variables at bundle time, so `localhost` never reaches the API from a
   physical device. Find your LAN IP (`ip addr` / `ifconfig`) and start the app:

   ```sh
   EXPO_PUBLIC_API_URL=http://<LAN-IP>:3311 pnpm --filter @fip/app start
   ```

   The app throws immediately with instructions if the variable is missing.

3. On the device grant the media-library permission when prompted (used by
   `MediaLibrary.saveToLibraryAsync` in `app/lib/download.ts`).

## Verification steps

1. Open the gallery tab, pick an edition/event, open any image item.
2. Confirm the detail screen renders the **full-quality** rendition:
   the app now loads `/media/:id/full-preview`, which streams the original blob
   (same bytes as `/media/:id/download`), not the 320px compact preview
   (`/media/:id/preview`). A seeded image is 1280×720; the 320px preview is visibly
   softer when zoomed.
3. Tap **Download to device**. The button shows a progress bar (0–100 %,
   driven by `createDownloadResumable` byte callbacks), then *Saving to media
   library…*, then *Saved to device*.
4. Open the device Photos app: the saved image is present and matches the original.

Byte-level integrity is confirmed server-side by comparing
`sha256(server/storage/original/<key>)` with `sha256` of the bytes fetched from
`/media/:id/download` — they are streamed verbatim from the same MinIO/local-blob
key, so whatever the device saves is exactly the seeded file.
