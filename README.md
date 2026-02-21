# Immonext# ImmoNext - Real Estate Management Platform



Real estate property management and valuation platform built with Next.js, Quarkus, and Supabase.A modern real estate management application built with React, Next.js, TypeScript, and Tailwind CSS.



## 🏗️ Architecture## Features



This is a monorepo containing:- 👥 **Customer Management** - View customer information with contact details

- 🏘️ **Property Listings** - Browse property listings with detailed information

- **`apps/web`**: Next.js 16 frontend with App Router- 📊 **Dashboard** - Quick stats showing customers, properties, and total value

- **`apps/api`**: Quarkus 3 backend with PostgreSQL- 📁 **JSON Data Storage** - Simple JSON files for data (backend-ready)

- **`supabase/`**: Database migrations and configuration

- **`packages/types`**: Shared TypeScript types## Getting Started



## 🚀 Quick StartRun the development server:



### Prerequisites```bash

npm run dev

- Node.js 20+```

- Java 21+

- Maven 3.9+Open [http://localhost:3000](http://localhost:3000) to view the application.

- Docker & Docker Compose

- Supabase CLI (optional)## Project Structure



### Development Setup```

immonext/

1. **Clone the repository**├── src/

   ```bash│   ├── app/

   git clone https://github.com/NesieNessy/immonext.git│   │   ├── page.tsx          # Main page

   cd immonext│   │   ├── layout.tsx        # Root layout

   ```│   │   └── globals.css       # Global styles

│   ├── components/

2. **Set up environment variables**│   │   ├── CustomerCard.tsx  # Customer card component

   ```bash│   │   └── PropertyCard.tsx  # Property card component

   cp .env.example .env│   ├── data/

   # Edit .env with your configuration│   │   ├── customers.json    # Customer data

   ```│   │   └── properties.json   # Property data

│   └── types/

3. **Start Supabase (Database)**│       └── index.ts          # TypeScript types

   ```bash├── public/                   # Static assets

   docker-compose up supabase-db supabase-kong -d└── package.json

   ``````



4. **Start Quarkus API**## Data Management

   ```bash

   cd apps/apiEdit the JSON files to add or modify data:

   ./mvnw quarkus:dev- `src/data/customers.json` - Customer information

   ```- `src/data/properties.json` - Property listings

   API will be available at `http://localhost:8080`

### Customer Data Structure

5. **Start Next.js Frontend**- ID, Name, Email, Phone, Address

   ```bash

   cd apps/web### Property Data Structure

   npm install- ID, Title, Type, Price, Address, Bedrooms, Bathrooms, Area, Description

   npm run dev

   ```## Technologies

   App will be available at `http://localhost:3000`

- **Next.js 16** - React framework with App Router

### Using Docker Compose- **React 19** - UI library

- **TypeScript** - Type safety

Start all services at once:- **Tailwind CSS** - Styling

```bash

docker-compose up --build## Scripts

```

- `npm run dev` - Start development server

Services:- `npm run build` - Build for production

- **Frontend**: http://localhost:3000- `npm run start` - Start production server

- **API**: http://localhost:8080- `npm run lint` - Run ESLint

- **Swagger UI**: http://localhost:8080/swagger-ui

- **Supabase**: http://localhost:54321## License

- **Supabase Studio**: http://localhost:54324

MIT

## 📁 Project Structure


```
immonext/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Quarkus backend
├── supabase/         # Database & migrations
├── packages/
│   └── types/        # Shared TypeScript types
├── docs/             # Documentation
├── .github/          # CI/CD workflows
└── docker-compose.yml
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.1.6** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Supabase JS** - Database client

### Backend
- **Quarkus 3.16.3** - Java framework
- **Hibernate ORM Panache** - Database ORM
- **SmallRye JWT** - Authentication
- **PostgreSQL 15** - Database
- **OpenAPI/Swagger** - API documentation

### Infrastructure
- **Supabase** - BaaS platform (Auth, Database, Realtime)
- **Docker** - Containerization
- **GitHub Actions** - CI/CD

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Swagger UI](http://localhost:8080/swagger-ui) (when running)

## 🧪 Testing

### Frontend Tests
```bash
cd apps/web
npm test
```

### Backend Tests
```bash
cd apps/api
./mvnw test
```

## 🏗️ Build for Production

### Build All Services
```bash
docker-compose -f docker-compose.yml up --build
```

### Build Frontend Only
```bash
cd apps/web
npm run build
```

### Backend Only
```bash
cd apps/api
./mvnw clean package
```

### Build Native Image (GraalVM)
```bash
cd apps/api
./mvnw clean package -Pnative
```

## 📦 Deployment

### Using Docker

1. Build images:
   ```bash
   docker-compose build
   ```

2. Push to registry:
   ```bash
   docker tag immonext-web:latest your-registry/immonext-web:latest
   docker tag immonext-api:latest your-registry/immonext-api:latest
   docker push your-registry/immonext-web:latest
   docker push your-registry/immonext-api:latest
   ```

3. Deploy to your platform (AWS, GCP, Azure, etc.)

## 🔐 Environment Variables

### Web App (apps/web/.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### API (apps/api/.env)
```env
QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://localhost:54322/postgres
QUARKUS_DATASOURCE_USERNAME=postgres
QUARKUS_DATASOURCE_PASSWORD=postgres
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👥 Team

- Development Team: NesieNessy

## 📞 Support

For issues and questions, please open an issue on GitHub.
