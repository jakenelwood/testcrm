'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

type ThemeName = 'neutral' | 'stone' | 'zinc' | 'gray' | 'slate';

export function DirectThemeTest() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('neutral');
  
  // Get the current theme from the HTML data-theme attribute on mount
  useEffect(() => {
    const htmlTheme = document.documentElement.getAttribute('data-theme') as ThemeName;
    if (htmlTheme) {
      setCurrentTheme(htmlTheme);
    }
  }, []);
  
  // Available themes
  const themes = [
    { name: 'neutral', label: 'Neutral' },
    { name: 'stone', label: 'Stone' },
    { name: 'zinc', label: 'Zinc' },
    { name: 'gray', label: 'Gray' },
    { name: 'slate', label: 'Slate' }
  ];
  
  // Function to directly change the theme
  const changeTheme = (themeName: ThemeName) => {
    console.log('Directly changing theme to:', themeName);
    
    // Set the data-theme attribute
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Update the state
    setCurrentTheme(themeName);
    
    // Store in localStorage
    localStorage.setItem('theme', themeName);
  };
  
  return (
    <div className="p-4 border rounded-md mt-4">
      <h3 className="font-medium mb-2">Direct Theme Test</h3>
      <p className="text-sm mb-4">This bypasses the ThemeProvider and directly sets the data-theme attribute.</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {themes.map((t) => (
          <Button
            key={t.name}
            variant={currentTheme === t.name ? "default" : "outline"}
            className="w-full justify-center"
            onClick={() => changeTheme(t.name as ThemeName)}
          >
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
