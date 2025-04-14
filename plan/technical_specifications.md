# Quote Request Generator - Technical Specifications

## Architecture Overview

The Quote Request Generator follows a modern web application architecture with clear separation of concerns:

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│   Next.js 15.3.0  │     │   FastAPI Backend │     │   LanceDB Vector  │
│   React Frontend  │◄────┤   Document Gen    │◄────┤   Database        │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
         │                         │                         │
         │                         │                         │
         ▼                         ▼                         ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│   Static Assets   │     │   Document        │     │   Vector Search   │
│   UI Components   │     │   Generation      │     │   & Embeddings    │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
```

### Key Components

1. **Frontend Layer**:
   - Next.js 15.3.0 with App Router
   - React with React Query for state management
   - ShadcN UI component library
   - React Hook Form for form state management

2. **Backend Layer**:
   - FastAPI Python framework
   - Document generation service
   - Authentication and authorization services
   - API endpoints for CRUD operations

3. **Data Layer**:
   - LanceDB for vector database capabilities
   - Document storage system
   - Template management

4. **Infrastructure**:
   - Docker containerization
   - Traefik reverse proxy
   - Hetzner server deployment

## Frontend Architecture

### Component Structure

The frontend follows a hierarchical component structure:

```
├── App
│   ├── Layout
│   │   ├── Navbar
│   │   └── Sidebar
│   ├── Pages
│   │   ├── Dashboard
│   │   ├── Clients
│   │   │   ├── ClientList
│   │   │   └── ClientDetail
│   │   ├── Quotes
│   │   │   ├── QuoteList
│   │   │   └── QuoteDetail
│   │   └── Documents
│   │       ├── DocumentList
│   │       └── DocumentDetail
│   └── Forms
│       ├── ClientForm
│       ├── AutoInsuranceForm
│       ├── HomeInsuranceForm
│       └── SpecialtyInsuranceForm
└── Shared
    ├── UI Components
    ├── Hooks
    ├── Utils
    └── Services
        ├── API Configuration
        ├── Document Service
        └── Data Transformers
```

### API Services

The application implements a layered API service architecture:

1. **API Configuration (`frontend-next/lib/api-config.ts`)**
   - Centralized management of API endpoints
   - Environment-aware base URL configuration
   - Type-safe endpoint functions organized by resource
   - Support for path parameters and query string generation

2. **Service Modules**
   - `document-service.ts`: Document generation and management
   - Future services planned for quotes, clients, and authentication
   - Each service includes TypeScript interfaces and error handling

3. **React Query Hooks**
   - Custom hooks that wrap API services with React Query
   - Automatic caching, refetching, and invalidation
   - Loading, error, and success states
   - Mutation functions with optimistic updates

4. **Data Flow Pattern**
   ```
   ┌─────────────┐     ┌────────────┐     ┌─────────────┐     ┌─────────────┐
   │ React       │     │ React      │     │ API         │     │ Backend     │
   │ Components  │────►│ Query Hooks│────►│ Services    │────►│ Endpoints   │
   └─────────────┘     └────────────┘     └─────────────┘     └─────────────┘
          ▲                  │                                        │
          └──────────────────┴────────────────────────────────────────┘
                      Data flows back to components
   ```

### State Management

The application uses a combination of state management approaches:

1. **Local Component State**:
   - React's `useState` for component-specific state
   - React's `useReducer` for complex component state

2. **Form State**:
   - React Hook Form for form state management
   - Zod for schema validation
   - Custom persistence layer for form state

3. **Server State**:
   - React Query for server state management
   - Optimistic updates for better UX
   - Automatic refetching and cache invalidation

4. **Global Application State**:
   - Context API for authentication state
   - Context API for application preferences
   - Storage utils for persistent settings

### Data Flow

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│  User Input   │────►│  React State  │────►│  React Query  │
│               │     │               │     │               │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                   │
                                                   ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│  UI Update    │◄────│  State Update │◄────│  API Request  │
│               │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
```

