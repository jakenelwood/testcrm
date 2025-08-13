'use client';

import { useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { Menu, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { loading, user } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-700">Loading Gonzigo...</p>
        </div>
      </div>
    );
  }

  // If not loading and no user, the middleware will redirect to login
  // This is just an extra safety check
  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {isMobileMenuOpen && (
          <div className="absolute right-0 top-0 -mr-12 pt-2">
            <Button
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
        )}
        <Sidebar />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMobileMenuToggle={toggleMobileMenu} />

        <main className="flex-1 overflow-hidden bg-background transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <DashboardContent>{children}</DashboardContent>
      </SidebarProvider>
    </AuthProvider>
  );
}