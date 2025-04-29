'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FileText,
  LayoutDashboard,
  Settings,
  Users
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname() || '';

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
      iconColor: "text-[#003058]",
      variant: undefined
    },
    {
      label: "Leads",
      icon: FileText,
      href: "/dashboard/leads",
      active: pathname.startsWith("/dashboard/leads"),
      iconColor: "text-[#24605E]",
      variant: undefined
    },
    {
      label: "Clients",
      icon: Users,
      href: "/dashboard/clients",
      active: pathname.startsWith("/dashboard/clients"),
      iconColor: "text-[#B91135]",
      variant: undefined
    }
  ];

  const secondaryRoutes = [
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname.startsWith("/dashboard/settings"),
      iconColor: "text-[#615F48]",
      variant: undefined
    },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white overflow-hidden">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-xl font-bold">
            AICRM
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {routes.map((route, i) => (
            <Button
              key={i}
              asChild
              variant={route.variant || (route.active ? "secondary" : "ghost")}
              className="justify-start"
              size="sm"
            >
              <Link href={route.href}>
                <route.icon className={cn("mr-2 h-4 w-4", route.iconColor)} />
                {route.label}
              </Link>
            </Button>
          ))}
        </nav>
        <nav className="grid gap-1 px-2 mt-4 pt-4 border-t">
          {secondaryRoutes.map((route, i) => (
            <Button
              key={i}
              asChild
              variant={route.active ? "secondary" : "ghost"}
              className="justify-start"
              size="sm"
            >
              <Link href={route.href}>
                <route.icon className={cn("mr-2 h-4 w-4", route.iconColor)} />
                {route.label}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-200" />
          <div>
            <p className="text-sm font-medium">User Name</p>
            <p className="text-xs text-slate-500">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}