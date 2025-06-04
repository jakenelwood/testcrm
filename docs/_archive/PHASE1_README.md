# AI CRM - Phase 1: Lead Management Foundation

## Focus

- Capture structured **lead data** (formerly "quote request" data) through forms for auto, home, and specialty insurance.
- Allow users to **capture notes** on leads for context and follow-up.
- Organize leads using a **Kanban-style board** to easily visualize lead progress (New, Contacted, Quoted, Sold, Lost).

## Key Features for Phase 1

- Dynamic **lead intake forms** with persistent form state (Next.js frontend, FastAPI backend).
- **Notes system** attached to each lead (editable, searchable).
- **Kanban board interface**:
  - Columns: New, Contacted, Quoted, Sold, Lost
  - Drag-and-drop interaction to move leads between stages
  - Real-time updates to Supabase backend
- Basic **lead search and filtering** functionality

## Stack

**Frontend:**
- Next.js 15.3.1
- TailwindCSS + ShadCN UI
- @dnd-kit/core for lightweight drag-and-drop

**Backend:**
- FastAPI (Python)
- REST API for lead management and updates

**Database:**
- Supabase (PostgreSQL)
- Tables: `leads` and optional `lead_notes`

**Deployment:**
- Vercel (Frontend hosting)
- Docker Compose (Backend local development)

## Goal

Create a **usable, AI-ready CRM core** where:
- Lead data flows cleanly into a structured database.
- Notes are captured per lead to enable future memory building.
- Leads are managed visually through an intuitive Kanban board.
- Future phases will layer in AI enhancements like next action suggestions, priority ranking, and automated follow-ups.

## 🚀 Quick Visual of Phase 1 User Flow

1. User submits **Lead Form** (Auto, Home, Specialty fields captured)
2. User **adds notes** to the lead timeline (e.g., "Left voicemail 3/14")
3. Lead appears on the **Kanban board** under "New"
4. User **drags lead** to "Contacted," "Quoted," etc.
5. System **updates Supabase** in real-time to track pipeline progress

## Database Changes (Supabase)

**Leads Table:**
- `id` (UUID, primary key)
- `first_name` (text)
- `last_name` (text)
- `email` (text)
- `phone_number` (text)
- `insurance_type` (enum: Auto, Home, Specialty)
- `notes` (text, nullable)
- `status` (enum: New, Contacted, Quoted, Sold, Lost)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**(Optional) Lead Notes Table:**
- `id` (UUID)
- `lead_id` (foreign key)
- `note_content` (text)
- `created_at` (timestamp)

**Why:**
- Versioned notes are better for AI memory stitching later.

## Frontend (Next.js) - Kanban UI

- Build a **Kanban Board Page** under `/dashboard/leads`
- Columns for each status: New, Contacted, Quoted, Sold, Lost
- **Lead Cards** display:
  - Lead Name
  - Insurance Type
  - Most recent note (preview)

- Use **@dnd-kit/core** for lightweight drag-and-drop functionality
- On card move, update `status` in Supabase (`PATCH /leads/:id` API)
- Add **Quick Add Lead** modal:
  - Minimal fields (name, insurance type)
  - Drops lead into "New" column
- Add **Notes Quick Editor**:
  - Open side modal to edit notes without leaving the Kanban

## Backend (FastAPI)

- `POST /leads` ➔ Create new lead
- `PATCH /leads/{id}` ➔ Update lead info (including status)
- `GET /leads` ➔ List all leads, optional status filtering
- `POST /lead_notes` (optional) ➔ Create a note entry
- (Optional) Enable Supabase Subscriptions for real-time frontend updates

## Frontend Kanban UX Polishing

- Add **badges** (e.g., color code by insurance type)
- Add **hover previews** (last modified date, most recent interaction)
- Add **search box** (filter by name, email, phone)
- Keep Kanban lightweight:
  - Only fetch id, name, insurance_type, status, and recent note by default
  - Full lead details fetched on card click

## 🧬 Why This Approach?

- **Lean and scalable:** Handles 10 to 10,000+ leads with minimal overhead.
- **AI-ready:** Structured notes and leads prepared for future memory embedding.
- **Real-time UX:** Instant feedback on lead updates via Supabase and Next.js.
- **Easy upgrade path:** Built to layer in AI features with zero rework later.

## 🚀 Immediate Next Steps

- ✅ Create `leads` table in Supabase
- ✅ Scaffold `/dashboard/leads` Kanban page in Next.js
- ✅ Connect Supabase API endpoints (GET/PATCH)
- ✅ Add drag-and-drop with `@dnd-kit/core`
- ✅ Add side modal for notes editing
- ✅ Polish with search and quick lead creation

---

# Vision

Phase 1 builds the first brick of an AI-first CRM foundation — ready to evolve into a proactive, memory-driven Chief of Staff CRM.

