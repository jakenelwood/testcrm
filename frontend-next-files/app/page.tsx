import Hero from '@/components/landing/hero';
import Features from '@/components/landing/features';
import CTA from '@/components/landing/cta';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import GonzigoBrand from '@/components/gonzigo-brand';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="container mx-auto py-6 flex justify-between items-center">
        <Link href="/">
          <GonzigoBrand size="lg" className="h-10 flex items-center" />
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/auth/login">
            <Button variant="outline" className="font-medium border-gray-300">Log In</Button>
          </Link>
          <Link href="/pricing">
            <Button className="bg-[#0047AB] hover:bg-[#003d91] text-white font-medium">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>

      {/* Footer */}
      <footer className="container mx-auto py-12 text-center text-gray-500">
        <div className="mb-6">
          <div className="flex justify-center mb-3">
            <GonzigoBrand size="md" showTagline={true} className="items-center text-center" />
          </div>
        </div>
        <div className="flex justify-center gap-8 mb-8">
          <Link href="/auth/login" className="hover:text-blue-600 transition-colors">Log In</Link>
          <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link>
        </div>
        <div>© {new Date().getFullYear()} Gonzigo. All rights reserved.</div>
      </footer>
    </div>
  );
}
