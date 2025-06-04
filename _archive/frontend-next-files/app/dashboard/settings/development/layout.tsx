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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Development</h1>
          <p className="text-muted-foreground">
            Tools and utilities for development and debugging
          </p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