## Backend Architecture

### API Layer

The API design follows RESTful principles with these primary endpoints:

1. **Authentication Endpoints**:
   - `POST /api/auth/login`: User login
   - `POST /api/auth/refresh`: Refresh authentication token
   - `POST /api/auth/logout`: User logout

2. **Client Endpoints**:
   - `GET /api/clients`: List clients
   - `POST /api/clients`: Create client
   - `GET /api/clients/{id}`: Get client details
   - `PUT /api/clients/{id}`: Update client
   - `DELETE /api/clients/{id}`: Delete client
   - `GET /api/clients/search`: Search clients

3. **Quote Endpoints**:
   - `GET /api/quotes`: List quotes
   - `POST /api/quotes`: Create quote
   - `GET /api/quotes/{id}`: Get quote details
   - `PUT /api/quotes/{id}`: Update quote
   - `DELETE /api/quotes/{id}`: Delete quote
   - `GET /api/quotes/client/{client_id}`: Get quotes for client

4. **Document Endpoints**:
   - `POST /api/documents/{quote_id}/generate/{file_type}`: Generate document
   - `GET /api/documents/quote/{quote_id}`: List documents for quote
   - `GET /api/documents/download/{document_id}`: Download document
   - `DELETE /api/documents/{document_id}`: Delete document

### Service Layer

The backend implements these primary services:

1. **Authentication Service**:
   - JWT token generation and validation
   - Password hashing and verification
   - Role-based authorization

2. **Document Generator Service**:
   - Template selection and loading
   - Data mapping for placeholders
   - DOCX generation with python-docx
   - PDF conversion with LibreOffice and fallbacks

3. **Data Access Layer**:
   - LanceDB integration
   - CRUD operations for all entities
   - Search functionality
   - Vector embedding generation

### Error Handling

The backend implements a consistent error handling approach:

1. **Standard Error Responses**:
   - All errors return JSON with `detail` field
   - HTTP status codes match error types
   - Validation errors return field-specific messages

2. **Logging**:
   - Structured logging with timestamps and correlation IDs
   - Different log levels based on severity
   - Error stacktraces captured for unexpected errors

## Database Architecture

### LanceDB Overview

LanceDB is used as the primary database, enabling vector search and future AI integration:

1. **Key Features**:
   - Vector search capabilities
   - PyArrow schema support
   - Efficient storage for structured data
   - Future AI integration potential

2. **Collections Structure**:
   - Each collection represents a domain entity
   - Vector embeddings for semantic search
   - PyArrow schemas define data structure

### Data Schemas

The database schema employs PyArrow types for structured data:

```python
import pyarrow as pa

# Client schema definition
client_schema = pa.schema([
    pa.field("id", pa.string()),
    pa.field("primary_insured", pa.struct([
        pa.field("name", pa.string()),
        pa.field("phone", pa.string()),
        pa.field("email", pa.string()),
        # Additional fields...
    ])),
    pa.field("additional_insureds", pa.list_(pa.struct([
        pa.field("name", pa.string()),
        pa.field("relation", pa.string()),
        # Additional fields...
    ]))),
    pa.field("created_at", pa.timestamp('s')),
    pa.field("updated_at", pa.timestamp('s')),
    pa.field("vector", pa.list_(pa.float32())),
])

# Quote schema definition
quote_schema = pa.schema([
    pa.field("id", pa.string()),
    pa.field("client_id", pa.string()),
    pa.field("effective_date", pa.timestamp('s')),
    # Additional fields...
    pa.field("vector", pa.list_(pa.float32())),
])

# Document schema definition
document_schema = pa.schema([
    pa.field("id", pa.string()),
    pa.field("quote_id", pa.string()),
    pa.field("name", pa.string()),
    pa.field("file_type", pa.string()),
    pa.field("file_path", pa.string()),
    # Additional fields...
    pa.field("vector", pa.list_(pa.float32())),
])
```

### Vector Search

The vector search capabilities include:

