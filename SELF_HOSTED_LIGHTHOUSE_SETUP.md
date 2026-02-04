# Self-Hosted Lighthouse Runner Setup

## 1) Create Supabase Table
Run this SQL in Supabase SQL editor:

```sql
create table if not exists public.lighthouse_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  checked_at timestamptz default now(),
  site text not null,
  strategy text not null check (strategy in ('mobile','desktop')),
  final_url text,
  homepage_load_sec numeric,
  performance integer,
  accessibility integer,
  seo integer,
  best_practices integer,
  perf_recommendations jsonb default '[]'::jsonb,
  seo_recommendations jsonb default '[]'::jsonb,
  uiux_recommendations jsonb default '[]'::jsonb
);

alter table public.lighthouse_runs enable row level security;

drop policy if exists "allow read lighthouse runs" on public.lighthouse_runs;
create policy "allow read lighthouse runs"
on public.lighthouse_runs
for select
to anon
using (true);

-- If using SUPABASE_SERVICE_ROLE_KEY on server, insert policy is optional.
-- If inserting via anon key, enable this policy:
-- drop policy if exists "allow insert lighthouse runs" on public.lighthouse_runs;
-- create policy "allow insert lighthouse runs"
-- on public.lighthouse_runs
-- for insert
-- to anon
-- with check (true);
```

## 2) Vercel Environment Variables
Add:

- `LIGHTHOUSE_INGEST_TOKEN` (random long secret)
- `SUPABASE_SERVICE_ROLE_KEY` (recommended)
- `GITHUB_ACTIONS_TOKEN` (PAT with Actions write + Contents read on this repo)
- `GITHUB_REPO_OWNER` (example: `LukaKhaladze`)
- `GITHUB_REPO_NAME` (example: `webtwin.ai`)
- `GITHUB_WORKFLOW_FILE` (optional, default: `lighthouse-runner.yml`)
- `GITHUB_WORKFLOW_REF` (optional, default: `main`)
- existing Supabase vars already in use

## 3) GitHub Secrets (for workflow)
In repo settings -> Secrets and variables -> Actions, add:

- `APP_BASE_URL` (example: `https://webtwinai.vercel.app`)
- `LIGHTHOUSE_INGEST_TOKEN` (same as Vercel)

Optional for scheduled runs without user input:
- Repository variable `DEFAULT_TARGET_SITE` (example: `https://hsetrainings.ge`)

## 4) Run Workflow
Go to Actions -> `Self-hosted Lighthouse Runner` -> `Run workflow` and set input `site`.

Or from app: Overview page -> enter site -> `Scan Website` (dispatches workflow).

After first successful run, `/app/overview?site=...` will show Lighthouse data from self-hosted scans.
