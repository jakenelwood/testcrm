'use client';

import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';
import { ThemeName } from '@/lib/themes';

export function ThemeTest() {
  const { theme, setTheme } = useTheme();

  // Array of theme names for buttons
  const themes: ThemeName[] = ['neutral', 'stone', 'zinc', 'gray', 'slate'];

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-lg font-bold">Theme Test</h2>
      <p>Current theme: <strong>{theme}</strong></p>
      
      <div className="flex flex-wrap gap-2">
        {themes.map((themeName) => (
          <Button
            key={themeName}
            variant={theme === themeName ? 'default' : 'outline'}
            onClick={() => {
              console.log(`Setting theme to ${themeName}`);
              setTheme(themeName);
            }}
          >
            {themeName}
          </Button>
        ))}
      </div>
    </div>
  );
}
