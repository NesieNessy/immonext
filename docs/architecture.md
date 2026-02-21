# Immonext Architecture

## Overview
Immonext is a monorepo application for real estate property management and valuation, built with modern technologies and best practices.

## Technology Stack

### Frontend (`apps/web`)
- **Framework**: Next.js 16.1.6 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS with custom design system
- **Components**: Custom component library (`immonext-design`)
- **State Management**: React Hooks
- **Icons**: Lucide React
- **Database Client**: Supabase JS SDK

### Backend (`apps/api`)
- **Framework**: Quarkus 3.16.3
- **Language**: Java 21
- **ORM**: Hibernate ORM with Panache
- **API**: JAX-RS (REST)
- **Security**: SmallRye JWT
- **Documentation**: OpenAPI/Swagger
- **Monitoring**: Micrometer + Prometheus

### Database
- **Primary DB**: PostgreSQL 15 (via Supabase)
- **Features**: Row-Level Security (RLS), Realtime subscriptions
- **Migrations**: SQL-based migrations in `supabase/migrations/`

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend Layer                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Next.js (apps/web)                     │   │
│  │  - Server Components                            │   │
│  │  - Client Components                            │   │
│  │  - API Routes                                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           ├──────────┬──────────┐
                           │          │          │
                     ┌─────▼────┐ ┌──▼───┐ ┌───▼────┐
                     │ Supabase │ │ Kong │ │Quarkus │
                     │  Client  │ │ API  │ │  API   │
                     └─────┬────┘ └──┬───┘ └───┬────┘
                           │         │          │
                           │         │          │
                    ┌──────▼─────────▼──────────▼─────┐
                    │      Supabase PostgreSQL        │
                    │  - auth.users                   │
                    │  - public.profiles              │
                    │  - public.properties            │
                    │  - public.property_valuations   │
                    └─────────────────────────────────┘
```

## Project Structure

```
immonext/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   ├── components/
│   │   │   │   ├── immonext-design/  # Design system
│   │   │   │   └── ui/               # Shadcn components
│   │   │   ├── lib/
│   │   │   │   ├── supabase/  # Supabase clients
│   │   │   │   └── api/       # API client helpers
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   └── styles/
│   │   └── public/
│   │
│   └── api/              # Quarkus backend
│       ├── src/main/java/com/immonext/
│       │   ├── config/       # Configuration
│       │   ├── resource/     # REST endpoints
│       │   ├── service/      # Business logic
│       │   ├── repository/   # Data access
│       │   ├── model/
│       │   │   ├── entity/   # JPA entities
│       │   │   └── dto/      # DTOs
│       │   ├── exception/    # Exception handlers
│       │   └── security/     # Security config
│       └── src/main/resources/
│
├── supabase/
│   ├── migrations/       # Database migrations
│   ├── functions/        # Edge functions
│   ├── seed.sql          # Seed data
│   └── config.toml       # Supabase config
│
├── packages/
│   └── types/            # Shared TypeScript types
│
├── docs/
│   ├── architecture.md
│   └── api.md
│
├── docker-compose.yml
└── .github/workflows/
```

## Data Flow

### Authentication
1. User authenticates via Supabase Auth
2. Supabase issues JWT token
3. Frontend stores token in cookies
4. Token sent with API requests to Quarkus
5. Quarkus validates JWT against Supabase public key

### Property Valuation Flow
1. User initiates valuation (Quick Check or Detail Check)
2. Frontend validates input with design system components
3. Data sent to Quarkus API
4. Quarkus validates, processes, and stores in PostgreSQL
5. Results returned to frontend
6. Frontend updates UI with real-time subscriptions (Supabase Realtime)

## Security

### Frontend
- Environment variables for API URLs and keys
- HTTPS in production
- CORS properly configured

### Backend (Quarkus)
- JWT authentication
- Role-based access control
- Input validation (Hibernate Validator)
- CORS configuration
- SQL injection prevention (Panache)

### Database (Supabase)
- Row-Level Security (RLS) policies
- User-specific data access
- Encrypted connections
- Automated backups

## Deployment

### Development
```bash
# Start Supabase
docker-compose up supabase-db supabase-kong

# Start Quarkus API
cd apps/api
./mvnw quarkus:dev

# Start Next.js
cd apps/web
npm run dev
```

### Production
```bash
# Build and run all services
docker-compose up --build
```

## Environment Variables

### Web App
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_API_URL`: Quarkus API URL

### Quarkus API
- `QUARKUS_DATASOURCE_JDBC_URL`: PostgreSQL connection string
- `QUARKUS_DATASOURCE_USERNAME`: DB username
- `QUARKUS_DATASOURCE_PASSWORD`: DB password
- `QUARKUS_HTTP_CORS_ORIGINS`: Allowed CORS origins

## Monitoring & Observability

- **Health Checks**: `/q/health` (Quarkus)
- **Metrics**: `/q/metrics` (Prometheus format)
- **API Documentation**: `/swagger-ui` (Quarkus)
- **Logs**: Structured logging with correlation IDs
