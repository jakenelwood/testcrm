/**
 * Theme interface defining all the CSS variables required for a complete theme
 */
export interface Theme {
  name: string;
  label: string;
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export type ThemeName = 'stone' | 'zinc' | 'neutral' | 'gray' | 'slate';
