# CRM Application - Table of Contents

This document provides a comprehensive overview of the CRM application's structure, components, and architecture.

## Application Architecture

The CRM application is built using the following technologies:
- **Frontend**: Next.js 14 (React framework) with TypeScript
- **UI Components**: Custom components built with Tailwind CSS and shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

The application follows a client-side rendering approach with the Next.js App Router, using React Server Components where appropriate.

## Core Modules

| Module | Description | Key Files | Purpose |
|--------|-------------|-----------|---------|
| **Lead Management** | Handles lead tracking and management | `leads/page.tsx`, `KanbanBoard.tsx` | Central feature for tracking sales opportunities |
| **Quote Generation** | Creates insurance quotes | `new/page.tsx`, `quote-form-container.tsx` | Allows agents to create quotes for leads |
| **Dashboard** | Overview of CRM metrics | `dashboard/page.tsx` | Provides business intelligence and KPIs |
| **Document Management** | Handles document generation | `DocumentGenerationPanel.tsx` | Creates and manages customer documents |

## Key Components

### UI Components

| Component | Description | Location | Purpose |
|-----------|-------------|----------|---------|
| `KanbanBoard` | Kanban-style board for leads | `components/kanban/KanbanBoard.tsx` | Visual representation of sales pipeline |
| `LeadCard` | Individual lead card | `components/kanban/LeadCard.tsx` | Displays lead information in Kanban board |
| `LeadDetailsModal` | Modal for lead details | `components/kanban/LeadDetailsModal.tsx` | Allows viewing and editing lead details |
| `QuoteFormContainer` | Container for quote forms | `components/forms/quote-form-container.tsx` | Manages the quote creation process |
| `Header` | Application header | `components/header.tsx` | Navigation and user interface element |
| `Sidebar` | Application sidebar | `components/sidebar.tsx` | Main navigation for the application |

### Pages

| Page | Description | Location | Purpose |
|------|-------------|----------|---------|
| Dashboard | Main dashboard | `app/dashboard/page.tsx` | Shows KPIs and summary information |
| Leads | Lead management | `app/dashboard/leads/page.tsx` | Kanban board for lead management |
| New Lead | Lead creation | `app/dashboard/new/page.tsx` | Form for creating new leads |
| Quote Details | Quote information | `app/quotes/[id]/page.tsx` | Shows details for a specific quote |

### Data Types

| Type | Description | Location | Purpose |
|------|-------------|----------|---------|
| `Lead` | Lead data structure | `types/lead.ts` | Core data type for lead information |
| `LeadStatus` | Lead status enum | `types/lead.ts` | Defines possible lead statuses |
| `InsuranceType` | Insurance type enum | `types/lead.ts` | Defines insurance product types |
| `LeadNote` | Lead note structure | `types/lead.ts` | For tracking communication history |

## Data Flow

1. **Lead Creation**:
   - User enters lead information in `new/page.tsx`
   - Data is validated and submitted to Supabase
   - Lead appears in Kanban board

2. **Lead Management**:
   - Leads are displayed in `KanbanBoard` by status
   - Users can drag leads between columns to change status
   - Clicking a lead opens `LeadDetailsModal` for editing

3. **Quote Generation**:
   - User selects insurance type and enters details
   - Form data is processed and a quote is generated
   - Quote is stored in Supabase and linked to the lead

## Key Features

### Kanban Board
- Visualizes leads by status
- Drag-and-drop functionality for status changes
- Click vs. click-and-hold interaction model
- Responsive design for different screen sizes

### Lead Details
- Tabbed interface (Lead Data, Communication History, Marketing Automation)
- Editable lead information
- Communication history tracking
- Scrollable content for comprehensive data

### Quote Forms
- Dynamic forms based on insurance type
- Multi-step form process
- Validation and error handling
- Integration with document generation

## Database Structure

The application uses Supabase with the following main tables:
- `leads`: Stores lead information
- `lead_notes`: Stores notes associated with leads
- `lead_communications`: Tracks communication history
- `quotes`: Stores generated quotes

## Authentication and Authorization

The application uses Supabase Auth for authentication and implements Row Level Security (RLS) policies to ensure users can only access their authorized data.

## Deployment

The application is deployed on Vercel with automatic deployments triggered by GitHub pushes to the main branch.

## Future Enhancements

Planned enhancements include:
- Enhanced reporting and analytics
- Email integration for automated follow-ups
- Calendar integration for appointment scheduling
- Mobile application for field agents
