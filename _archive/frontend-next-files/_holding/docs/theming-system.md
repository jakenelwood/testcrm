# RonRico CRM Theming System

## Overview

The RonRico CRM now implements a comprehensive theming system that follows shadcn/ui best practices with proper CSS variables and data-theme attributes. This system provides both dark/light mode switching and multiple base color themes.

## Features

### 1. Base Color Themes
- **Slate** (default): Cool gray with blue undertones
- **Stone**: Warm gray with brown undertones  
- **Zinc**: Neutral gray with subtle blue
- **Neutral**: Pure gray without color bias
- **Gray**: Classic gray with slight blue tint

### 2. Dark/Light Mode
- Automatic system preference detection
- Manual toggle capability
- Smooth transitions between modes
- Proper hydration handling to prevent SSR mismatches

### 3. CSS Variables
All colors use CSS variables with oklch color space for better color consistency:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--chart-1` through `--chart-5`

## Implementation

### Theme Context
Located in `lib/theme-context.tsx`, provides:
- Base theme state management
- localStorage persistence
- Document attribute application
- Hydration-safe rendering

### Theme Selector Component
Located in `components/theme-selector.tsx`, provides:
- Radio button interface for theme selection
- Theme preview colors
- Hydration-safe rendering

### CSS Structure
Located in `app/globals.css`:
- Default theme (Slate) in `:root`
- Dark mode variants in `.dark`
- Data-theme specific overrides in `[data-theme="name"]`
- Proper oklch color values for all themes

## Usage

### Applying Themes
Themes are applied via data attributes on the document element:
```html
<html data-theme="stone" class="dark">
```

### Using Colors in Components
Always use CSS variable classes instead of hardcoded colors:
```tsx
// Good
<div className="bg-primary text-primary-foreground">
<div className="text-muted-foreground">
<div className="border-border">

// Bad
<div className="bg-blue-500 text-white">
<div style={{ color: '#0047AB' }}>
```

### Chart Colors
Use the chart color variables for data visualization:
```tsx
<div className="bg-chart-1">
<div className="bg-chart-2">
// etc.
```

## Configuration

### Adding New Themes
1. Add theme definition to `app/globals.css`
2. Update theme list in `lib/theme-context.tsx`
3. Add preview colors to `components/theme-selector.tsx`

### Customizing Colors
Modify the CSS variables in `app/globals.css` using oklch color values for best results.

## Migration Notes

### Removed Hardcoded Colors
- All hex color values replaced with CSS variables
- Brand color classes removed from Tailwind config
- Status styles updated to use theme colors
- Animation colors now use CSS variables

### Hydration Fixes
- Added mounted state checks to prevent SSR mismatches
- Proper loading states for theme-dependent components
- Theme application only after client-side hydration

## Testing

Visit `/theme-test` to see all theme colors and test theme switching functionality.

## Settings Integration

The theme selector is integrated into the settings page at `/dashboard/settings` under the "Appearance" tab.
