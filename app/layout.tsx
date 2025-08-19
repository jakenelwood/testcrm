import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeProvider as ColorThemeProvider } from "@/lib/theme-context";
import { OpportunityProvider } from "@/contexts/opportunity-context";
import { QueryProvider } from "@/components/providers/query-provider";
import React from "react";
import { brand } from "@/lib/brand";

export const metadata = {
  title: brand.fullTitle,
  description: brand.description,
  keywords: "CRM, AI, sales, pipeline management, lead management, sales automation",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    // Add suppressHydrationWarning to the html tag to fix hydration errors
    <html
      lang="en"
      suppressHydrationWarning
          >
      {/* Add suppressHydrationWarning to the head tag */}
      <head suppressHydrationWarning />
      {/* Add suppressHydrationWarning to the body tag */}
      <body
        className="min-h-screen bg-background font-sans antialiased overflow-x-hidden"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider>
            <OpportunityProvider>
              <QueryProvider>
                <header role="banner" className="sr-only" aria-label="App Header landmark placeholder" />
                <main role="main">
                  {children}
                </main>
                <footer role="contentinfo" className="sr-only" aria-label="App Footer landmark placeholder" />
                <ToastProvider />
              </QueryProvider>
            </OpportunityProvider>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
