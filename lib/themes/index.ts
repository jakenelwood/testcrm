import { Theme, ThemeName } from './types';
import { neutralTheme } from './neutral';
import { stoneTheme } from './stone';
import { zincTheme } from './zinc';
import { grayTheme } from './gray';
import { slateTheme } from './slate';

// Export all themes
export * from './types';
export * from './neutral';
export * from './stone';
export * from './zinc';
export * from './gray';
export * from './slate';

// Create a themes map for easy access
export const themes: Record<ThemeName, Theme> = {
  neutral: neutralTheme,
  stone: stoneTheme,
  zinc: zincTheme,
  gray: grayTheme,
  slate: slateTheme,
};

// Get all available themes as an array
export const getThemes = (): Theme[] => Object.values(themes);

// Get a theme by name
export const getTheme = (name: ThemeName): Theme => themes[name];

// Default theme
export const defaultTheme: ThemeName = 'neutral';
