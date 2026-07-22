# Vercel Deployment

The web app is deployed as a Next.js application from the repository root.

## Project Settings

- Framework Preset: `Next.js`
- Install Command: `npm ci --include=optional`
- Build Command: `npm run build --workspace=apps/web`
- Output Directory: keep Vercel's Next.js default

The root `vercel.json` mirrors these settings so the repository can be imported without relying on local Docker configuration.

## Environment Variables

Set production and preview values in the Vercel dashboard:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
NEXT_PUBLIC_AUTH_BYPASS=false
DATABASE_URL=<hosted-postgres-connection-string>
SUPABASE_SERVICE_ROLE_KEY=<optional-server-side-service-role-key>
```

Do not use the local Docker defaults in Vercel:

```text
http://localhost:54321
postgresql://postgres:postgres@localhost:54322/postgres
local-dev-anon-key
```

`NEXT_PUBLIC_AUTH_BYPASS=true` should only be used temporarily for local development when you intentionally want to skip login.
