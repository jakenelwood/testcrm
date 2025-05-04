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
  Settings2,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { fetchPipelines } from "@/utils/pipeline-api";
import { Pipeline } from "@/types/lead";
import { useSidebar } from "@/contexts/sidebar-context";

export function Sidebar() {
  const pathname = usePathname() || '';
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isPipelinesOpen, setIsPipelinesOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const [tempExpanded, setTempExpanded] = useState(false);

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

  // Handle mouse enter - temporarily expand the sidebar
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isCollapsed) {
      setTempExpanded(true);
    }
  };

  // Handle mouse leave - collapse the sidebar if it was temporarily expanded
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (tempExpanded) {
      setTempExpanded(false);
    }
  };

  // Handle toggle button click - permanently toggle the sidebar state
  const handleToggleClick = () => {
    if (isCollapsed) {
      // If expanding, clear temporary state
      setTempExpanded(false);
    }
    setIsCollapsed(!isCollapsed);
  };

  // Determine if we should show the sidebar expanded
  // Either permanently expanded (!isCollapsed) or temporarily expanded (tempExpanded)
  const showExpanded = !isCollapsed || tempExpanded;

  // Determine if we should show text
  const showText = showExpanded;

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-white transition-all duration-300",
        showExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={cn(
        "flex h-14 items-center border-b px-4 justify-between",
        !showExpanded && "justify-center px-2"
      )}>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          {showExpanded ? (
            <span className="text-xl font-bold">AICRM</span>
          ) : (
            <span className="text-xl font-bold">AI</span>
          )}
        </Link>
        {/* Always show the toggle button in a fixed position */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleToggleClick}
        >
          {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1 py-2 overflow-y-auto scrollbar-hide">
        <nav className={cn("grid gap-1", !showExpanded ? "px-1" : "px-2")}>
          {routes.map((route, i) => (
            <Button
              key={i}
              asChild
              variant={route.variant || (route.active ? "secondary" : "ghost")}
              className={cn(
                "justify-start",
                !showExpanded && "justify-center px-0"
              )}
              size="sm"
              title={!showExpanded ? route.label : undefined}
            >
              <Link href={route.href}>
                <route.icon className={cn(
                  "h-4 w-4",
                  route.iconColor,
                  showText ? "mr-2" : "mr-0"
                )} />
                {showText && route.label}
              </Link>
            </Button>
          ))}

          {/* Pipelines Section */}
          <div className="mt-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full",
                showText ? "justify-between" : "justify-center px-0"
              )}
              size="sm"
              onClick={() => setIsPipelinesOpen(!isPipelinesOpen)}
              title={!showExpanded ? "Pipelines" : undefined}
            >
              <div className="flex items-center">
                <FileText className={cn(
                  "h-4 w-4 text-[#24605E]",
                  showText ? "mr-2" : "mr-0"
                )} />
                {showText && <span>Pipelines</span>}
              </div>
              {showText && (isPipelinesOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              ))}
            </Button>

            {isPipelinesOpen && (
              <div className={cn(
                "mt-1 space-y-1",
                showText ? "ml-6" : "ml-0"
              )}>
                <Button
                  asChild
                  variant={pathname === "/pipelines" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    !showExpanded && "justify-center px-0"
                  )}
                  size="sm"
                  title={!showExpanded ? "Manage Pipelines" : undefined}
                >
                  <Link href="/pipelines">
                    <Settings2 className={cn(
                      "h-4 w-4",
                      showText ? "mr-2" : "mr-0"
                    )} />
                    {showText && "Manage Pipelines"}
                  </Link>
                </Button>

                {isLoading ? (
                  <div className={cn(
                    "py-2 text-sm text-muted-foreground",
                    showText ? "px-4" : "px-2 text-center"
                  )}>
                    {showText ? "Loading..." : "..."}
                  </div>
                ) : pipelines.length === 0 ? (
                  <div className={cn(
                    "py-2 text-sm text-muted-foreground",
                    showText ? "px-4" : "px-2 text-center"
                  )}>
                    {showText ? "No pipelines found" : "None"}
                  </div>
                ) : (
                  pipelines.map((pipeline) => (
                    <Button
                      key={pipeline.id}
                      asChild
                      variant={pathname.includes(`pipeline=${pipeline.id}`) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        !showExpanded && "justify-center px-0"
                      )}
                      size="sm"
                      title={!showExpanded ? pipeline.name : undefined}
                    >
                      <Link href={`/leads?pipeline=${pipeline.id}`}>
                        <FileText className={cn(
                          "h-4 w-4",
                          showText ? "mr-2" : "mr-0"
                        )} />
                        {showText && (
                          <>
                            {pipeline.name}
                            {pipeline.is_default && (
                              <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                            )}
                          </>
                        )}
                      </Link>
                    </Button>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>

        <nav className={cn(
          "grid gap-1 mt-4 pt-4 border-t",
          !showExpanded ? "px-1" : "px-2"
        )}>
          {secondaryRoutes.map((route, i) => (
            <Button
              key={i}
              asChild
              variant={route.active ? "secondary" : "ghost"}
              className={cn(
                "justify-start",
                !showExpanded && "justify-center px-0"
              )}
              size="sm"
              title={!showExpanded ? route.label : undefined}
            >
              <Link href={route.href}>
                <route.icon className={cn(
                  "h-4 w-4",
                  route.iconColor,
                  showText ? "mr-2" : "mr-0"
                )} />
                {showText && route.label}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
      <div className={cn(
        "border-t",
        showText ? "p-4" : "p-2"
      )}>
        <div className={cn(
          "flex items-center",
          showText ? "gap-2" : "justify-center"
        )}>
          <div className="h-8 w-8 rounded-full bg-slate-200 flex-shrink-0" />
          {showText && (
            <div>
              <p className="text-sm font-medium">User Name</p>
              <p className="text-xs text-slate-500">user@example.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}