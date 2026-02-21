# Immonext API Documentation

## Base URLs

- **Development**: `http://localhost:8080`
- **Production**: `https://api.immonext.com`

## Authentication

All API endpoints (except public ones) require authentication using JWT Bearer tokens obtained from Supabase.

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Properties

#### GET /api/properties
Get all properties.

**Response**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "address": "Musterstraße 1, 10115 Berlin",
    "propertyType": "Condominium",
    "tenancyType": "Standard",
    "purchasePrice": 350000.00,
    "livingSpace": 75.5,
    "yearBuilt": 2015,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
]
```

#### GET /api/properties/{id}
Get a specific property by ID.

**Parameters**
- `id` (path): UUID of the property

**Response**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "address": "Musterstraße 1, 10115 Berlin",
  "propertyType": "Condominium",
  "tenancyType": "Standard",
  "purchasePrice": 350000.00,
  "livingSpace": 75.5,
  "yearBuilt": 2015,
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

#### POST /api/properties
Create a new property.

**Request Body**
```json
{
  "address": "Musterstraße 1, 10115 Berlin",
  "propertyType": "Condominium",
  "tenancyType": "Standard",
  "purchasePrice": 350000.00,
  "livingSpace": 75.5,
  "yearBuilt": 2015
}
```

**Response** (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "address": "Musterstraße 1, 10115 Berlin",
  "propertyType": "Condominium",
  "tenancyType": "Standard",
  "purchasePrice": 350000.00,
  "livingSpace": 75.5,
  "yearBuilt": 2015,
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

#### PUT /api/properties/{id}
Update an existing property.

**Parameters**
- `id` (path): UUID of the property

**Request Body**
```json
{
  "address": "Updated Address",
  "propertyType": "Condominium",
  "tenancyType": "IndexLinkedRent",
  "purchasePrice": 380000.00,
  "livingSpace": 75.5,
  "yearBuilt": 2015
}
```

**Response** (200 OK)

#### DELETE /api/properties/{id}
Delete a property.

**Parameters**
- `id` (path): UUID of the property

**Response** (204 No Content)

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "address",
      "message": "Address is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Property not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

API requests are limited to:
- 100 requests per minute per user
- 1000 requests per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Swagger UI

Interactive API documentation is available at:
- Development: `http://localhost:8080/swagger-ui`
- Production: `https://api.immonext.com/swagger-ui`

## Health Check

Check API health status:
```
GET /q/health
```

Response:
```json
{
  "status": "UP",
  "checks": [
    {
      "name": "Database connection health check",
      "status": "UP"
    }
  ]
}
```

## Versioning

The API uses URL versioning. Current version: `v1`

Future versions will be available at `/api/v2/...`

## SDKs

### TypeScript/JavaScript
Use the API client helper:

```typescript
import { api } from '@/lib/api/client';

// Get all properties
const properties = await api.get<Property[]>('/api/properties');

// Create a property
const newProperty = await api.post<Property>('/api/properties', {
  address: 'Test Street 1',
  propertyType: 'Condominium',
  // ...
});
```

## WebSocket (Coming Soon)

Real-time updates via WebSocket connections for:
- Property updates
- Valuation status changes
- User notifications