1. **Embedding Generation**:
   - Text-based embeddings for semantic search
   - Document content embeddings
   - Client information embeddings

2. **Search Operations**:
   - Nearest neighbor search for similar documents
   - Semantic search for clients
   - Recommendations based on similarities

## Document Generation Process

### Template System

The document generation employs a template-based approach:

1. **Template Files**:
   - DOCX templates with placeholders
   - Placeholders in format `{{placeholder_name}}`
   - Support for nested placeholders
   - Template versioning

2. **Template Selection**:
   - Auto selection based on quote type
   - Multiple template combination for complex documents
   - Fallback templates for missing data

### Data Mapping

The placeholder replacement follows this process:

1. **Data Dictionary Creation**:
   - Extract client and quote data
   - Format data for placeholders
   - Apply business rules for derived values
   - Handle missing data with defaults

2. **Placeholder Replacement**:
   - Scan document for placeholders
   - Replace placeholders with formatted values
   - Maintain formatting of placeholders
   - Process nested documents if needed

### Format Conversion

The PDF conversion strategy follows a fallback approach:

1. **Primary Method**: LibreOffice conversion
   - Use headless LibreOffice for conversion
   - High-quality output with formatting preserved
   - Handle complex document structures

2. **Fallback Method**: unoconv
   - Alternative conversion tool
   - Less resource-intensive
   - Activated when LibreOffice fails

3. **Emergency Fallback**: Direct file copy
   - Return DOCX when conversion fails
   - Provide clear error message
   - Record conversion issues for analysis

## Deployment Strategy

### Docker Configuration

The application is containerized for consistent deployment:

```yaml
# docker-compose.yml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./traefik:/etc/traefik"

  frontend:
    build: ./frontend-next
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_BASE_URL=http://backend:8000
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`65.21.174.252`)"
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"

  backend:
    build: ./backend
    environment:
      - LANCEDB_URI=lancedb://lancedb:9520
    volumes:
      - "./documents:/app/documents"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`65.21.174.252`) && PathPrefix(`/api`)"
      - "traefik.http.services.backend.loadbalancer.server.port=8000"

  lancedb:
    image: lancedb/lancedb:latest
    volumes:
      - "./data:/data"
    environment:
      - LANCEDB_PORT=9520
```

### Infrastructure Setup

The deployment infrastructure includes:

1. **Server Configuration**:
   - Hetzner AX52 server (65.21.174.252)
   - Linux environment
   - Firewall configuration for required ports
   - Docker and docker-compose installed

2. **Networking**:
   - Traefik for routing and load balancing
   - Internal Docker network for service communication
   - External network for client access
   - CORS configuration for API access

3. **Data Storage**:
   - Persistent volumes for database data
   - Document storage volume
   - Template storage volume
   - Log storage volume

### Multi-Environment Support

The application supports multiple deployment environments:

1. **Development Environment**:
   - Local development with NextJS dev server
   - Docker-compose for backend services
   - Hot reloading and debugging tools
   - Environment-specific configuration

2. **Staging Environment**:
   - Hetzner server with subdomain
   - Full Docker deployment
   - Test data and configurations
   - Mimic production environment

3. **Production Environment**:
   - Hetzner server with domain name
   - Production-grade Docker deployment
   - Optimized configurations
   - Monitoring and alerting

### Platform Migration Path

The application is designed for future platform migration:

1. **Cloudflare/Vercel Compatibility**:
   - Next.js application designed to avoid middleware
   - Static generation used where possible
   - API routes compatible with both platforms
   - Image optimization configured for cross-platform support

2. **Hybrid Approach**:
   - Frontend deployed to Cloudflare/Vercel
   - Backend services remain on Hetzner
   - API communication between platforms
   - Consistent environment variables

## Reverse Proxy and Security Infrastructure

### Traefik Configuration

The application uses Traefik as a reverse proxy with the following key features:

1. **Routing Configuration**
   - HTTP to HTTPS redirection (port 80 to 443)
   - Path-based routing (`/api` routes to backend, all others to frontend)
   - Priority-based rule matching
   - Health check integration for services

