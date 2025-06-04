'use client';

import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import { BaseTheme } from '@/lib/theme-context';

export function ThemeTest() {
  const { baseTheme, setBaseTheme } = useTheme();

  // Array of theme names for buttons
  const themes: BaseTheme[] = ['neutral', 'stone', 'zinc', 'gray', 'slate'];

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-lg font-bold">Theme Test</h2>
      <p>Current base theme: <strong>{baseTheme}</strong></p>
      
      <div className="flex flex-wrap gap-2">
        {themes.map((themeName) => (
          <Button
            key={themeName}
            variant={baseTheme === themeName ? 'default' : 'outline'}
            onClick={() => {
              console.log(`Setting base theme to ${themeName}`);
              setBaseTheme(themeName);
            }}
          >
            {themeName}
          </Button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-muted rounded-md">
        <h3 className="text-sm font-medium mb-2">Visual Test:</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-background text-foreground border p-2 rounded">
            Background/Foreground
          </div>
          <div className="bg-primary text-primary-foreground p-2 rounded">
            Primary
          </div>
          <div className="bg-secondary text-secondary-foreground p-2 rounded">
            Secondary
          </div>
          <div className="bg-muted text-muted-foreground p-2 rounded">
            Muted
          </div>
        </div>
      </div>
    </div>
  );
}
