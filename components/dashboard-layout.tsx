'use client';

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Home,
  Settings,
  User,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  FilePlus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Quotes",
    href: "/dashboard/quotes",
    icon: FileText,
  },
  {
    title: "New Lead",
    href: "/dashboard/new",
    icon: FilePlus,
  },
  {
    title: "Clients",
    href: "/dashboard/clients",
    icon: User,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
              <span className="sr-only">Toggle Menu</span>
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <span className="font-bold">Quote Request Generator</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-foreground"
            >
              <Link href="/logout">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Log out</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside
          className={cn(
            "fixed top-16 z-30 h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r bg-background md:sticky md:block",
            isMobileMenuOpen ? "block" : "hidden"
          )}
        >
          <nav className="grid items-start px-4 py-6 md:px-6">
            <div className="grid gap-2">
              {sidebarNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={
                    router.pathname === item.href ||
                    (item.href !== "/dashboard" && router.pathname.startsWith(item.href))
                      ? "secondary"
                      : "ghost"
                  }
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              ))}
            </div>
          </nav>
        </aside>
        <main className="relative py-6 px-4 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
