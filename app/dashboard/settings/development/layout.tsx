import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Development Tools - Gonzigo CRM",
  description: "Development and debugging tools for Gonzigo CRM",
};

export default function DevelopmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header section with consistent page padding */}
      <div className="flex-shrink-0 p-2 sm:p-4">
        <div className="max-w-screen-2xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="grid gap-1">
              <h1 className="text-2xl font-bold tracking-tight">Development</h1>
              <p className="text-muted-foreground">
                Tools and utilities for development and debugging
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content section with the same padding as Dashboard */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 pt-0">
        <div className="max-w-screen-2xl mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
