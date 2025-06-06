"use client"

import { useTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect, useState } from "react"

const themes = [
  {
    name: "slate",
    label: "Slate",
    description: "Cool gray with blue undertones",
    category: "Classic"
  },
  {
    name: "stone",
    label: "Stone",
    description: "Warm gray with brown undertones",
    category: "Classic"
  },
  {
    name: "zinc",
    label: "Zinc",
    description: "Neutral gray with subtle blue",
    category: "Classic"
  },
  {
    name: "neutral",
    label: "Neutral",
    description: "Pure gray without color bias",
    category: "Classic"
  },
  {
    name: "gray",
    label: "Gray",
    description: "Classic gray with slight blue tint",
    category: "Classic"
  },
  {
    name: "folk",
    label: "Folk",
    description: "Modern CRM-inspired purple-blue with orange accents",
    category: "Dynamic"
  },
  {
    name: "notion",
    label: "Notion",
    description: "Clean minimal design with blue and purple tones",
    category: "Dynamic"
  },
  {
    name: "ocean",
    label: "Ocean",
    description: "Deep blue-green gradient like ocean depths",
    category: "Dynamic"
  },
  {
    name: "sunset",
    label: "Sunset",
    description: "Warm orange-pink gradient like golden hour",
    category: "Dynamic"
  },
  {
    name: "forest",
    label: "Forest",
    description: "Natural green tones inspired by nature",
    category: "Dynamic"
  },
  {
    name: "midcentury",
    label: "Mid-Century",
    description: "Retro 1950s-60s design with burnt orange and teal",
    category: "Dynamic"
  }
] as const

const accentColors = [
  { name: null, label: "Default", color: "var(--muted)" }, // Use var() directly
  { name: "red", label: "Red", color: "var(--red)" },
  { name: "rose", label: "Rose", color: "var(--rose)" },
  { name: "orange", label: "Orange", color: "var(--orange)" },
  { name: "green", label: "Green", color: "var(--green)" },
  { name: "blue", label: "Blue", color: "var(--blue)" },
  { name: "yellow", label: "Yellow", color: "var(--yellow)" },
  { name: "violet", label: "Violet", color: "var(--violet)" },
] as const;

