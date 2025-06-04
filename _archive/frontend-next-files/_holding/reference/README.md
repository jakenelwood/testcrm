# UI Component Reference Library

This directory contains UI components extracted from the purchased Shadcn Pro template. Use these components as reference when building new features in the Gonzigo CRM application.

## Directory Structure

- **components/**
  - **ui/** - Basic UI components (buttons, inputs, cards, etc.)
  - **layouts/** - Layout components (sidebars, headers, etc.)
  - **templates/** - Full page templates and complex component combinations
- **styles/** - CSS and styling utilities

## How to Use This Reference Library

1. **Browse Components**: Look through the directories to find components you need
2. **Copy or Import**: Either copy the component to your working directory or import it directly
3. **Customize**: Modify the component to fit your specific needs

## Component Catalog

Below is a catalog of available components. Each component includes a brief description and usage example.

### UI Components

| Component | Description | Location |
|-----------|-------------|----------|
| Button | Standard button with variants | `components/ui/button.tsx` |
| Input | Text input field | `components/ui/input.tsx` |
| Card | Content container with variants | `components/ui/card.tsx` |
| ... | ... | ... |

### Layout Components

| Component | Description | Location |
|-----------|-------------|----------|
| Sidebar | Application sidebar with navigation | `components/layouts/sidebar.tsx` |
| Header | Page header with actions | `components/layouts/header.tsx` |
| ... | ... | ... |

### Templates

| Template | Description | Location |
|----------|-------------|----------|
| Dashboard | Main dashboard layout | `components/templates/dashboard.tsx` |
| Settings | User settings page | `components/templates/settings.tsx` |
| ... | ... | ... |

## Styling Guidelines

When using these components, follow these styling guidelines to maintain consistency:

- Use the color variables defined in the theme
- Maintain consistent spacing using the spacing scale
- Use the typography styles for consistent text appearance

## Adding New Components

If you create new reusable components, consider adding them to this reference library:

1. Place the component in the appropriate directory
2. Update this README with component information
3. Include proper TypeScript types and documentation

---

*This reference library is for internal use only. Components are from a purchased template and should not be distributed outside the project.*
