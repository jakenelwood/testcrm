# LeadCard Component - Table of Contents

This document provides an overview of the `LeadCard.tsx` component, which is responsible for rendering individual lead cards in the Kanban board.

## File Purpose

The `LeadCard.tsx` file implements a card component that displays lead information and handles both click and drag interactions. It's a key UI element that enables users to view lead details and move leads between different stages of the sales pipeline.

## Component Structure

| Component/Function | Description | Language | Purpose | Connected Components |
|-------------------|-------------|----------|---------|---------------------|
| `LeadCardProps` | Interface | TypeScript | Defines the props for the LeadCard component | N/A |
| `LeadCard` | React Component | React (TSX) | Main component that renders a lead card | Used in KanbanColumn |

## Key Functions and Logic

| Function/Logic | Description | Purpose |
|----------------|-------------|---------|
| `handleMouseDown` | Tracks when mouse button is pressed | Used to distinguish between click and drag |
| `handleMouseUp` | Handles mouse release events | Determines if action is a click or drag |
| `formattedDate` | Formats the lead creation date | Improves readability of date information |
| `getCarrierColor` | Maps carrier names to colors | Provides visual differentiation between carriers |

## Props

| Prop | Type | Purpose |
|------|------|---------|
| `lead` | `Lead` | The lead data to display on the card |
| `onClick` | `() => void` | Callback function for when the card is clicked |

## Interaction Model

The component implements a sophisticated dual-mode interaction:
1. **Quick Click**: Opens the lead details modal for viewing and editing
2. **Click and Hold**: Enables dragging to move the lead between columns

This is implemented using:
- A timestamp to track when the mouse button was pressed
- A threshold time to distinguish between clicks and drags
- Integration with dnd-kit for drag-and-drop functionality

## Visual Elements

The card displays several key pieces of information:
- Lead name (first and last)
- Creation date
- Current insurance carrier (with color coding)
- Premium amount
- Assigned agent (if any)

## Related Files

- `KanbanColumn.tsx` - Parent component that contains LeadCard components
- `KanbanBoard.tsx` - Overall board component that organizes columns
- `LeadDetailsModal.tsx` - Modal that opens when a card is clicked
- `lead.ts` - Contains the Lead type definition

## Technologies Used

- React (with TypeScript)
- dnd-kit for drag-and-drop functionality
- Tailwind CSS for styling
- Client-side rendering ('use client' directive)
