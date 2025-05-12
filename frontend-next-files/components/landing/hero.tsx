'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decorative elements */}
      <div className="absolute -z-10 top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-purple-500/10 to-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute -z-10 bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-amber-500/10 to-pink-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            {/* Left column - Text content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Badge className="mb-6 bg-[#0073ee20] text-[#0073ee] hover:bg-[#0073ee30] px-3 py-1 text-sm rounded-full font-medium">
                    New
                  </Badge>
                  <span className="ml-2 text-sm text-gray-600">No more missed opportunities. That's gonzigo.</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight font-inter"
                >
                  Make the <br />
                  <span className="text-[#0073ee] font-bold">jump to better</span> <br />
                  sales pipelines
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl"
                >
                  Use the intelligent, proactive CRM that helps you close more deals.
                  gonzigo listens, learns, and nudges at just the right time.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/pricing">
                  <Button className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg font-medium rounded-sm">
                    Let's Close
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg font-medium rounded-sm border-gray-300">
                    See how it works
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right column - Visual element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.95 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex-1 relative"
            >
              {/* Screen texture overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay z-10 bg-[url('https://res.cloudinary.com/dhgck7ebz/image/upload/f_auto,c_limit,w_3840,q_auto/Textures/screen-texture')] bg-cover"></div>

              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="absolute top-0 left-0 right-0 h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="mx-auto text-sm text-gray-500">gonzigo dashboard</div>
                </div>
                <div className="pt-12 pb-4 px-4">
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100 relative overflow-hidden">
                    <div className="text-sm text-blue-800 font-medium flex items-center">
                      gonzigo says:
                      <span className="ml-1 w-2 h-2 bg-[#0073ee] rounded-full animate-pulse"></span>
                    </div>
                    <div className="text-gray-700">"That lead you forgot about? I didn't. They opened your proposal three times today."</div>
                    <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-blue-100/50 rounded-full blur-xl"></div>
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

              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#0073ee30] rounded-full blur-2xl"></div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