export function ThemeSelector() {
  const { baseTheme, setBaseTheme, accentColor, setAccentColor } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Color Theme</CardTitle>
          <CardDescription>
            Choose your preferred color theme. This affects the overall color palette of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading theme options...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Theme</CardTitle>
        <CardDescription>
          Choose your preferred color theme. This affects the overall color palette of the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Classic Themes */}
        <div>
          <h3 className="text-lg font-medium mb-4">Classic Themes</h3>
          <RadioGroup
            value={baseTheme}
            onValueChange={(value) => {
              console.log('🎨 Theme selector: changing from', baseTheme, 'to', value)
              setBaseTheme(value as any)
              // Force debug info update
              setTimeout(() => {
                console.log('🎨 After theme change - data-theme:', document.documentElement.getAttribute('data-theme'))
                console.log('🎨 After theme change - classes:', document.documentElement.className)
              }, 100)
            }}
            className="grid grid-cols-1 gap-4"
          >
            {themes.filter(theme => theme.category === "Classic").map((theme) => (
              <div key={theme.name} className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                baseTheme === theme.name
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-transparent hover:border-muted-foreground/20'
              }`}>
                <RadioGroupItem value={theme.name} id={theme.name} />
                <div className="flex-1">
                  <Label htmlFor={theme.name} className={`font-medium ${
                    baseTheme === theme.name ? 'text-primary font-semibold' : ''
                  }`}>
                    {theme.label} {baseTheme === theme.name ? '✓' : ''}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {theme.description}
                  </p>
                </div>
                <div className="flex space-x-1">
                  {/* Theme preview colors */}
                  <div
                    className={`w-8 h-8 rounded-full border-2 ${
                      baseTheme === theme.name ? 'border-primary shadow-lg' : 'border-border'
                    }`}
                    style={{
                      backgroundColor: theme.name === 'slate' ? 'oklch(0.208 0.042 265.755)' :
                                     theme.name === 'stone' ? 'oklch(0.216 0.006 56.043)' :
                                     theme.name === 'zinc' ? 'oklch(0.21 0.006 285.885)' :
                                     theme.name === 'neutral' ? 'oklch(0.205 0 0)' :
                                     'oklch(0.21 0.034 264.665)'
                    }}
                  />
                  <div
                    className={`w-8 h-8 rounded-full border-2 ${
                      baseTheme === theme.name ? 'border-primary shadow-lg' : 'border-border'
                    }`}
                    style={{
                      backgroundColor: theme.name === 'slate' ? 'oklch(0.968 0.007 247.896)' :
                                     theme.name === 'stone' ? 'oklch(0.97 0.001 106.424)' :
                                     theme.name === 'zinc' ? 'oklch(0.967 0.001 286.375)' :
                                     theme.name === 'neutral' ? 'oklch(0.97 0 0)' :
                                     'oklch(0.967 0.003 264.542)'
                    }}
                  />
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Dynamic Themes */}
        <div>
          <h3 className="text-lg font-medium mb-2">🎨 Dynamic Themes</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Modern, vibrant themes inspired by popular design systems and natural elements.
          </p>
          <RadioGroup
            value={baseTheme}
            onValueChange={(value) => {
              console.log('🎨 Theme selector: changing from', baseTheme, 'to', value)
              setBaseTheme(value as any)
              // Force debug info update
              setTimeout(() => {
                console.log('🎨 After theme change - data-theme:', document.documentElement.getAttribute('data-theme'))
                console.log('🎨 After theme change - classes:', document.documentElement.className)
              }, 100)
            }}
            className="grid grid-cols-1 gap-4"
          >
            {themes.filter(theme => theme.category === "Dynamic").map((theme) => (
              <div key={theme.name} className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                baseTheme === theme.name
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-transparent hover:border-muted-foreground/20'
              }`}>
                <RadioGroupItem value={theme.name} id={theme.name} />
                <div className="flex-1">
                  <Label htmlFor={theme.name} className={`font-medium ${
                    baseTheme === theme.name ? 'text-primary font-semibold' : ''
                  }`}>
                    {theme.label} {baseTheme === theme.name ? '✓' : ''}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {theme.description}
                  </p>
                </div>
                <div className="flex space-x-1">
                  {/* Dynamic theme preview colors */}
                  <div
                    className={`w-8 h-8 rounded-full border-2 ${
                      baseTheme === theme.name ? 'border-primary shadow-lg' : 'border-border'
                    }`}
                    style={{
                      backgroundColor: theme.name === 'folk' ? 'oklch(0.45 0.15 260)' :
                                     theme.name === 'notion' ? 'oklch(0.4 0.12 220)' :
                                     theme.name === 'ocean' ? 'oklch(0.5 0.2 200)' :
                                     theme.name === 'sunset' ? 'oklch(0.6 0.25 25)' :
                                     theme.name === 'forest' ? 'oklch(0.45 0.18 140)' :
                                     'oklch(0.55 0.22 35)' // midcentury
                    }}
                  />
                  <div
                    className={`w-8 h-8 rounded-full border-2 ${
                      baseTheme === theme.name ? 'border-primary shadow-lg' : 'border-border'
                    }`}
                    style={{
                      backgroundColor: theme.name === 'folk' ? 'oklch(0.7 0.2 45)' :
                                     theme.name === 'notion' ? 'oklch(0.6 0.15 280)' :
                                     theme.name === 'ocean' ? 'oklch(0.6 0.25 170)' :
                                     theme.name === 'sunset' ? 'oklch(0.65 0.28 350)' :
                                     theme.name === 'forest' ? 'oklch(0.6 0.22 80)' :
                                     'oklch(0.6 0.18 180)' // midcentury teal
                    }}
                  />
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Accent Color Selector */}
        <div className="pt-6">
          <h3 className="text-lg font-medium mb-2">Accent Color</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose an accent color for charts and other highlights. Select 'Default' to use the base theme's accent.
          </p>
          <RadioGroup
            value={accentColor === null ? "null" : accentColor}
            onValueChange={(value) => {
              const newAccent = value === "null" ? null : value as typeof accentColors[number]['name'];
              console.log('🎨 Theme selector: changing accent color from', accentColor, 'to', newAccent)
              setAccentColor(newAccent);
              // Force debug info update
              setTimeout(() => {
                console.log('🎨 After accent change - data-accent-color:', document.documentElement.getAttribute('data-accent-color'))
              }, 100)
            }}
            className="grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-8"
          >
            {accentColors.map((acc) => (
              <Label
                key={acc.name || "default"}
                htmlFor={acc.name || "default-accent"}
                className={`relative flex flex-col items-center justify-center rounded-md border-2 p-3 cursor-pointer transition-all focus:outline-none ${
                  accentColor === acc.name
                    ? "border-primary ring-2 ring-primary shadow-md"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem 
                  value={acc.name === null ? "null" : acc.name} 
                  id={acc.name || "default-accent"} 
                  className="sr-only" 
                />
                <div
                  className="h-8 w-8 rounded-full border border-black/20"
                  style={{ backgroundColor: acc.color }}
                />
                <span className="mt-2 text-xs text-center font-medium">
                  {acc.label}
                </span>
                {accentColor === acc.name && (
                  <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center">
                    <svg className="h-3 w-3 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </Label>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  )
}
