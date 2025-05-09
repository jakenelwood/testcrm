'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="container mx-auto py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto relative">
        {/* Background decorative elements */}
        <div className="absolute -z-10 top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute -z-10 bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-amber-500/10 to-pink-500/5 rounded-full blur-3xl" />

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="mb-6">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600"
              >
                Gonzigo
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800"
              >
                The pipeline whisperer.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-lg text-gray-600 mb-8 leading-relaxed"
              >
                Meet your new favorite CRM. Deals don't fall through the cracks—they glide.
                Gonzigo listens, learns, and nudges at just the right time.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg text-gray-600 mb-8 leading-relaxed"
              >
                Built like enterprise. Priced like indie. You're welcome.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/pricing">
                <Button className="w-full sm:w-auto bg-[#0047AB] hover:bg-[#003d91] text-white px-8 py-6 text-lg font-medium">
                  Get Started
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg font-medium">
                  See how it works
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right column - Visual element */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative"
          >
            <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
              <div className="absolute top-0 left-0 right-0 h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto text-sm text-gray-500">Gonzigo Dashboard</div>
              </div>
              <div className="pt-12 pb-4 px-4">
                <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
                  <div className="text-sm text-blue-800 font-medium">Gonzigo says:</div>
                  <div className="text-gray-700">"That lead you forgot about? I didn't. They opened your proposal three times today."</div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between">
                      <div className="font-medium">Acme Corp</div>
                      <div className="text-green-600 text-sm">Hot Lead</div>
                    </div>
                    <div className="text-sm text-gray-500">Last activity: 2 hours ago</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between">
                      <div className="font-medium">Globex Industries</div>
                      <div className="text-amber-600 text-sm">Negotiation</div>
                    </div>
                    <div className="text-sm text-gray-500">Last activity: Yesterday</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between">
                      <div className="font-medium">Stark Enterprises</div>
                      <div className="text-blue-600 text-sm">New Contact</div>
                    </div>
                    <div className="text-sm text-gray-500">Last activity: 3 days ago</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements removed */}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
