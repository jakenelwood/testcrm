# KanbanBoard Component - Table of Contents

This document provides an overview of the `KanbanBoard.tsx` component, which is a core UI element of the CRM system.

## File Purpose

The `KanbanBoard.tsx` file implements a Kanban-style board for visualizing and managing leads across different stages of the sales pipeline. It provides a visual representation of the sales process and allows users to see the status of all leads at a glance.

## Component Structure

| Component/Function | Description | Language | Purpose | Connected Components |
|-------------------|-------------|----------|---------|---------------------|
| `KanbanBoardProps` | Interface | TypeScript | Defines the props for the KanbanBoard component | N/A |
| `KanbanBoard` | React Component | React (TSX) | Main component that renders the Kanban board | KanbanColumn |

## Key Functions and Logic

| Function/Logic | Description | Purpose |
|----------------|-------------|---------|
| Status Definition | Defines the possible lead statuses | Creates the structure for the Kanban columns |
| Lead Grouping | Groups leads by their status | Organizes leads for display in appropriate columns |
| Loading State | Renders skeleton UI when data is loading | Provides visual feedback during data fetching |
| Responsive Grid | Adjusts column layout based on screen size | Ensures usability across different devices |

## Props

| Prop | Type | Purpose |
|------|------|---------|
| `leads` | `Lead[]` | Array of lead objects to display on the board |
| `isLoading` | `boolean` | Flag indicating whether lead data is being loaded |
| `onLeadSelect` | `(lead: Lead) => void` | Callback function for when a lead is selected |

## Rendering Logic

1. If `isLoading` is true, renders a skeleton UI with placeholder columns and cards
2. Otherwise, renders the full Kanban board with:
   - One column per status
   - Leads grouped into their respective status columns
   - Click handlers for lead selection

## Related Files

- `KanbanColumn.tsx` - Child component that renders individual columns
- `LeadCard.tsx` - Component for rendering individual lead cards
- `lead.ts` - Contains the Lead and LeadStatus type definitions
- `leads/page.tsx` - Parent page that uses the KanbanBoard component

## Technologies Used

- React (with TypeScript)
- Tailwind CSS for styling
- shadcn/ui components (Skeleton)
- Client-side rendering ('use client' directive)
