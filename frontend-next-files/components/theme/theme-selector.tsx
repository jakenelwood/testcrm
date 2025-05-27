'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Paintbrush, Moon, Sun, Monitor } from 'lucide-react';

const colorThemes = [
  { name: 'default', label: 'Default', className: '' },
  { name: 'stone', label: 'Stone', className: 'theme-stone' },
  { name: 'zinc', label: 'Zinc', className: 'theme-zinc' },
  { name: 'slate', label: 'Slate', className: 'theme-slate' },
  { name: 'gray', label: 'Gray', className: 'theme-gray' },
  { name: 'neutral', label: 'Neutral', className: 'theme-neutral' },
  { name: 'red', label: 'Red', className: 'theme-red' },
  { name: 'rose', label: 'Rose', className: 'theme-rose' },
  { name: 'orange', label: 'Orange', className: 'theme-orange' },
  { name: 'green', label: 'Green', className: 'theme-green' },
  { name: 'blue', label: 'Blue', className: 'theme-blue' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [currentColorTheme, setCurrentColorTheme] = React.useState('default');

  React.useEffect(() => {
    setMounted(true);

    // Check for existing color theme in document class
    const htmlClasses = document.documentElement.className;
    const colorTheme = colorThemes.find(t => t.className && htmlClasses.includes(t.className));
    if (colorTheme) {
      setCurrentColorTheme(colorTheme.name);
    }
  }, []);

  const handleColorThemeChange = (themeName: string) => {
    const selectedTheme = colorThemes.find(t => t.name === themeName);
    if (!selectedTheme) return;

    // Remove all existing theme classes from html element
    const htmlElement = document.documentElement;
    const currentClasses = htmlElement.className;
    const cleanedClasses = currentClasses.replace(/theme-\w+/g, '').trim();

    // Set the new class list
    if (selectedTheme.className) {
      htmlElement.className = `${cleanedClasses} ${selectedTheme.className}`.trim();
    } else {
      htmlElement.className = cleanedClasses;
    }

    setCurrentColorTheme(themeName);

    // Store in localStorage
    localStorage.setItem('color-theme', themeName);
  };

  React.useEffect(() => {
    // Restore color theme from localStorage
    const storedColorTheme = localStorage.getItem('color-theme');
    if (storedColorTheme && mounted) {
      const colorTheme = colorThemes.find(t => t.name === storedColorTheme);
      if (colorTheme) {
        setCurrentColorTheme(storedColorTheme);
        // Apply the theme class to html element
        const htmlElement = document.documentElement;
        const currentClasses = htmlElement.className;
        const cleanedClasses = currentClasses.replace(/theme-\w+/g, '').trim();
        if (colorTheme.className) {
          htmlElement.className = `${cleanedClasses} ${colorTheme.className}`.trim();
        }
      }
    }
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex gap-2">
      {/* Dark/Light Mode Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {getThemeIcon()}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme('light')}>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            <Monitor className="mr-2 h-4 w-4" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Color Theme Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Paintbrush className="h-4 w-4" />
            <span className="sr-only">Change color theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {colorThemes.map((t) => (
            <DropdownMenuItem
              key={t.name}
              onClick={() => handleColorThemeChange(t.name)}
              className={currentColorTheme === t.name ? 'bg-muted font-medium' : ''}
            >
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
