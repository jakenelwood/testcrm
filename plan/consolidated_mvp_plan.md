# Quote Request Generator - Consolidated Project Plan

## Project Overview

The Quote Request Generator is a web application for generating insurance quote requests in DOCX and PDF formats. It allows users to create, read, update, and delete client records, capture detailed information for auto, home, and specialty insurance quotes, and generate standardized documents based on templates with placeholders.

## Current Status

### Completed Features

#### Backend Implementation
- ✅ Document generator service with DOCX generation
- ✅ Multiple PDF conversion strategies (LibreOffice, unoconv, fallback)
- ✅ Document API endpoints for generation, listing, and download
- ✅ Robust error handling and logging throughout the application
- ✅ Template handling with support for auto, home, and specialty insurance
- ✅ Placeholder replacement system for document generation
- ✅ LanceDB connection setup (partially implemented)

#### Frontend Implementation
- ✅ Next.js 15.3.0 with App Router migration completed
- ✅ Document generation panel UI
- ✅ API configuration and service architecture implemented
- ✅ Clean separation of API concerns with centralized config
- ✅ Type-safe API service layer with document and quote services
- ✅ React Query hooks for data fetching and state management
- ✅ Form state persistence with comprehensive test coverage
- ✅ Auto Insurance Form (all fields implemented)
- ✅ Field mapping to match placeholders.txt format
- ✅ Form validation for all required fields
- ✅ Data transformers between form and API format
- ✅ Document generation workflow UI components

#### Deployment Configuration
- ✅ Docker Compose configuration for backend
- ✅ Dockerfile for Next.js frontend
- ✅ Template setup script
- ✅ Deployment script for Hetzner server (backend components)
- ✅ Environment variable configuration for multi-environment support
- ✅ Vercel deployment configuration for frontend
- ✅ Traefik configuration for routing and SSL with automatic certificate provisioning
- ✅ Production deployment script with Traefik integration

### Implementation Progress

- **Auto Insurance Form**: 100% implemented with proper validation
- **Document Generation**: 90% implemented, PDF conversion needs testing
- **API Service Architecture**: 100% implemented with React Query integration
- **Home Insurance Form**: ~20% implemented (10/56 fields)
- **Specialty Insurance Form**: Initial structure defined
- **Form State Persistence**: 100% implemented with auto-save
- **Sample Data Generator**: 100% implemented for testing
- **LanceDB Integration**: ~30% implemented (configuration and schema design)
- **Traefik Integration**: 100% implemented with SSL certificate management
- **Overall MVP Progress**: ~80% complete

## Next Sprint Tasks

### Priority 1: Complete Production Deployment
1. **Secure Production Deployment to Hetzner Server**
   - SSH into the server: `ssh -i ~/.ssh/id_ed25519 root@65.21.174.252`
   - Clone repository: `git clone https://github.com/jakenelwood/quote-request-fresh.git`
   - Run deployment script: `./deploy-traefik.sh`
   - Verify deployed services: `docker-compose -f docker-compose.prod.yml ps`
   - Verify HTTPS access at https://65.21.174.252
   - Create admin user: `docker exec -it quote-request-backend python create_admin.py`

2. **Frontend Deployment to Vercel**
   - Configure Vercel project settings
   - Set up environment variables in Vercel dashboard
   - Connect GitHub repository to Vercel
   - Deploy frontend to Vercel
   - Configure API endpoints to connect to secure Hetzner backend

3. **Cross-Environment Integration**
   - Update CORS on backend to allow Vercel frontend with HTTPS
   - Test connectivity between Vercel frontend and secure Hetzner backend
   - Implement secure API calling pattern with JWT

4. **Finalize Document Generation System**
   - Test backend document generation service with auto form
   - Verify template placeholders are correctly replaced
   - Confirm PDF conversion works with LibreOffice 
   - Test document download functionality from Vercel frontend
   - Implement basic error handling for document generation
   - Add logging for document generation process

