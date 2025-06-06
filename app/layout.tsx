import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeProvider as ColorThemeProvider } from "@/lib/theme-context";
import { PipelineProvider } from "@/contexts/pipeline-context";
import React from "react";
import { inter } from "./fonts";
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
      className={`${inter.variable}`}
    >
      {/* Add suppressHydrationWarning to the head tag */}
      <head suppressHydrationWarning />
      {/* Add suppressHydrationWarning to the body tag */}
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider>
            <PipelineProvider>
              {children}
              <ToastProvider />
            </PipelineProvider>
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
