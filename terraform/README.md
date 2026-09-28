# Render infrastructure

Provisions two Render services from this repo via the [render-oss/render](https://registry.terraform.io/providers/render-oss/render/latest/docs) provider:

- `render_web_service.backend` — the Mastra agent/workflow server (`npm run build` → `mastra build`, `npm run start` → `mastra start`)
- `render_static_site.web` — the Vite UI (`npm run build:ui`, published from `dist-web`), given the backend's URL as `VITE_MASTRA_API_URL`

## Prerequisites

- Render must be able to see this GitHub repo (connect it once in the Render dashboard under
  Account Settings → GitHub, or the initial `terraform apply` will prompt you to do so).
- `terraform >= 1.5`.

## Usage

Credentials come from environment variables, never from committed files. This repo's
`.env` already has `RENDER_API_KEY` and `RENDER_OWNER_ID`:

```sh
cd terraform
terraform init

set -a; source ../.env; set +a
export TF_VAR_anthropic_api_key="$ANTHROPIC_API_KEY"

terraform plan
terraform apply
```

## Notes / caveats

- The backend plan defaults to Render's `free` tier (`var.backend_plan`) — it spins down
  when idle and cold-starts on the next request.
- The Mastra backend stores traces/state in a local SQLite file (`mastra.db`, see
  `src/mastra/index.ts`). Render's filesystem is ephemeral, so this data will **not**
  survive a redeploy or restart. Fine for now; swap `LibSQLStore` for a hosted Postgres/
  Turso URL before relying on this for anything persistent.
- The UI calls the real backend (`src/web/lib/mastra-client.ts`) over `@mastra/client-js`,
  reading its base URL from `VITE_MASTRA_API_URL` — this is wired through to the backend
  service's URL above.