2. **SSL/TLS Configuration**
   - Automatic SSL certificate provisioning via Let's Encrypt
   - TLS 1.2+ with strong cipher suites
   - ACME challenge handling (TLS challenge)
   - Certificate renewal management

3. **Security Middleware**
   - HTTP security headers (HSTS, XSS protection, content type sniffing prevention)
   - Rate limiting for API endpoints
   - Compression for frontend assets
   - Basic authentication for dashboard access

4. **Service Discovery**
   - Docker provider integration
   - Automatic detection of containers
   - Dynamic updates on container changes
   - Label-based configuration

### Network Segmentation

The application implements network segmentation through Docker networks:

1. **External-Facing Network**
   - `traefik-network` connects Traefik with frontend and backend
   - Exposes only necessary services to the internet
   - Controlled access through Traefik

2. **Internal Network**
   - `backend-network` connects backend to database
   - Isolates database from direct external access
   - Restricts communication to authorized services

### Security Measures

The implementation includes several security measures:

1. **Containerization**
   - Services run in isolated Docker containers
   - `no-new-privileges` security option for Traefik
   - Volume access restrictions
   - Environment variable separation

2. **Firewall Configuration**
   - UFW configuration restricts access to ports 22, 80, 443
   - All other ports closed by default
   - SSH key-based authentication

3. **Infrastructure as Code**
   - All configuration managed in version control
   - Deployment scripts for consistent setup
   - Environment-specific configurations via .env files
   - Secret management via environment variables

## UI Design System

### Component Framework

The UI is built with ShadcN UI, offering:

1. **Core Components**:
   - Buttons, inputs, selects, checkboxes
   - Cards, modals, dialogs
   - Tables, data displays
   - Navigation components

2. **Form Components**:
   - Form layouts and containers
   - Input validation and error display
   - Multi-step form navigation
   - Form state persistence

3. **Specialized Components**:
   - Document generation panel
   - Document list and preview
   - Search components
   - Dashboard widgets

### Design Tokens

The design system uses consistent tokens for:

1. **Colors**:
   - Primary: #0f766e (teal-700)
   - Secondary: #0f172a (slate-900)
   - Accent: #0ea5e9 (sky-500)
   - Success: #16a34a (green-600)
   - Error: #dc2626 (red-600)
   - Warning: #f59e0b (amber-500)
   - Background shades, text colors, etc.

2. **Typography**:
   - Font family: Inter (sans-serif)
   - Heading sizes: h1 (2rem), h2 (1.5rem), h3 (1.25rem), h4 (1.125rem)
   - Body text: 1rem (16px)
   - Line heights: 1.5 for body, 1.2 for headings
   - Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

3. **Spacing**:
   - Base unit: 0.25rem (4px)
   - Scale: 0.25rem, 0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem, 2rem, 2.5rem, etc.
   - Consistent spacing for margins, padding, gaps

4. **Shadows**:
   - Elevation levels for different components
   - Consistent shadow values for depth perception
   - Interactive state shadows

### Responsive Design

The UI implements responsive design through:

1. **Breakpoints**:
   - Mobile: <640px
   - Tablet: 640px-1023px
   - Desktop: ≥1024px
   - Large desktop: ≥1280px

2. **Layout Approach**:
   - Mobile-first design
   - Flexible layouts with CSS Grid and Flexbox
   - Responsive typography
   - Component adaptations for different screen sizes

3. **Navigation Patterns**:
   - Collapsible sidebar on mobile
   - Bottom navigation on small screens
   - Breadcrumb navigation for context
   - Responsive form layouts

### Accessibility Standards

The UI follows WCAG 2.1 AA standards:

1. **Semantic HTML**:
   - Proper heading structure
   - ARIA roles and labels
   - Keyboard navigation support
   - Focus management

2. **Color Contrast**:
   - Minimum 4.5:1 contrast for normal text
   - Minimum 3:1 contrast for large text
   - Non-reliance on color for information

