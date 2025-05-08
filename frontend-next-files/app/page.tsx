import Hero from '@/components/landing/hero';
import Features from '@/components/landing/features';
import CTA from '@/components/landing/cta';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="container mx-auto py-6 flex justify-between items-center">
        <div className="text-2xl font-bold">Gonzigo</div>
        <div className="flex gap-4 items-center">
          <Link href="/auth/login">
            <Button variant="ghost" className="font-medium">Log in</Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">Get Started</Button>
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
          <div className="text-xl font-bold mb-2">Gonzigo</div>
          <p>The Pipeline Whisperer</p>
        </div>
        <div className="flex justify-center gap-8 mb-8">
          <Link href="/auth/login" className="hover:text-blue-600 transition-colors">Log in</Link>
          <Link href="/auth/signup" className="hover:text-blue-600 transition-colors">Sign up</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link>
        </div>
        <div>© {new Date().getFullYear()} Gonzigo. All rights reserved.</div>
      </footer>
    </div>
  );
}
