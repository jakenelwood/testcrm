'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Menu, Search } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6 shadow-sm">
      <Button
        className="mobile-menu-button"
        variant="ghost"
        size="icon"
        onClick={onMobileMenuToggle}
        aria-label="Toggle mobile menu"
      >
        <Menu className="h-5 w-5 text-muted-foreground hover:text-blue-600 transition-colors" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="w-full flex-1 md:max-w-sm">
        <form>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full bg-muted border-border rounded-lg pl-10 h-10 focus:border-blue-500 focus:ring-blue-500 transition-all md:w-[300px] lg:w-[400px]"
            />
          </div>
        </form>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-blue-50 transition-colors"
            >
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-sm">
                3
              </span>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[320px] p-0 overflow-hidden rounded-lg border border-border shadow-lg">
            <DropdownMenuLabel className="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-border py-3 px-4">
              <span className="font-semibold text-foreground">Notifications</span>
            </DropdownMenuLabel>
            <DropdownMenuGroup className="max-h-[300px] overflow-auto py-2">
              <DropdownMenuItem className="focus:bg-blue-50 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">New quote request</p>
                    <p className="text-xs text-muted-foreground">2 min ago</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    John Smith submitted a new auto quote request
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-blue-50 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Quote completed</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Emma Johnson&apos;s home quote has been approved
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-blue-50 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">System update</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The quote generator has been updated to version 1.2.0
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-center py-3 focus:bg-blue-50 text-blue-600 hover:text-blue-700">
              <span className="text-xs font-medium">View all notifications</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add Logout Button */}
        <LogoutButton />
      </div>
    </header>
  );
}