3. **Form Accessibility**:
   - Clear labels and instructions
   - Error messages linked to fields
   - Keyboard accessible form controls
   - Focus indication on form elements

## Form Implementation

### Form State Management

Forms use React Hook Form with a persistent layer:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { autoInsuranceSchema } from '@/schemas/autoInsurance';

export function AutoInsuranceForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm({
    resolver: zodResolver(autoInsuranceSchema),
    defaultValues: {
      currentCarrier: '',
      // Additional fields...
    },
  });
  
  useFormPersistence('auto-insurance-form', watch, 3000);
  
  // Form implementation...
}
```

### Data Transformation

Data transformers convert between UI and API formats:

```tsx
// Form data to API format
export function transformFormToApiFormat(formData) {
  return {
    autoInsurance: {
      currentCarrier: formData.currentCarrier,
      // Transform additional fields...
    },
    // Transform other sections...
  };
}

// API data to form format
export function transformApiToFormFormat(apiData) {
  return {
    currentCarrier: apiData.autoInsurance?.currentCarrier || '',
    // Transform additional fields...
  };
}
```

### Validation Approach

Form validation uses Zod schemas with detailed rules:

```tsx
import { z } from 'zod';

export const vehicleSchema = z.object({
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/, "Invalid VIN format"),
  // Additional validation...
});

export const autoInsuranceSchema = z.object({
  currentCarrier: z.string().min(1, "Current carrier is required"),
  monthsWithCarrier: z.number().min(0).max(1200),
  // Additional validation...
  vehicles: z.array(vehicleSchema).min(1, "At least one vehicle is required"),
});
```

## Authentication and Authorization

### Authentication Flow

The application uses JWT-based authentication:

1. **Login Process**:
   - User submits credentials
   - Backend validates and returns JWT tokens
   - Access token stored in memory
   - Refresh token stored in HTTP-only cookie

2. **Token Refresh**:
   - Automatic refresh before token expiration
   - Silent refresh with refresh token
   - Session management and expiration

3. **Logout Process**:
   - Clear access token from memory
   - Invalidate refresh token
   - Redirect to login page

### Authorization Model

The authorization system uses role-based access control:

1. **User Roles**:
   - Admin: Full access to all features
   - User: Limited access based on permissions
   - Guest: Read-only access to specific resources

2. **Permission Model**:
   - Resource-based permissions
   - Operation-based permissions (create, read, update, delete)
   - Hierarchical permission inheritance

3. **Implementation**:
   - Backend validation of permissions
   - Frontend UI adaptation based on permissions
   - API endpoint protection
   - Data filtering based on permissions

## Error Handling and Logging

### Frontend Error Handling

The frontend implements a multi-layered error handling approach:

1. **React Error Boundaries**:
   - Component-level error catching
   - Fallback UI for component failures
   - Error reporting to monitoring service

2. **API Error Handling**:
   - Request error catching with React Query
   - Retry logic for transient failures
   - User-friendly error messages
   - Detailed error logging

3. **Form Error Handling**:
   - Field-level validation errors
   - Form-level validation errors
   - Server validation error display
   - Error focus management

### Backend Error Handling

The backend implements structured error handling:

1. **Exception Handling**:
   - Global exception handler
   - Type-specific exception handlers
   - Exception to HTTP status code mapping
   - Detailed error responses

2. **Validation Errors**:
   - Schema validation with Pydantic
   - Field-specific error messages
   - Business rule validation
   - Consistent error format

### Logging System

The application implements comprehensive logging:

1. **Frontend Logging**:
   - Console logging in development
   - Error reporting to backend in production
   - User action logging for analytics
   - Performance metrics logging

2. **Backend Logging**:
   - Structured JSON logging
   - Log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
   - Request/response logging
   - Error stacktrace capture

3. **Log Storage**:
   - File-based logging with rotation
   - Future integration with log aggregation service
   - Log retention policies
   - Log search capabilities 