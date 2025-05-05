'use client';

import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Paintbrush } from 'lucide-react';
import { getThemes, ThemeName } from '@/lib/themes';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  // Hardcode the themes for simplicity
  const themes = [
    { name: 'neutral', label: 'Neutral' },
    { name: 'stone', label: 'Stone' },
    { name: 'zinc', label: 'Zinc' },
    { name: 'gray', label: 'Gray' },
    { name: 'slate', label: 'Slate' }
  ];

  const handleThemeChange = (themeName: string) => {
    console.log('Theme selected:', themeName);
    setTheme(themeName as ThemeName);
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 relative"
          >
            <Paintbrush className="h-4 w-4" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="z-[100] absolute"
          style={{ position: 'fixed' }}
        >
          {themes.map((t) => (
            <DropdownMenuItem
              key={t.name}
              onClick={() => handleThemeChange(t.name)}
              className={theme === t.name ? 'bg-muted font-medium' : ''}
            >
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
