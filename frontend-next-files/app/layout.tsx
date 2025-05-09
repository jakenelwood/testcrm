import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import React from "react";

export const metadata = {
  title: "Gonzigo | The Pipeline Whisperer",
  description: "The AI-powered CRM that thinks like a closer. Gonzigo listens, remembers, and nudges at just the right time.",
  keywords: "CRM, AI, sales, pipeline management, lead management, sales automation",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning />
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
