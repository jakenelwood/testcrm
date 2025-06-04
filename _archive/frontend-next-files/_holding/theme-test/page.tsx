"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeSelector } from "@/components/theme-selector"
import { ThemeTest } from "@/components/theme/theme-test"
import { ThemeDebug } from "@/components/theme/theme-debug"
import { useTheme } from "@/lib/theme-context"
import { useTheme as useNextTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeTestPage() {
  const { baseTheme } = useTheme()
  const { theme } = useNextTheme()
  const [mounted, setMounted] = useState(false)
  const [diagnostics, setDiagnostics] = useState<any>({})

  useEffect(() => {
    setMounted(true)
    
    // Diagnostic check
    const updateDiagnostics = () => {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      
      setDiagnostics({
        dataTheme: root.getAttribute('data-theme'),
        htmlClasses: root.className,
        primaryVar: computedStyle.getPropertyValue('--primary').trim(),
        backgroundVar: computedStyle.getPropertyValue('--background').trim(),
        borderVar: computedStyle.getPropertyValue('--border').trim(),
        // Test if Tailwind classes resolve correctly
        primaryColor: getComputedStyle(document.createElement('div')).getPropertyValue('background-color'),
      })
    }
    
    updateDiagnostics()
    
    // Update when theme changes
    const observer = new MutationObserver(updateDiagnostics)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    })
    
    return () => observer.disconnect()
  }, [baseTheme])

  if (!mounted) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Theme Test Page</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Theme Test Page</h1>
        <p className="text-muted-foreground">
          Current base theme: <span className="font-mono bg-muted px-2 py-1 rounded">{baseTheme}</span>
        </p>
        <p className="text-muted-foreground">
          Current dark/light mode: <span className="font-mono bg-muted px-2 py-1 rounded">{theme}</span>
        </p>
      </div>

      {/* Diagnostic Information */}
      <Card className="border-red-500 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">🔧 CSS Diagnostics</CardTitle>
          <CardDescription className="text-red-600">
            Debug information to identify why colors aren't working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="font-mono text-xs space-y-1">
            <p><strong>data-theme:</strong> {diagnostics.dataTheme || 'none'}</p>
            <p><strong>HTML classes:</strong> {diagnostics.htmlClasses || 'none'}</p>
            <p><strong>--primary value:</strong> {diagnostics.primaryVar || 'empty'}</p>
            <p><strong>--background value:</strong> {diagnostics.backgroundVar || 'empty'}</p>
            <p><strong>--border value:</strong> {diagnostics.borderVar || 'empty'}</p>
          </div>
          
          {/* OKLCH Test - Direct hardcoded colors */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">OKLCH Direct Test (hardcoded):</h4>
            <div className="grid grid-cols-4 gap-2">
              <div 
                className="h-16 border-2 rounded p-1"
                style={{ backgroundColor: 'oklch(0.5 0.2 30)' }}
              >
                <span className="text-xs text-white">oklch(0.5 0.2 30)</span>
              </div>
              <div 
                className="h-16 border-2 rounded p-1"
                style={{ backgroundColor: 'oklch(0.7 0.15 120)' }}
              >
                <span className="text-xs text-white">oklch(0.7 0.15 120)</span>
              </div>
              <div 
                className="h-16 border-2 rounded p-1"
                style={{ backgroundColor: 'oklch(0.8 0.1 240)' }}
              >
                <span className="text-xs text-white">oklch(0.8 0.1 240)</span>
              </div>
              <div 
                className="h-16 border-2 rounded p-1"
                style={{ backgroundColor: 'oklch(0.6 0.25 300)' }}
              >
                <span className="text-xs text-white">oklch(0.6 0.25 300)</span>
              </div>
            </div>
          </div>
          
          {/* Direct CSS Variable Test */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Direct CSS Variable Test:</h4>
            <div className="grid grid-cols-4 gap-2">
              <div 
                className="h-16 border-2 rounded"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <span className="text-xs">var(--primary)</span>
              </div>
              <div 
                className="h-16 border-2 rounded"
                style={{ backgroundColor: 'var(--secondary)' }}
              >
                <span className="text-xs">var(--secondary)</span>
              </div>
              <div 
                className="h-16 border-2 rounded"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <span className="text-xs">var(--muted)</span>
              </div>
              <div 
                className="h-16 border-2 rounded"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <span className="text-xs">var(--accent)</span>
              </div>
            </div>
          </div>
          
          {/* Tailwind Class Test */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Tailwind Class Test:</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="h-16 bg-primary border-2 rounded">
                <span className="text-xs text-primary-foreground">bg-primary</span>
              </div>
              <div className="h-16 bg-secondary border-2 rounded">
                <span className="text-xs text-secondary-foreground">bg-secondary</span>
              </div>
              <div className="h-16 bg-muted border-2 rounded">
                <span className="text-xs text-muted-foreground">bg-muted</span>
              </div>
              <div className="h-16 bg-accent border-2 rounded">
                <span className="text-xs text-accent-foreground">bg-accent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixed Theme Test Component */}
      <ThemeTest />

      {/* Fixed Theme Debug Component */}
      <ThemeDebug />

      {/* Theme Selector */}
      <ThemeSelector />

      {/* Manual Theme Testing */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Manual Theme Testing</CardTitle>
          <CardDescription>
            Force apply themes to test if CSS is working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                document.documentElement.setAttribute('data-theme', 'slate')
                console.log('Applied slate theme')
              }}
            >
              Force Slate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                document.documentElement.setAttribute('data-theme', 'stone')
                console.log('Applied stone theme')
              }}
            >
              Force Stone
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                document.documentElement.setAttribute('data-theme', 'zinc')
                console.log('Applied zinc theme')
              }}
            >
              Force Zinc
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                document.documentElement.setAttribute('data-theme', 'neutral')
                console.log('Applied neutral theme')
              }}
            >
              Force Neutral
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                document.documentElement.setAttribute('data-theme', 'gray')
                console.log('Applied gray theme')
              }}
            >
              Force Gray
            </Button>
          </div>
          
          {/* New Dynamic Themes */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-sm">🎨 Dynamic Themes:</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  document.documentElement.setAttribute('data-theme', 'folk')
                  console.log('Applied folk theme')
                }}
                className="bg-gradient-to-r from-purple-500 to-orange-500 text-white border-0"
              >
                Folk CRM
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  document.documentElement.setAttribute('data-theme', 'notion')
                  console.log('Applied notion theme')
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0"
              >
                Notion
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  document.documentElement.setAttribute('data-theme', 'ocean')
                  console.log('Applied ocean theme')
                }}
                className="bg-gradient-to-r from-blue-500 to-teal-500 text-white border-0"
              >
                Ocean
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  document.documentElement.setAttribute('data-theme', 'sunset')
                  console.log('Applied sunset theme')
                }}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0"
              >
                Sunset
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  document.documentElement.setAttribute('data-theme', 'forest')
                  console.log('Applied forest theme')
                }}
                className="bg-gradient-to-r from-green-600 to-green-400 text-white border-0"
              >
                Forest
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  document.documentElement.setAttribute('data-theme', 'midcentury')
                  console.log('Applied midcentury theme')
                }}
                className="bg-gradient-to-r from-orange-600 to-teal-500 text-white border-0"
              >
                Mid-Century
              </Button>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                document.documentElement.removeAttribute('data-theme')
                console.log('Removed data-theme (using :root)')
              }}
            >
              Remove data-theme
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            These buttons directly modify the HTML data-theme attribute. Check the debug info above to see changes.
          </p>
        </CardContent>
      </Card>

      {/* Color Palette Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>Preview of the current theme colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-primary rounded-md border-2 border-border"></div>
              <p className="text-sm font-medium">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-secondary rounded-md border-2 border-border"></div>
              <p className="text-sm font-medium">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-accent rounded-md border-2 border-border"></div>
              <p className="text-sm font-medium">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-muted rounded-md border-2 border-border"></div>
              <p className="text-sm font-medium">Muted</p>
            </div>
          </div>

          {/* Border and Background Test */}
          <div className="mt-6 p-4 border-2 border-border rounded-lg bg-card">
            <h4 className="font-semibold mb-2">Border & Background Test</h4>
            <p className="text-card-foreground">This card shows border and background colors.</p>
            <div className="mt-2 p-2 bg-muted rounded border border-border">
              <p className="text-muted-foreground text-sm">Muted background with border</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Button Examples</CardTitle>
          <CardDescription>Different button variants with current theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Accent Color Buttons</h4>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-red text-red-foreground hover:bg-red/90">Red</Button>
                <Button className="bg-rose text-rose-foreground hover:bg-rose/90">Rose</Button>
                <Button className="bg-orange text-orange-foreground hover:bg-orange/90">Orange</Button>
                <Button className="bg-green text-green-foreground hover:bg-green/90">Green</Button>
                <Button className="bg-blue text-blue-foreground hover:bg-blue/90">Blue</Button>
                <Button className="bg-yellow text-yellow-foreground hover:bg-yellow/90">Yellow</Button>
                <Button className="bg-violet text-violet-foreground hover:bg-violet/90">Violet</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Comparison</CardTitle>
          <CardDescription>Expected differences between themes (for debugging)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Classic Themes:</h4>
                <ul className="space-y-1 text-xs">
                  <li><strong>Slate:</strong> Cool blue-gray undertones - oklch(0.208 0.042 265.755)</li>
                  <li><strong>Stone:</strong> Warm brown undertones - oklch(0.216 0.006 56.043)</li>
                  <li><strong>Zinc:</strong> Neutral gray with subtle blue - oklch(0.21 0.006 285.885)</li>
                  <li><strong>Neutral:</strong> Pure gray without bias - oklch(0.205 0 0)</li>
                  <li><strong>Gray:</strong> Classic gray with blue tint - oklch(0.21 0.034 264.665)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Dynamic Themes:</h4>
                <ul className="space-y-1 text-xs">
                  <li><strong>Folk:</strong> Purple-blue primary with orange accent - Modern CRM inspired</li>
                  <li><strong>Notion:</strong> Clean blue with purple accents - Minimal design</li>
                  <li><strong>Ocean:</strong> Deep blue-green gradient - Ocean depths</li>
                  <li><strong>Sunset:</strong> Warm orange-pink gradient - Golden hour</li>
                  <li><strong>Forest:</strong> Natural green tones - Nature inspired</li>
                  <li><strong>Mid-Century:</strong> Burnt orange & teal - Retro 1950s-60s design</li>
                </ul>
              </div>
            </div>
            
            {baseTheme === 'midcentury' && (
              <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-teal-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold mb-2 text-orange-800">🎨 Mid-Century Modern Theme Active</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-medium text-orange-700 mb-1">Design Philosophy:</p>
                    <ul className="space-y-1 text-orange-600">
                      <li>• Inspired by 1950s-60s design movement</li>
                      <li>• Warm earth tones with rich browns and creams</li>
                      <li>• Bold accent colors: burnt orange, teal, mustard</li>
                      <li>• Clean, geometric aesthetic</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-teal-700 mb-1">Color Palette:</p>
                    <ul className="space-y-1 text-teal-600">
                      <li>• Primary: Burnt orange oklch(0.55 0.22 35)</li>
                      <li>• Accent: Teal oklch(0.6 0.18 180)</li>
                      <li>• Background: Warm cream oklch(0.96 0.015 60)</li>
                      <li>• Perfect for professional, retro-modern feel</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accent Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Colors</CardTitle>
          <CardDescription>Full range of accent colors for charts and highlights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">How Accent Colors Work:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Each theme has its own default chart color palette</li>
                <li>• Selecting an accent color overrides ALL chart colors with that single color</li>
                <li>• Accent colors are globally defined and work across all themes</li>
                <li>• Use accent colors for consistent branding or monochromatic charts</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="space-y-2">
                <div className="w-full h-16 bg-red rounded-md border border-border"></div>
                <p className="text-sm font-medium">Red</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-rose rounded-md border border-border"></div>
                <p className="text-sm font-medium">Rose</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-orange rounded-md border border-border"></div>
                <p className="text-sm font-medium">Orange</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-green rounded-md border border-border"></div>
                <p className="text-sm font-medium">Green</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-blue rounded-md border border-border"></div>
                <p className="text-sm font-medium">Blue</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-yellow rounded-md border border-border"></div>
                <p className="text-sm font-medium">Yellow</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-violet rounded-md border border-border"></div>
                <p className="text-sm font-medium">Violet</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Chart Colors</CardTitle>
          <CardDescription>Chart color palette for data visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Chart Colors (with accent override if active) */}
            <div>
              <h4 className="text-sm font-medium mb-3">Current Chart Colors (Active)</h4>
              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className={`w-full h-16 bg-chart-${i} rounded-md border border-border`}></div>
                    <p className="text-sm font-medium">Chart {i}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Theme's Default Chart Colors (without accent override) */}
            <div>
              <h4 className="text-sm font-medium mb-3">Theme's Default Chart Palette</h4>
              <p className="text-xs text-muted-foreground mb-3">
                These are the chart colors defined by the current theme (before accent color override)
              </p>
              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div 
                      className="w-full h-16 rounded-md border border-border"
                      style={{ 
                        backgroundColor: `var(--chart-${i})`,
                        // Force the theme's original chart color by reading directly from CSS
                      }}
                    ></div>
                    <p className="text-sm font-medium">Chart {i}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Text colors and styles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-foreground">Foreground text</p>
            <p className="text-muted-foreground">Muted foreground text</p>
            <p className="text-primary">Primary text</p>
            <p className="text-secondary-foreground">Secondary text</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
