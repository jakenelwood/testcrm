'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Settings2
} from "lucide-react";
import { fetchPipelines } from "@/utils/pipeline-api";
import { Pipeline } from "@/types/lead";

export function Sidebar() {
  const pathname = usePathname() || '';
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isPipelinesOpen, setIsPipelinesOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pipelines on component mount
  useEffect(() => {
    const loadPipelines = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPipelines();
        setPipelines(data);
      } catch (error) {
        console.error('Error loading pipelines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPipelines();
  }, []);

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

          {/* Pipelines Section */}
          <div className="mt-2">
            <Button
              variant="ghost"
              className="w-full justify-between"
              size="sm"
              onClick={() => setIsPipelinesOpen(!isPipelinesOpen)}
            >
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-[#24605E]" />
                <span>Pipelines</span>
              </div>
              {isPipelinesOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {isPipelinesOpen && (
              <div className="ml-6 mt-1 space-y-1">
                <Button
                  asChild
                  variant={pathname === "/pipelines" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  size="sm"
                >
                  <Link href="/pipelines">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Manage Pipelines
                  </Link>
                </Button>

                {isLoading ? (
                  <div className="py-2 px-4 text-sm text-muted-foreground">Loading...</div>
                ) : pipelines.length === 0 ? (
                  <div className="py-2 px-4 text-sm text-muted-foreground">No pipelines found</div>
                ) : (
                  pipelines.map((pipeline) => (
                    <Button
                      key={pipeline.id}
                      asChild
                      variant={pathname === `/leads?pipeline=${pipeline.id}` ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Link href={`/leads?pipeline=${pipeline.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        {pipeline.name}
                        {pipeline.is_default && (
                          <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                        )}
                      </Link>
                    </Button>
                  ))
                )}
              </div>
            )}
          </div>
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