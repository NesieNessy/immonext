# Getting Started with Immonext

This guide will help you set up the development environment for Immonext.

## Prerequisites Installation

### 1. Install Node.js 20+
- Download from: https://nodejs.org/
- Verify installation: `node --version`

### 2. Install Java 21+
- Download from: https://adoptium.net/
- Verify installation: `java --version`

### 3. Install Maven 3.9+
- Download from: https://maven.apache.org/download.cgi
- Add to PATH
- Verify installation: `mvn --version`

### 4. Install Docker Desktop
- Download from: https://www.docker.com/products/docker-desktop
- Start Docker Desktop
- Verify installation: `docker --version`

## Initial Setup

### 1. Clone and Setup Environment

```bash
# Clone repository
git clone https://github.com/NesieNessy/immonext.git
cd immonext

# Copy environment template
cp .env.example .env

# Edit .env file with your settings
# (For local development, default values should work)
```

### 2. Install Dependencies

#### Frontend (apps/web)
```bash
cd apps/web
npm install
cd ../..
```

#### Shared Types (packages/types)
```bash
cd packages/types
npm install
cd ../..
```

### 3. Start Services

#### Option A: Start All Services with Docker Compose (Recommended)

```bash
docker-compose up --build
```

This will start:
- Supabase PostgreSQL database
- Supabase Kong API Gateway
- Quarkus API server
- Next.js web application

#### Option B: Start Services Individually

**Terminal 1 - Database:**
```bash
docker-compose up supabase-db supabase-kong
```

**Terminal 2 - Quarkus API:**
```bash
cd apps/api
./mvnw quarkus:dev
```

**Terminal 3 - Next.js Frontend:**
```bash
cd apps/web
npm run dev
```

## Accessing the Application

Once all services are running:

- **Web App**: http://localhost:3000
- **API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui
- **API Health**: http://localhost:8080/q/health
- **Supabase Studio**: http://localhost:54324
- **Supabase API**: http://localhost:54321

## Running Database Migrations

### Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start Supabase locally
supabase start

# Apply migrations
supabase db push
```

### Manual Migration

The migrations will automatically run when the database starts via docker-compose.

## Development Workflow

### 1. Making Changes to Frontend

```bash
cd apps/web
# Make your changes
npm run dev  # Hot reload is enabled
```

### 2. Making Changes to Backend

```bash
cd apps/api
# Make your changes
./mvnw quarkus:dev  # Hot reload is enabled
```

### 3. Adding Database Migrations

Create a new migration file:
```bash
# supabase/migrations/YYYYMMDD_description.sql
```

Example:
```sql
-- supabase/migrations/20240215_add_user_preferences.sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Running Tests

**Frontend Tests:**
```bash
cd apps/web
npm test
```

**Backend Tests:**
```bash
cd apps/api
./mvnw test
```

## Common Issues and Solutions

### Issue: Port Already in Use

**Solution:** Stop the service using the port or change the port in configuration.

```bash
# Check what's using port 8080
netstat -ano | findstr :8080  # Windows
lsof -i :8080  # Mac/Linux

# Kill the process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>  # Mac/Linux
```

### Issue: Database Connection Failed

**Solution:** Ensure Supabase is running:
```bash
docker-compose up supabase-db -d
```

### Issue: Maven Build Fails

**Solution:** Clear Maven cache and rebuild:
```bash
cd apps/api
./mvnw clean install -U
```

### Issue: Next.js Build Fails

**Solution:** Clear cache and reinstall:
```bash
cd apps/web
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## IDE Setup

### VS Code (Recommended for Frontend)

Install extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript React code snippets

### IntelliJ IDEA (Recommended for Backend)

1. Open `apps/api` as a Maven project
2. Enable annotation processing
3. Install Quarkus Tools plugin

## Next Steps

1. Read the [Architecture Documentation](architecture.md)
2. Review the [API Documentation](api.md)
3. Explore the codebase
4. Start building features!

## Getting Help

- Check existing issues on GitHub
- Review documentation in `/docs`
- Ask questions in team chat
- Consult Quarkus docs: https://quarkus.io/guides/
- Consult Next.js docs: https://nextjs.org/docs
