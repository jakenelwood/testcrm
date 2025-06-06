import Hero from '@/components/landing/hero';
import Features from '@/components/landing/features';
import CTA from '@/components/landing/cta';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import BrandLogo from '@/components/brand-logo';
import { brand } from '@/lib/brand';
import GLogoButton from '@/components/g-logo-button';
import { ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <nav className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <Link href="/">
              <GLogoButton size="lg" />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-1 text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                <span>Features</span>
                <ChevronDown size={16} />
              </div>
              <div className="flex items-center gap-1 text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                <span>Solutions</span>
                <ChevronDown size={16} />
              </div>
              <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </Link>
              <div className="flex items-center gap-1 text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                <span>Resources</span>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="outline" className="font-medium rounded-sm">Log In</Button>
            </Link>
            <Link href="/pricing">
              <Button className="font-medium rounded-sm">Let's Close</Button>
            </Link>
          </div>
        </nav>
      </header>
      <div className="h-16"></div> {/* Spacer for fixed header */}

      {/* Main content */}
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-20 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Link href="/">
                  <GLogoButton size="lg" />
                </Link>
              </div>
              <p className="text-muted-foreground mb-8 max-w-md">
                Be unstoppable with the intelligent, proactive CRM that helps you close more deals.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground">Product</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Integrations</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Changelog</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Roadmap</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground">Resources</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Community</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Webinars</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Partners</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground">Company</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">About</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground mb-4 md:mb-0">{brand.copyrightText}</div>
            <div className="flex gap-6">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
