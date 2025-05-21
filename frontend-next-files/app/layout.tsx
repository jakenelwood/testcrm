import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import React from "react";
import { inter } from "./fonts";

export const metadata = {
  title: "Ronrico | The Pipeline Whisperer",
  description: "The AI-powered CRM that thinks like a closer. Ronrico listens, remembers, and nudges at just the right time.",
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
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
