# Immonext Architecture

## Overview
Immonext is a monorepo application for real estate property management and valuation, built with Next.js and Supabase.

## Technology Stack

### Frontend (`apps/web`)
- **Framework**: Next.js (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 with a custom design system
- **Components**: Shared component library (`apps/web/src/components/ui`)
- **State Management**: React Hooks
- **Icons**: Lucide React
- **Database Client**: Supabase JS SDK (`@supabase/supabase-js`, `@supabase/ssr`)

### Database & Backend Services
- **Primary DB**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **Features**: Row-Level Security (RLS) policies, RPC functions for multi-step writes
- **Migrations**: SQL-based migrations in `supabase/migrations/`
- **Local dev API routes**: A small set of Next.js API routes under `apps/web/src/app/api/` back a local `NEXT_PUBLIC_AUTH_BYPASS` dev mode that talks to a local Postgres instead of hosted Supabase

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend Layer                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Next.js (apps/web)                     │   │
│  │  - Server Components                            │   │
│  │  - Client Components                            │   │
│  │  - API Routes (local auth-bypass dev mode only) │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                     ┌─────▼────┐
                     │ Supabase │
                     │  Client  │
                     └─────┬────┘
                           │
                    ┌──────▼───────────────┐
                    │  Supabase PostgreSQL │
                    │  - auth.users        │
                    │  - public.quick_check│
                    │  - public.property   │
                    │  - detail_check_*    │
                    └───────────────────────┘
```

## Project Structure

```
immonext/
├── apps/
│   └── web/               # Next.js frontend
│       ├── src/
│       │   ├── app/       # App Router pages + API routes (auth-bypass dev mode)
│       │   ├── components/
│       │   │   ├── ui/        # Shared design-system components
│       │   │   └── features/  # Feature-specific components
│       │   ├── lib/
│       │   │   └── supabase/  # Supabase clients
│       │   ├── hooks/
│       │   └── styles/
│       └── public/
│
├── supabase/
│   ├── migrations/       # Database migrations
│   └── config.toml       # Supabase config
│
├── packages/
│   └── types/            # Shared TypeScript types
│
├── docs/
│   ├── architecture.md
│   ├── getting-started.md
│   └── vercel-deployment.md
│
├── docker-compose.yml
└── .github/workflows/
```

## Data Flow

### Authentication
1. User authenticates via Supabase Auth
2. Supabase issues a session/JWT
3. The Next.js app reads the session client-side (and via `@supabase/ssr` where needed) and uses it for all Supabase queries
4. Row-Level Security policies on each table enforce that a user can only read/write their own rows

### Property Valuation Flow
1. User initiates a valuation (Ersteinschätzung / quick check, or a full Detailbewertung / detail check)
2. Frontend validates input with the shared form components
3. Data is written directly to Supabase from the client (or, in local auth-bypass dev mode, via the Next.js API routes to a local Postgres)
4. Results are read back and rendered in the UI

## Security

### Frontend
- Environment variables for Supabase URL/keys
- HTTPS in production
- No secrets embedded client-side beyond the public anon key

### Database (Supabase)
- Row-Level Security (RLS) policies on every table
- User-specific data access enforced at the database layer
- Encrypted connections
- Automated backups

## Deployment

### Development
```bash
cd apps/web
npm run dev
```

### Production
Deployed on Vercel — see [vercel-deployment.md](vercel-deployment.md).

## Environment Variables

### Web App
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_AUTH_BYPASS`: `true` to use the local Postgres + auth-bypass dev mode instead of hosted Supabase
- `DATABASE_URL`: Postgres connection string, used by the auth-bypass API routes