### Priority 2: Complete Auto Insurance Form Integration
   - Connect Auto Insurance Form to document generation API
   - Verify data transformation between form and API
   - Test full end-to-end flow from form to document
   - Add basic form validation feedback
   - Implement form state persistence for auto insurance
   - Ensure responsive design works across devices

### Priority 3: Core User Experience Features
   - Implement basic authentication system
   - Add document history display
   - Create simple client management interface
   - Implement basic search functionality
   - Add progress indicators for multi-step forms
   - Display clear success/error messages

### Priority 4: Testing and Stabilization
1. **Test Functionality in Production Environment**
   - Verify document generation works end-to-end
   - Test CORS configuration
   - Test form submissions with real data
   - Verify document download works
   - Test application on multiple browsers

2. **Create Test Data and Documentation**
   - Create test clients with realistic data
   - Generate sample quote requests
   - Document common workflows
   - Create basic user guide
   - Prepare test scenarios for users

3. **Basic Security Checks**
   - Verify authentication works properly
   - Test user roles and permissions
   - Review API endpoint security
   - Check for common security issues
   - Verify secure document access controls

### Priority 5: Initial User Testing and Feedback Loop
1. **Create User Testing Plan**
   - Identify initial test users
   - Create user testing script with key workflows
   - Prepare feedback collection form
   - Schedule initial testing sessions

2. **Feedback Management Process**
   - Set up feedback tracking system
   - Establish priority criteria for fixes/improvements
   - Create workflow for addressing critical issues
   - Plan regular review sessions

3. **Quick Iteration on Critical Issues**
   - Address high-priority issues identified in testing
   - Fix any blocking bugs
   - Improve unclear workflows
   - Enhance documentation based on feedback

### Future Enhancements (Post-MVP)
1. Implement Home Insurance Form (currently at ~20% completion)
2. Develop Specialty Insurance Form 
3. Enhance search with LanceDB vector capabilities
4. Add reporting features
5. Improve UI based on user feedback
6. Expand Vercel/Cloudflare features

## Database Architecture (LanceDB)

LanceDB is used as the primary database, which enables vector search and future AI integration capabilities.

### Collections Structure

The database organizes data into the following collections:

1. **Users Collection**
   ```typescript
   interface User {
     id: string;                // Unique identifier (UUID)
     email: string;             // User email (unique)
     passwordHash: string;      // Hashed password
     firstName: string;         // First name
     lastName: string;          // Last name
     role: "admin" | "user";    // User role for authorization
     createdAt: Date;           // Account creation timestamp
     updatedAt: Date;           // Last update timestamp
     lastLogin: Date | null;    // Last login timestamp
     isActive: boolean;         // Account status
     preferences: {             // User preferences
       theme: "light" | "dark" | "system";
       defaultDocumentFormat: "docx" | "pdf";
       notifications: boolean;
     };
   }
   ```

2. **Clients Collection**
   ```typescript
   interface Client {
     id: string;                // Unique identifier (UUID)
     primaryInsured: {          // Primary insured information
       name: string;            // Full name
       phone: string;           // Phone number
       email: string;           // Email address
       address: {               // Physical address
         street: string;
         city: string;
         state: string;
         zipCode: string;
       };
       mailingAddress: {        // Optional mailing address if different
         street: string;
         city: string;
         state: string;
         zipCode: string;
       } | null;
       priorAddress: {          // Optional prior address
         street: string;
         city: string;
         state: string;
         zipCode: string;
         yearsAtAddress: number;
       } | null;
       gender: "M" | "F" | "O"; // Gender
       maritalStatus: string;   // Marital status
       dateOfBirth: Date;       // Date of birth
       occupation: string;      // Education/occupation
       driverLicense: {         // Driver's license info
         number: string;
         state: string;
       };
       ssn: string;             // Social security number (encrypted)
       referredBy: string | null; // Referral source
     };
     additionalInsureds: Array<{  // Additional insureds (up to 8)
       name: string;
       relationToPrimary: string;
       gender: "M" | "F" | "O";
       maritalStatus: string;
       dateOfBirth: Date;
       occupation: string;
       driverLicense: {
         number: string;
         state: string;
       };
       ssn: string;            // Encrypted
     }>;
     createdAt: Date;          // Record creation timestamp
     updatedAt: Date;          // Last update timestamp
     createdBy: string;        // User ID who created the record
     updatedBy: string;        // User ID who last updated the record
     tags: string[];           // Optional tags for categorization
     notes: string | null;     // General notes about the client
     vector?: number[];        // Vector embedding for semantic search
   }
   ```

