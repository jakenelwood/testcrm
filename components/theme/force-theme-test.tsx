'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ForceThemeTest() {
  const forceApplyTheme = (themeName: string) => {
    console.log(`🔧 Force applying ${themeName} theme...`);

    // Remove any existing data-theme
    document.documentElement.removeAttribute('data-theme');

    // Force set the new theme
    document.documentElement.setAttribute('data-theme', themeName);

    // Force apply the background color directly to body
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
    const fgColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();

    console.log(`🔧 Forcing body styles: bg=${bgColor}, fg=${fgColor}`);
    document.body.style.backgroundColor = bgColor;
    document.body.style.color = fgColor;

    // Log what happened
    console.log('🔧 After force apply:', {
      dataTheme: document.documentElement.getAttribute('data-theme'),
      backgroundVar: bgColor,
      foregroundVar: fgColor,
      bodyBg: document.body.style.backgroundColor,
      bodyColor: document.body.style.color,
    });

    // Force a style recalculation
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
  };

  const testCSSVariables = () => {
    console.log('🧪 Testing CSS Variables...');

    const themes = ['neutral', 'stone', 'zinc', 'gray', 'slate'];

    themes.forEach(theme => {
      document.documentElement.setAttribute('data-theme', theme);
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--background');
      console.log(`Theme ${theme}: --background = "${bg}"`);
    });
  };

  return (
    <Card className="mt-6 border-red-200">
      <CardHeader>
        <CardTitle className="text-sm text-red-600">🔧 Force Theme Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => forceApplyTheme('stone')}
          >
            Force Stone
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => forceApplyTheme('zinc')}
          >
            Force Zinc
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => forceApplyTheme('slate')}
          >
            Force Slate
          </Button>
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={testCSSVariables}
          className="w-full"
        >
          Test All CSS Variables
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            console.log('🔍 Current computed styles:', {
              bodyBg: getComputedStyle(document.body).backgroundColor,
              bodyColor: getComputedStyle(document.body).color,
              htmlBg: getComputedStyle(document.documentElement).backgroundColor,
              htmlColor: getComputedStyle(document.documentElement).color,
              cssVarBg: getComputedStyle(document.documentElement).getPropertyValue('--background'),
              cssVarFg: getComputedStyle(document.documentElement).getPropertyValue('--foreground'),
            });
          }}
          className="w-full"
        >
          Check Current Styles
        </Button>
      </CardContent>
    </Card>
  );
}
