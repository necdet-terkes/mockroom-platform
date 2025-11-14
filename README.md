# Mockroom Platform

Proof-of-concept workspace that demonstrates how Mockoon-backed mocks can be generated and refreshed dynamically while a UI consumes them. The goal is to validate that the same UI can operate against real data, a static mock payload, or freshly generated dynamic content and that Mockoon reacts automatically whenever the mock dataset changes.

Multi-app PNPM workspace for experimenting with movie search UX against both a live IMDB proxy and a fully controlled mock stack. It bundles the UI, the proxy API, a mock-data generator that rewrites Mockoon environments, and the Mockoon CLI runtime itself so you can switch between real and synthetic responses in seconds.

The POC specifically showcases:

- Dynamic mock creation directly from the UI via the **Generate Mock Data** button.
- Conditional behavior where mock responses can be purely static (pre-seeded in Mockoon) or dynamic (written on-demand by `mock-generator-api`) depending on the current mode and query.
- Automatic propagation of new mock payloads: when the generator updates `environment.json`, Mockoon reloads the route so subsequent requests use the latest dataset without manual restarts.

## Repository Layout

| Path | Description | Default port |
| --- | --- | --- |
| `apps/dummy-product-ui` | React + Vite frontend that searches movies and can target the real or mock APIs. | 5173 |
| `apps/dummy-product-api` | Express proxy that forwards queries to `imdb.iamidiotareyoutoo.com`. | 4001 |
| `apps/mock-generator-api` | Express service that generates movie payloads and patches the Mockoon environment. | 5500 |
| `apps/mockoon-server` | Mockoon CLI + PM2 wrapper that serves the static and generator-driven mocks. | 4005 |
| `packages/mockoon-helper` | Minimal helper for mutating Mockoon environment JSON files. | — |
| `packages/shared-types` | Placeholder for types shared between apps and services. | — |

## Prerequisites

