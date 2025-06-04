'use client';

import { useTheme as useCustomTheme } from '@/lib/theme-context';
import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ThemeDebug() {
  const { baseTheme, accentColor } = useCustomTheme();
  const { theme: darkLightTheme } = useNextTheme();
  const [cssVars, setCssVars] = useState<Record<string, string>>({});
  const [htmlAttributes, setHtmlAttributes] = useState<Record<string, string>>({});
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      
      setCssVars({
        '--background': computedStyle.getPropertyValue('--background').trim(),
        '--foreground': computedStyle.getPropertyValue('--foreground').trim(),
        '--primary': computedStyle.getPropertyValue('--primary').trim(),
        '--secondary': computedStyle.getPropertyValue('--secondary').trim(),
        '--border': computedStyle.getPropertyValue('--border').trim(),
        '--red': computedStyle.getPropertyValue('--red').trim(),
        '--green': computedStyle.getPropertyValue('--green').trim(),
        'body.backgroundColor': bodyStyle.backgroundColor,
        'body.color': bodyStyle.color,
      });

      setHtmlAttributes({
        'data-theme': document.documentElement.getAttribute('data-theme') || 'none',
        'data-accent-color': document.documentElement.getAttribute('data-accent-color') || 'none',
        'class': document.documentElement.className,
      });

      setLocalStorageData({
        'base-theme': localStorage.getItem('base-theme') || 'none',
        'accent-color': localStorage.getItem('accent-color') || 'none',
        'theme': localStorage.getItem('theme') || 'none',
      });
    };

    updateDebugInfo();
    
    // Update debug info when theme changes
    const observer = new MutationObserver(updateDebugInfo);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-accent-color', 'class']
    });

    return () => observer.disconnect();
  }, [baseTheme, accentColor, darkLightTheme]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-sm">🔍 Debug Information</CardTitle>
        <p className="text-xs text-muted-foreground">Current theme state and CSS variables</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2">Current Theme State:</h4>
          <div className="text-sm font-mono bg-muted p-2 rounded space-y-1">
            <div><span className="text-blue-600">Base Theme:</span> {baseTheme}</div>
            <div><span className="text-blue-600">Accent Color:</span> {accentColor || 'default'}</div>
            <div><span className="text-blue-600">Dark/Light Mode:</span> {darkLightTheme}</div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">HTML Element State:</h4>
          <div className="text-xs font-mono bg-muted p-2 rounded space-y-1">
            <div><span className="text-blue-600">Classes:</span> {htmlAttributes.class || 'none'}</div>
            <div><span className="text-blue-600">data-theme:</span> {htmlAttributes['data-theme']}</div>
            <div><span className="text-blue-600">data-accent-color:</span> {htmlAttributes['data-accent-color']}</div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">LocalStorage:</h4>
          <div className="text-xs font-mono bg-muted p-2 rounded space-y-1">
            {Object.entries(localStorageData).map(([key, value]) => (
              <div key={key}>
                <span className="text-blue-600">{key}:</span> {value}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">CSS Variables:</h4>
          <div className="text-xs font-mono bg-muted p-2 rounded space-y-1">
            {Object.entries(cssVars).map(([key, value]) => (
              <div key={key}>
                <span className="text-blue-600">{key}:</span> {value || 'empty'}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Visual Test:</h4>
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
      </CardContent>
    </Card>
  );
}
