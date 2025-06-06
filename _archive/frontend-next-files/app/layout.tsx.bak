import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import React from "react";

export const metadata = {
  title: "AICRM",
  description: "AI-powered CRM for insurance lead management",
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
        <Toaster />
      </body>
    </html>
  );
}
