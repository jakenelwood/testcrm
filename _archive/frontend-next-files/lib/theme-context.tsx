"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

export type BaseTheme = 'slate' | 'stone' | 'zinc' | 'neutral' | 'gray' | 'folk' | 'notion' | 'ocean' | 'sunset' | 'forest' | 'midcentury'
export type AccentColor = 'red' | 'rose' | 'orange' | 'green' | 'blue' | 'yellow' | 'violet' | null // Added null for 'default' or no accent

interface ThemeContextType {
  baseTheme: BaseTheme
  setBaseTheme: (theme: BaseTheme) => void
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [baseTheme, setBaseTheme] = useState<BaseTheme>('slate')
  const [accentColor, setAccentColor] = useState<AccentColor>(null) // Initialize with null
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load theme from localStorage
    const savedBaseTheme = localStorage.getItem('base-theme') as BaseTheme
    if (savedBaseTheme && ['slate', 'stone', 'zinc', 'neutral', 'gray', 'folk', 'notion', 'ocean', 'sunset', 'forest', 'midcentury'].includes(savedBaseTheme)) {
      setBaseTheme(savedBaseTheme)
    }
    const savedAccentColor = localStorage.getItem('accent-color') as AccentColor
    if (savedAccentColor === null || ['red', 'rose', 'orange', 'green', 'blue', 'yellow', 'violet'].includes(savedAccentColor)) {
      setAccentColor(savedAccentColor)
    }
  }, [])

  useEffect(() => {
    // Only apply theme after mounting to avoid hydration mismatch
    if (!mounted) return

    const root = document.documentElement

    // Apply base theme
    // Remove all theme data attributes - This might be too aggressive if we only want to change data-theme
    // root.removeAttribute('data-theme') // Let's be more specific
    if (root.getAttribute('data-theme') !== baseTheme) {
      root.setAttribute('data-theme', baseTheme)
    }
    localStorage.setItem('base-theme', baseTheme)

    // Apply accent color
    if (accentColor) {
      root.setAttribute('data-accent-color', accentColor)
      localStorage.setItem('accent-color', accentColor)
    } else {
      root.removeAttribute('data-accent-color')
      localStorage.removeItem('accent-color')
    }
  }, [baseTheme, accentColor, mounted])

  return (
    <ThemeContext.Provider value={{ baseTheme, setBaseTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  )
}
