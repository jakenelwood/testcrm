'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { brand } from '@/lib/brand';

export default function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <section className="py-24 md:py-32 relative overflow-hidden" ref={ref}>
      {/* Background decorative elements */}
      <div className="absolute -z-10 top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-[#0073ee]/5 to-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute -z-10 bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-amber-500/5 to-pink-500/5 rounded-full blur-[120px]" />

      <motion.div
        className="container mx-auto px-4"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 mb-24">
            <div className="relative p-8 md:p-16">
              {/* Subtle decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0073ee]/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl"></div>

              <div className="relative z-10 text-center">
                <motion.div variants={itemVariants} className="mb-8">
                  <span className="inline-block px-4 py-1 bg-[#0073ee]/10 text-[#0073ee] rounded-full text-sm font-medium mb-4">
                    Be unstoppable
                  </span>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    Make the jump to better sales pipelines
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    gonzigo remembers everything, so you don't have to.
                    Start closing more deals with the CRM that works for you, not the other way around.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                  <Link href="/pricing">
                    <Button className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg font-medium transition-all duration-200 rounded-sm">
                      Let's Close
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button variant="outline" className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 px-8 py-6 text-lg font-medium transition-all duration-200 rounded-sm">
                      See it in action
                    </Button>
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants} className="text-gray-500 text-sm">
                  No credit card required. Free plan available.
                </motion.div>
              </div>
            </div>
          </div>

          <motion.div
            variants={itemVariants}
            className="text-center"
          >
            <div className="mb-24">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">
                  Built different
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                  <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-[#0073ee]/10 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
                      🔒
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Secure</h3>
                    <p className="text-gray-600">Your data is encrypted and protected with enterprise-grade security.</p>
                  </div>

                  <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
                      ⚡
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Fast</h3>
                    <p className="text-gray-600">Lightning-fast performance means you spend less time waiting, more time selling.</p>
                  </div>

                  <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
                      🔄
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Reliable</h3>
                    <p className="text-gray-600">99.9% uptime guarantee means {brand.lowerName} is always there when you need it.</p>
                  </div>
                </div>

                <div className="mt-16 p-8 bg-gray-50 rounded-2xl">
                  <blockquote className="max-w-xl mx-auto">
                    <p className="italic text-xl text-gray-700 mb-4">"This one's ready. You'll want your 'yes' voice."</p>
                    <cite className="text-sm text-gray-500 block">{brand.aiAssistantSignature}</cite>
                  </blockquote>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <Link href="/pricing">
                <Button className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg font-medium transition-all duration-200 rounded-sm">
                  Let's Close
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