3. **QuoteRequests Collection**
   ```typescript
   interface QuoteRequest {
     id: string;                // Unique identifier (UUID)
     clientId: string;          // Reference to client record
     effectiveDate: Date;       // Quote effective date
     insuranceTypes: {          // Types of insurance included
       auto: boolean;
       home: boolean;
       specialty: boolean;
     };
     status: "draft" | "submitted" | "quoted" | "bound" | "declined";
     autoInsurance: {          // Auto insurance details (if applicable)
       currentCarrier: string;
       monthsWithCarrier: number;
       currentLimits: string;
       quotingLimits: string;
       expirationDate: Date;
       premium: number | null;
       vehicles: Array<{       // Up to 8 vehicles
         year: number;
         make: string;
         model: string;
         vin: string;
         usage: string;
         annualMileage: number | null;
         primaryDriver: string;
         coverages: {
           comprehensive: string | null;
           collision: string | null;
           glass: boolean;
           towing: boolean;
           rentalReimbursement: boolean;
         };
         financing: {
           financedBy: string | null;
           hasGapCoverage: boolean;
         };
       }>;
     };
     homeInsurance: {          // Home insurance details (if applicable)
       currentCarrier: string;
       monthsWithCarrier: number;
       expirationDate: Date;
       usage: string; // Primary, Secondary, Rental, etc.
       formType: string;
       occupants: number;
       property: {
         yearBuilt: number;
         style: string;
         garage: string;
         squareFeet: number;
         basementFinishedPercent: number;
         hasWalkout: boolean;
         bathrooms: {
           full: number;
           threeQuarter: number;
           half: number;
         };
         siding: string;
         fireplace: boolean;
         woodstove: boolean;
         attachedStructures: string;
         detachedStructures: string;
       };
       safety: {
         sprinklered: boolean;
         milesFromFireDept: number;
         respondingFireDept: string;
         hydrantDistance: string;
       };
       roof: {
         yearReplaced: number;
         type: string;
       };
       outdoor: {
         deck: {
           type: string;
           size: string;
         };
         porch: {
           type: string;
           size: string;
         };
         pool: {
           present: boolean;
           depth: string;
           divingBoard: boolean;
         };
         trampoline: boolean;
         fence: {
           type: string;
           height: string;
         };
       };
       systems: {
         heating: {
           year: number;
           type: string;
         };
         electrical: {
           year: number;
           amps: string;
         };
         alarm: string;
         plumbing: {
           year: number;
           material: string;
         };
         sumpPump: string;
         serviceLine: string;
         septicSewer: string;
       };
       coverage: {
         floodInsurance: boolean;
         reconstructionCost: number;
         personalPropertyValue: number;
         scheduledItems: {
           type: string | null;
           value: number | null;
         };
         eBikes: {
           type: string | null;
           value: number | null;
         };
         deductible: string;
         windHailDeductible: string;
       };
       additional: {
         pets: string;
         businessType: string | null;
         bitingPets: boolean;
         mortgage: string | null;
         premium: number | null;
         bankruptcyForeclosure: boolean;
         umbrella: {
           value: number | null;
           uninsuredCoverage: boolean;
         };
         miscRecVehicles: boolean;
       };
     };
     specialtyInsurance: {     // Specialty insurance details (if applicable)
       items: Array<{          // Up to 8 specialty items
         type: string;
         year: number;
         make: string;
         model: string;
         vin: string | null;
         coverages: {
           comprehensive: string | null;
           collision: string | null;
         };
         specifications: {
           horsepower: number | null;
           maxSpeed: number | null;
           ccSize: number | null;
         };
         marketValue: number;
         storedLocation: string;
       }>;
       additionalInfo: string | null;
     };
     createdAt: Date;
     updatedAt: Date;
     createdBy: string;
     updatedBy: string;
     vector?: number[];        // Vector embedding for semantic search
   }
   ```

