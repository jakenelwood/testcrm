'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName, defaultTheme } from '@/lib/themes';

// Define more distinct colors for each theme
export const themeStyles = {
  neutral: {
    background: '#ffffff',
    foreground: '#171717',
    primary: '#171717',
    primaryForeground: '#ffffff',
    secondary: '#f5f5f5',
    secondaryForeground: '#171717',
    card: '#ffffff',
    cardForeground: '#171717',
    muted: '#f5f5f5',
    mutedForeground: '#737373',
    accent: '#f5f5f5',
    accentForeground: '#171717',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e5e5e5',
    input: '#e5e5e5',
    ring: '#737373',
  },
  stone: {
    background: '#fafaf9',
    foreground: '#44403c',
    primary: '#78716c',
    primaryForeground: '#ffffff',
    secondary: '#f5f3f2',
    secondaryForeground: '#44403c',
    card: '#ffffff',
    cardForeground: '#44403c',
    muted: '#f5f3f2',
    mutedForeground: '#78716c',
    accent: '#f5f3f2',
    accentForeground: '#44403c',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e7e5e4',
    input: '#e7e5e4',
    ring: '#a8a29e',
  },
  zinc: {
    background: '#fafafa',
    foreground: '#3f3f46',
    primary: '#71717a',
    primaryForeground: '#ffffff',
    secondary: '#f4f4f5',
    secondaryForeground: '#3f3f46',
    card: '#ffffff',
    cardForeground: '#3f3f46',
    muted: '#f4f4f5',
    mutedForeground: '#71717a',
    accent: '#f4f4f5',
    accentForeground: '#3f3f46',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e4e4e7',
    input: '#e4e4e7',
    ring: '#a1a1aa',
  },
  gray: {
    background: '#f9fafb',
    foreground: '#374151',
    primary: '#6b7280',
    primaryForeground: '#ffffff',
    secondary: '#f3f4f6',
    secondaryForeground: '#374151',
    card: '#ffffff',
    cardForeground: '#374151',
    muted: '#f3f4f6',
    mutedForeground: '#6b7280',
    accent: '#f3f4f6',
    accentForeground: '#374151',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e5e7eb',
    input: '#e5e7eb',
    ring: '#9ca3af',
  },
  slate: {
    background: '#f8fafc',
    foreground: '#334155',
    primary: '#64748b',
    primaryForeground: '#ffffff',
    secondary: '#f1f5f9',
    secondaryForeground: '#334155',
    card: '#ffffff',
    cardForeground: '#334155',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    accent: '#f1f5f9',
    accentForeground: '#334155',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#94a3b8',
  }
};

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
};

type ThemeProviderState = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themeColors: typeof themeStyles.neutral;
};

const initialState: ThemeProviderState = {
  theme: defaultTheme,
  setTheme: () => null,
  themeColors: themeStyles[defaultTheme],
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme: defaultThemeProp = defaultTheme,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeName>(defaultThemeProp);
  const [themeColors, setThemeColors] = useState(themeStyles[defaultThemeProp]);

  // Debug: Log the initial theme
  console.log('ThemeProvider initialized with theme:', defaultThemeProp);

  useEffect(() => {
    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem('theme') as ThemeName | null;
    console.log('Theme from localStorage:', storedTheme);

    if (storedTheme && ['neutral', 'stone', 'zinc', 'gray', 'slate'].includes(storedTheme)) {
      console.log('Setting theme from localStorage:', storedTheme);
      setTheme(storedTheme);
      setThemeColors(themeStyles[storedTheme]);
    } else {
      console.log('Using default theme:', defaultThemeProp);
    }
  }, [defaultThemeProp]);

  useEffect(() => {
    try {
      const root = document.documentElement;

      console.log('Applying theme:', theme);

      // Set data-theme attribute for theme-specific CSS
      root.setAttribute('data-theme', theme);

      // Store theme preference
      localStorage.setItem('theme', theme);

      // Debug: Log the applied theme
      console.log('Applied theme:', {
        'data-theme': root.getAttribute('data-theme')
      });

    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, [theme]);

  const value = {
    theme,
    themeColors,
    setTheme: (newTheme: ThemeName) => {
      console.log('setTheme called with:', newTheme, 'Current theme:', theme);
      setTheme(newTheme);
      setThemeColors(themeStyles[newTheme]);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
