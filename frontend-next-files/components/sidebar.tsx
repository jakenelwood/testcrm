'use client';

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/user-profile";
import { useLogout } from "@/utils/auth";
import TextLogo from "@/components/text-logo";
import RTextLogo from "@/components/r-text-logo";
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
  ChevronsRight,
  LogOut,
  ChevronLeft,
  Phone,
  MessageSquare
} from "lucide-react";
import { fetchPipelines } from "@/utils/pipeline-api";
import { Pipeline } from "@/types/lead";
import { useSidebar } from "@/contexts/sidebar-context";

function SidebarContent() {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isPipelinesOpen, setIsPipelinesOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const [tempExpanded, setTempExpanded] = useState(false);
  const logout = useLogout();

  // Get the current pipeline ID from search params
  const currentPipelineId = searchParams?.get('pipeline');

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

    // Initialize Development section to be expanded by default
    if (localStorage.getItem('expanded-Development') === null) {
      localStorage.setItem('expanded-Development', 'true');
    }
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
    },
    {
      label: "Telephony",
      icon: Phone,
      href: "/dashboard/telephony",
      active: pathname.startsWith("/dashboard/telephony") || 
             pathname.startsWith("/dashboard/settings/development/telephony") ||
             pathname.startsWith("/dashboard/settings/development/ringcentral"),
      iconColor: "text-[#0047AB]",
      variant: undefined
    }
  ];

  const secondaryRoutes = [
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname.startsWith("/dashboard/settings") && !pathname.startsWith("/dashboard/settings/development"),
      iconColor: "text-[#615F48]",
      variant: undefined
    },
    {
      label: "Development",
      icon: Settings2,
      href: "/dashboard/settings/development",
      active: pathname.startsWith("/dashboard/settings/development"),
      iconColor: "text-[#0047AB]",
      variant: undefined,
      children: [
        {
          label: "Telephony/SMS",
          href: "/dashboard/settings/development/telephony",
          active: pathname.startsWith("/dashboard/settings/development/telephony"),
          children: [
            {
              label: "RingCentral",
              href: "/dashboard/settings/development/telephony/ringcentral",
              active: pathname.startsWith("/dashboard/settings/development/telephony/ringcentral") ||
                     pathname === "/dashboard/settings/development/ringcentral-test-call" ||
                     pathname === "/dashboard/settings/development/ringout-demo" ||
                     pathname === "/dashboard/settings/development/ringcentral-diagnostics" ||
                     pathname === "/dashboard/settings/development/supabase-test" ||
                     pathname === "/dashboard/settings/development/auth-test",
              children: [
                {
                  label: "Test Call",
                  href: "/dashboard/settings/development/ringcentral-test-call",
                  active: pathname === "/dashboard/settings/development/ringcentral-test-call",
                },
                {
                  label: "Test SMS",
                  href: "/dashboard/settings/development/ringcentral-test-sms",
                  active: pathname === "/dashboard/settings/development/ringcentral-test-sms",
                },
                {
                  label: "RingOut Demo",
                  href: "/dashboard/settings/development/ringout-demo",
                  active: pathname === "/dashboard/settings/development/ringout-demo",
                },
                {
                  label: "Diagnostics",
                  href: "/dashboard/settings/development/ringcentral-diagnostics",
                  active: pathname === "/dashboard/settings/development/ringcentral-diagnostics",
                },
                {
                  label: "Database Test",
                  href: "/dashboard/settings/development/supabase-test",
                  active: pathname === "/dashboard/settings/development/supabase-test",
                },
                {
                  label: "Auth Test",
                  href: "/dashboard/settings/development/auth-test",
                  active: pathname === "/dashboard/settings/development/auth-test",
                }
              ]
            },
            {
              label: "Twilio",
              href: "/dashboard/settings/development/telephony/twilio",
              active: pathname.startsWith("/dashboard/settings/development/telephony/twilio"),
              children: []
            },
            {
              label: "Telnyx",
              href: "/dashboard/settings/development/telephony/telnyx",
              active: pathname.startsWith("/dashboard/settings/development/telephony/telnyx"),
              children: []
            }
          ]
        },
        {
          label: "Design",
          href: "/dashboard/settings/development/design",
          active: pathname.startsWith("/dashboard/settings/development/design") || pathname === "/theme-test",
          children: [
            {
              label: "Theme Test",
              href: "/theme-test",
              active: pathname === "/theme-test",
            }
          ]
        }
      ]
    },
    {
      label: "Logout",
      icon: LogOut,
      href: "#",
      active: false,
      iconColor: "text-red-500",
      variant: undefined,
      onClick: async () => {
        try {
          await logout();
        } catch (error) {
          console.error('Error in sidebar logout:', error);
          // Fallback direct navigation if the hook fails
          window.location.href = '/auth/login';
        }
      }
    }
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
    // Removed console.log to clean up code
  };

  // Determine if we should show the sidebar expanded
  // Either permanently expanded (!isCollapsed) or temporarily expanded (tempExpanded)
  const showExpanded = !isCollapsed || tempExpanded;

  // Determine if we should show text
  const showText = showExpanded;

  return (
    <div
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out border-r",
        "bg-sidebar text-sidebar-foreground border-sidebar-border",
        showExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-4 border-b border-sidebar-border",
        !showExpanded && "justify-center px-2"
      )}>
        {showText && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">CRM</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleClick}
          className="h-8 w-8 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          title={showExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {showExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1 py-4 overflow-y-auto scrollbar-hide">
        <nav className={cn(
          "grid gap-2 p-2",
          !showExpanded && "px-1"
        )}>
          {routes.map((route, i) => (
            <Button
              key={i}
              asChild
              variant={route.active ? "secondary" : "ghost"}
              className={cn(
                "justify-start transition-all duration-200 w-full",
                route.active 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !showExpanded && "justify-center px-0"
              )}
              size="sm"
              title={!showExpanded ? route.label : undefined}
            >
              <Link href={route.href}>
                <route.icon className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  route.active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground",
                  showText ? "mr-2" : "mr-0"
                )} />
                {showText && (
                  <span className={cn(
                    "font-medium",
                    route.active ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"
                  )}>
                    {route.label}
                  </span>
                )}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Pipelines Section */}
        <div className={cn(
          "mt-6 pt-6 border-t border-sidebar-border",
          !showExpanded ? "px-1" : "px-2"
        )}>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !showExpanded && "justify-center px-0"
              )}
              size="sm"
              onClick={() => setIsPipelinesOpen(!isPipelinesOpen)}
              title={!showExpanded ? "Pipelines" : undefined}
            >
              <FileText className={cn(
                "h-4 w-4 text-sidebar-foreground",
                showText ? "mr-2" : "mr-0"
              )} />
              {showText && (
                <>
                  <span className="font-medium text-sidebar-foreground">Pipelines</span>
                  {isPipelinesOpen ? (
                    <ChevronDown className="ml-auto h-4 w-4 text-sidebar-foreground" />
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4 text-sidebar-foreground" />
                  )}
                </>
              )}
            </Button>

            {isPipelinesOpen && showExpanded && (
              <div className="ml-4 space-y-1">
                {isLoading ? (
                  <div className={cn(
                    "py-2 text-sm text-sidebar-foreground/70",
                    showText ? "px-4" : "px-2 text-center"
                  )}>
                    {showText ? "Loading..." : "..."}
                  </div>
                ) : pipelines.length === 0 ? (
                  <div className={cn(
                    "py-2 text-sm text-sidebar-foreground/70",
                    showText ? "px-4" : "px-2 text-center"
                  )}>
                    {showText ? "No pipelines found" : "None"}
                  </div>
                ) : (
                  pipelines.map((pipeline) => {
                    const isPipelineActive = pathname.startsWith("/dashboard/leads") && currentPipelineId === pipeline.id.toString();
                    return (
                      <Button
                        key={pipeline.id}
                        asChild
                        variant={isPipelineActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isPipelineActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          !showExpanded && "justify-center px-0"
                        )}
                        size="sm"
                        title={!showExpanded ? pipeline.name : undefined}
                      >
                        <Link href={`/dashboard/leads?pipeline=${pipeline.id}`}>
                          <FileText className={cn(
                            "h-4 w-4",
                            isPipelineActive
                              ? "text-sidebar-primary-foreground"
                              : "text-sidebar-foreground",
                            showText ? "mr-2" : "mr-0"
                          )} />
                          {showText && (
                            <>
                              <span className={cn(
                                isPipelineActive
                                  ? "text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground"
                              )}>
                                {pipeline.name}
                              </span>
                              {pipeline.is_default && (
                                <span className="ml-2 text-xs opacity-70">(Default)</span>
                              )}
                            </>
                          )}
                        </Link>
                      </Button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Settings Section */}
        <div className={cn(
          "mt-6 pt-6 border-t border-sidebar-border",
          !showExpanded ? "px-1" : "px-2"
        )}>
          <Button
            asChild
            variant={pathname === "/dashboard/settings" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-all duration-200",
              pathname === "/dashboard/settings"
                ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              !showExpanded && "justify-center px-0"
            )}
            size="sm"
            title={!showExpanded ? "Settings" : undefined}
          >
            <Link href="/dashboard/settings">
              <Settings className={cn(
                "h-4 w-4 transition-transform duration-200",
                pathname === "/dashboard/settings" ? "text-sidebar-primary-foreground" : "text-sidebar-foreground",
                showText ? "mr-2" : "mr-0"
              )} />
              {showText && (
                <span className={cn(
                  "font-medium",
                  pathname === "/dashboard/settings" ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"
                )}>
                  Settings
                </span>
              )}
            </Link>
          </Button>
        </div>

        {/* Development Section */}
        <div className={cn(
          "mt-6 pt-6 border-t border-sidebar-border",
          !showExpanded ? "px-1" : "px-2"
        )}>
          <div className="space-y-2">
            <Button
              asChild
              variant={pathname.startsWith("/dashboard/settings/development") ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200",
                pathname.startsWith("/dashboard/settings/development")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !showExpanded && "justify-center px-0"
              )}
              size="sm"
              title={!showExpanded ? "Development" : undefined}
            >
              <Link href="/dashboard/settings/development">
                <Settings2 className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  pathname.startsWith("/dashboard/settings/development") ? "text-sidebar-primary-foreground" : "text-sidebar-foreground",
                  showText ? "mr-2" : "mr-0"
                )} />
                {showText && (
                  <span className={cn(
                    "font-medium",
                    pathname.startsWith("/dashboard/settings/development") ? "text-sidebar-primary-foreground font-semibold" : "text-sidebar-foreground"
                  )}>
                    Development
                  </span>
                )}
              </Link>
            </Button>

            {/* Development Subsections */}
            {showExpanded && pathname.startsWith("/dashboard/settings/development") && (
              <div className="ml-4 space-y-1">
                {/* Telephony/SMS Section */}
                <div className="space-y-1">
                  <Button
                    asChild
                    variant={pathname.startsWith("/dashboard/settings/development/telephony") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-sm",
                      pathname.startsWith("/dashboard/settings/development/telephony")
                        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    size="sm"
                  >
                    <Link href="/dashboard/settings/development/telephony">
                      <Phone className={cn(
                        "h-3 w-3 mr-2",
                        pathname.startsWith("/dashboard/settings/development/telephony") ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
                      )} />
                      <span className={cn(
                        pathname.startsWith("/dashboard/settings/development/telephony") ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
                      )}>
                        Telephony/SMS
                      </span>
                    </Link>
                  </Button>

                  {/* RingCentral Tests */}
                  {pathname.startsWith("/dashboard/settings/development/telephony") && (
                    <div className="ml-4 space-y-1">
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start text-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        size="sm"
                      >
                        <Link href="/dashboard/settings/development/ringcentral-test-call">
                          <Phone className="h-3 w-3 mr-2 text-sidebar-foreground" />
                          <span className="text-sidebar-foreground">Test Call</span>
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start text-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        size="sm"
                      >
                        <Link href="/dashboard/settings/development/ringcentral-test-sms">
                          <MessageSquare className="h-3 w-3 mr-2 text-sidebar-foreground" />
                          <span className="text-sidebar-foreground">Test SMS</span>
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start text-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        size="sm"
                      >
                        <Link href="/dashboard/settings/development/ringout-demo">
                          <Phone className="h-3 w-3 mr-2 text-sidebar-foreground" />
                          <span className="text-sidebar-foreground">RingOut Demo</span>
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start text-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        size="sm"
                      >
                        <Link href="/dashboard/settings/development/ringcentral-diagnostics">
                          <Settings2 className="h-3 w-3 mr-2 text-sidebar-foreground" />
                          <span className="text-sidebar-foreground">Diagnostics</span>
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Design Section */}
                <div className="space-y-1">
                  <Button
                    asChild
                    variant={pathname === "/theme-test" ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-sm",
                      pathname === "/theme-test"
                        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    size="sm"
                  >
                    <Link href="/theme-test">
                      <Settings2 className={cn(
                        "h-3 w-3 mr-2",
                        pathname === "/theme-test" ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
                      )} />
                      <span className={cn(
                        pathname === "/theme-test" ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
                      )}>
                        Theme Test
                      </span>
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className={cn(
          "mt-auto pt-6 border-t border-sidebar-border",
          !showExpanded ? "px-1" : "px-2"
        )}>
          <div className="space-y-2">
            {showExpanded ? (
              <UserProfile />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                title="User Profile"
              >
                <div className="w-6 h-6 bg-sidebar-primary rounded-full flex items-center justify-center">
                  <span className="text-sidebar-primary-foreground text-xs font-medium">U</span>
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SidebarContent />
    </Suspense>
  );
}