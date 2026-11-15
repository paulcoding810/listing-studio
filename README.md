# Listing Studio

A browser-only design tool for store listing graphics: screenshots, feature graphics, promo tiles and device mockups for Google Play, the Apple App Store, the Chrome Web Store and more. No backend. Projects, images and fonts live in IndexedDB.

## Run

```sh
pnpm install
pnpm dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Type-check and build a static bundle into `dist/` |
| `pnpm test` | Unit tests (validation, templates, export paths, spec freshness) |
| `pnpm test:e2e` | Playwright smoke test. Set `CHROME_PATH` to use a local Chromium |

## Where things live

- `src/targets` holds store specs as data. Each entry records `sourceUrl` and `verifiedAt`; a unit test fails once any entry is a year old.
- `src/features/canvas` renders the document with React-Konva. The same scene renders offscreen for export and thumbnails.
- `src/store/editor-store.ts` is the editor state with undo/redo via zundo.
- `src/features/icons.ts` defines the app icon export sizes and store masks. One 1024 master renders each size directly.
- `src/templates` builds editable templates from JSON-like specs. Demo app screens are drawn procedurally in `src/demo`.

## CI and releases

GitHub Actions runs `.github/workflows/ci.yml` on every push to `main` and on pull requests: typecheck, lint, unit tests, build, and the Playwright smoke test.

To release, bump `version` in `package.json`, commit, then push a matching tag:

```sh
git tag v0.1.0 && git push origin v0.1.0
```

`.github/workflows/release.yml` reruns CI, checks the tag matches the package version, builds, and publishes a GitHub Release with the static site zipped. Tags with a suffix such as `v0.2.0-beta.1` become pre-releases.
