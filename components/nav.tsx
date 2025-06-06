import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MainNav() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="font-bold text-xl">
            Quote Generator
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/auto" className="text-sm font-medium hover:text-primary">
              Auto Insurance
            </Link>
            <Link href="/home" className="text-sm font-medium hover:text-primary">
              Home Insurance
            </Link>
            <Link href="/specialty" className="text-sm font-medium hover:text-primary">
              Specialty Insurance
            </Link>
            <Link href="/quotes" className="text-sm font-medium hover:text-primary">
              My Quotes
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            Log In
          </Button>
          <Button size="sm">
            Sign Up
          </Button>
        </div>
      </div>
    </nav>
  );
} 