4. **Documents Collection**
   ```typescript
   interface Document {
     id: string;                // Unique identifier (UUID)
     quoteRequestId: string;    // Reference to quote request
     clientId: string;          // Reference to client
     name: string;              // Document name
     type: "quote" | "policy" | "endorsement" | "other";
     format: "docx" | "pdf";    // Document format
     filePath: string;          // Path to stored document
     fileSize: number;          // File size in bytes
     generatedAt: Date;         // Generation timestamp
     generatedBy: string;       // User ID who generated the document
     templateId: string;        // Reference to template used
     version: number;           // Document version
     metadata: {                // Additional metadata
       insuranceTypes: string[];
       placeholdersUsed: string[];
       processingTime: number;  // Time taken to generate (ms)
     };
     vector?: number[];         // Vector embedding for document search
   }
   ```

5. **Templates Collection**
   ```typescript
   interface Template {
     id: string;                // Unique identifier (UUID)
     name: string;              // Template name
     description: string;       // Template description
     type: "quote" | "policy" | "endorsement" | "other";
     filePath: string;          // Path to template file
     isActive: boolean;         // Whether template is active
     placeholders: string[];    // List of placeholders used in template
     version: number;           // Template version
     metadata: {                // Additional metadata
       applicableInsuranceTypes: string[];
       requiredFields: string[];
     };
   }
   ```

### Vector Search Capabilities

The LanceDB implementation enables:
- Semantic client search
- Document content search
- Similar quote finding
- Recommendation features (future)

### Implementation Approach

1. **Schema Design**: Using PyArrow schemas for structured collections
2. **CRUD Operations**: Implementing standard operations for all collections
3. **Vector Integration**: Adding support for AI-powered search and recommendations
4. **Search Optimization**: Creating appropriate indexes for performance

## Form Implementation

### Auto Insurance Form (Complete)

The Auto Insurance Form captures:
- Current insurance details
- Up to 8 vehicles with details:
  - Year, make, model, VIN
  - Usage and mileage
  - Coverage options (comprehensive, collision, glass, towing)
  - Additional features (rental, gap coverage)
- Driver assignments
- Premium information

### Home Insurance Form (In Progress)

The Home Insurance Form will capture:
- Property details (year built, style, square footage)
- Construction information (roof, siding, systems)
- Safety features (sprinklers, alarms)
- Coverage options (replacement cost, personal property)
- Additional structures and features

### Specialty Insurance Form (Planned)

The Specialty Insurance Form will capture:
- Multiple specialty items (up to 8)
- Vehicle/item specifications
- Coverage options
- Storage location

### Form State Persistence

Implemented form state persistence with:
- Auto-save capability
- Local storage backup
- Server-side persistence
- Form recovery on page refresh

## Document Generation API Integration

### API Configuration

Frontend services will connect to backend endpoints through a centralized configuration:

```typescript
// API base URL configuration 
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://65.21.174.252:8000';

// Document API endpoints
export const DOCUMENT_API = {
  generate: (quoteId, fileType) => `${API_BASE_URL}/api/documents/${quoteId}/generate/${fileType}`,
  list: (quoteId) => `${API_BASE_URL}/api/documents/quote/${quoteId}`,
  download: (documentId) => `${API_BASE_URL}/api/documents/download/${documentId}`,
};
```

### Document Generation Process

The document generation process follows these steps:
1. User submits request to generate a document for a specific quote
2. Backend loads appropriate templates based on quote type
3. Client and quote data are mapped to placeholders
4. Templates are processed and placeholders are replaced
5. Document is saved in DOCX format
6. For PDF, the DOCX is converted using one of three methods:
   - LibreOffice conversion (primary)
   - Unoconv (fallback)
   - Direct file copy (emergency fallback)