- Node.js 20.x (the workspace relies on modern ESM + TS features).
- [pnpm](https://pnpm.io/) ≥ 9 (the lockfile was generated with pnpm 9.x).
- PM2 is installed automatically via dependencies, no global install is required.

## Installation

```bash
pnpm install
```

> Tip: the workspace is configured as `private` and uses pnpm workspaces, so the command above installs dependencies for every app/package.

## Environment Variables

### `apps/dummy-product-ui`

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:4001/api` | Where the UI sends movie searches. Point this to Mockoon (e.g. `http://localhost:4005/api`) when working fully offline. |
| `VITE_API_MODE` | `real` | Toggles UI copy + caching behavior. Accepts `real` or `mock`. |
| `VITE_MOCK_GENERATOR_BASE_URL` | `http://localhost:5500` | Location of the mock-generator service that updates Mockoon. |

You can create `.env`, `.env.development.real`, and `.env.development.mock` files under `apps/dummy-product-ui` so that `pnpm dev:dummy-ui-real` and `pnpm dev:dummy-ui-mock` pick up the correct values per mode.

### `apps/mock-generator-api`

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5500` | Listen port for the generator API. |
| `ENV_PATH` | `apps/mockoon-server/environment.json` (absolute path override allowed) | Path to the Mockoon environment file that should be updated. The repo default points to the workspace copy under `apps/mockoon-server`. |

## Available Scripts

All scripts below are defined at the repo root (`package.json`) and can be combined with `pnpm`’s filtering when needed.

| Script | What it does |
| --- | --- |
| `pnpm dev:dummy-api` | Starts the Express proxy at `http://localhost:4001/api`. |
| `pnpm dev:dummy-ui-real` | Runs the Vite dev server in “real data” mode (expects the proxy above). |
| `pnpm dev:dummy-ui-mock` | Runs the Vite dev server in mock mode (expects Mockoon at `VITE_API_BASE_URL`). |
| `pnpm dev:mock-api` | Starts the mock-generator API responsible for seeding Mockoon. |
| `pnpm dev:mock-ui` | Placeholder for a future dedicated UI for the mock generator. |
| `pnpm dev:mockoon` | Boots the Mockoon CLI through PM2 using `apps/mockoon-server/environment.json`. |
| `pnpm dev:all:mock` | Convenience command that runs the proxy, generator, UI (mock mode), and Mockoon together via `concurrently`. |

Per-package TypeScript checks can be executed with `pnpm --filter <package> exec tsc --noEmit`, and the UI production bundle can be created via `pnpm --filter dummy-product-ui run build`.

## Running the Platform

### Real data flow (proxying IMDB)

1. `pnpm dev:dummy-api`
2. `pnpm dev:dummy-ui-real`
3. Open `http://localhost:5173`, enter a query such as `Matrix`, and observe that the UI badge shows `Data source: REAL` while results are fetched from the proxy (`/movies?q=Matrix&_ts=...`).

This mode is ideal for verifying that the end-to-end flow works against the live upstream API and for comparing field parity with the mock data.

### Mock data flow (Mockoon + generator)

1. Ensure `apps/mockoon-server/environment.json` exists and that `ENV_PATH` (if overridden) points to it.
2. Run everything with `pnpm dev:all:mock` **or** manually start `pnpm dev:mockoon`, `pnpm dev:mock-api`, and `pnpm dev:dummy-ui-mock`.
3. Open `http://localhost:5173` again; the badge should read `Data source: MOCK` once your `.env` sets `VITE_API_MODE=mock` and `VITE_API_BASE_URL=http://localhost:4005/api`.
4. (Optional) Click **Generate Mock Data** in the UI. This triggers `mock-generator-api`, which writes a fresh response into the Mockoon environment so the next `/movies` call returns brand-new sample content.

### Direct generator usage

You can seed Mockoon without the UI involved:

```bash
curl "http://localhost:5500/api/movies?q=thriller"
```

The generator responds with metadata about the updated environment file. Combine this with `pnpm dev:mockoon` to pre-populate mock responses for QA teams.

## Example Scenarios

1. **Compare live vs mock payloads**  
   - Start the proxy (`pnpm dev:dummy-api`) and the UI in real mode. Search for `Dune` and note the offers/years returned by the live API.  
   - Switch to mock mode (update `.env` + restart `pnpm dev:dummy-ui-mock`) pointing at Mockoon (`http://localhost:4005/api`). Use **Generate Mock Data** and repeat the same search to verify UI resilience to random payloads (missing offers, different image arrays, etc.).

2. **Regenerate mocks for a specific keyword**  
   - With the mock stack running, type the keyword you want to curate (for example `noir`) in the UI.  
   - Click **Generate Mock Data** to persist a payload for that keyword inside `environment.json`.  
   - Either hit “Search” in the UI or call `curl "http://localhost:4005/api/movies?q=noir"` to confirm that Mockoon now returns the freshly generated dataset.

3. **Headless smoke test**  
   - Start the services with `pnpm dev:dummy-api` and `pnpm dev:mock-api`.  
   - Use `pnpm --filter dummy-product-ui run build` followed by `pnpm --filter dummy-product-ui exec vite preview --host` to serve the production bundle against the proxy.  
   - Drive the preview with a tool like Playwright or Cypress to validate that both `REAL` and `MOCK` modes continue to work after code changes.

## Troubleshooting

- **TypeScript complains about `ignoreDeprecations`** – use TypeScript ≥ 5.0 (already enforced in this repo). If you upgrade the compiler, keep `ignoreDeprecations` at a version value that the compiler understands.  
- **Mockoon does not update** – confirm that `ENV_PATH` is correct and writable, and that PM2 is watching the same file (`apps/mockoon-server/environment.json`).  
- **UI still points to REAL after switching modes** – double-check the `.env.development.mock` file is present and restart `pnpm dev:dummy-ui-mock` so Vite reloads environment variables.

The combination of the README, scripts, and environment variables should give you everything needed to demo, test, or extend the Mockroom Platform quickly.