7. Document is stored and returned to the user

### Integration Steps

1. Update document service with correct API endpoints
2. Create configuration for API URLs
3. Connect DocumentGenerationPanel to hooks
4. Enhance error handling in document generator
5. Implement proper logging
6. Test with various document types and configurations

## Deployment Strategy

### Deployment Architecture

The application uses a split architecture approach:

1. **Frontend (Vercel)**:
   - Next.js application deployed on Vercel
   - Optimized for global edge delivery
   - Connected to backend API on Hetzner

2. **Backend (Hetzner)**:
   - Docker Compose for containerization
   - FastAPI application serving API endpoints
   - Document generation service
   - LanceDB database for data storage
   - Traefik for routing and SSL/TLS

### Deployment Process

1. **Backend Deployment**
   - SSH into Hetzner server: `ssh -i ~/.ssh/id_ed25519 root@65.21.174.252`
   - Clone repository: `git clone https://github.com/jakenelwood/quote-request-fresh.git`
   - Run backend deployment script: `./deploy-backend.sh`
   - Configure environment variables for backend services

2. **Frontend Deployment**
   - Connect GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Set API_BASE_URL to point to Hetzner server
   - Deploy frontend to Vercel

3. **Cross-Environment Setup**
   - Configure CORS on backend to allow Vercel origin
   - Set up secure communication between environments
   - Create consistent environment variable schema

### Platform Integration

The application leverages a split architecture with:

1. **Frontend (Vercel)**:
   - Globally distributed CDN
   - Automatic HTTPS
   - Edge functions for API routes
   - Optimized image delivery
   - Preview deployments for testing

2. **Backend (Hetzner)**:
   - Full control over server environment
   - Docker containerization for services
   - Access to file system for document storage
   - Database hosting
   - Document processing services

## MVP Launch Checklist

### Pre-launch Requirements

1. **Document Generation Testing**
   - Generate test documents with complete data
   - Verify placeholder replacement accuracy
   - Test PDF conversion reliability
   - Ensure documents include all required fields

2. **Deployment Verification**
   - Verify backend is accessible at http://65.21.174.252:8000
   - Confirm frontend is deployed on Vercel
   - Test connectivity between frontend and backend
   - Verify CORS configuration works correctly

3. **Frontend-Backend Integration**
   - Test cross-browser compatibility
   - Verify all API calls work correctly
   - Test form submissions with various data combinations
   - Verify document download works properly

4. **User Acceptance Testing**
   - Create test scenarios for key user workflows
   - Test with real form data
   - Verify document accuracy and formatting

### Post-launch Monitoring

1. **Server Monitoring**
   - Check server logs for errors
   - Monitor document generation performance
   - Track API response times

2. **User Feedback Collection**
   - Gather initial user feedback
   - Document issues and enhancement requests
   - Prioritize fixes based on impact

## Implementation Roadmap

### Phase 1: MVP Release (Current)
- Basic form functionality for auto insurance
- Document generation with DOCX/PDF
- Initial LanceDB implementation
- Split deployment (Frontend on Vercel, Backend on Hetzner)

### Phase 2: Enhanced Features
- Complete home insurance form implementation
- Search functionality with vector capabilities
- User interface improvements
- Automated testing infrastructure

### Phase 3: Advanced Features
- Specialty insurance form implementation
- AI-powered recommendations
- Document analysis capabilities
- Comprehensive reporting

### Phase 4: Platform Expansion
- Enhanced Vercel-specific features
- Advanced edge functions
- Performance optimizations
- Mobile responsiveness improvements

## Technical Implementation Details

### Key Technologies

- **Frontend**: Next.js 15.3.0, React, ShadcN UI, React Query, React Hook Form
- **Backend**: FastAPI, Python, python-docx, LanceDB
- **Deployment**: Docker, Docker Compose, Traefik, Hetzner Cloud
- **Testing**: Jest, React Testing Library, Pytest 