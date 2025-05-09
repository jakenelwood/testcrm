'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

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
    <section className="py-16 bg-white" ref={ref}>
      <motion.div
        className="container mx-auto px-4"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-blue-100 mb-16">
            <div className="relative p-8 md:p-12">
              {/* Subtle decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50/30 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl"></div>

              <div className="relative z-10 text-center">
                <motion.div variants={itemVariants} className="mb-6">
                  <span className="inline-block px-4 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
                    Ready to close more deals?
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    Gonzigo's already tracking your next lead.
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Why not log in and make it official? Gonzigo remembers everything,
                    so you don't have to.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                  <Link href="/pricing">
                    <Button className="w-full sm:w-auto bg-[#0047AB] hover:bg-[#003d91] text-white px-8 py-6 text-lg font-medium transition-all duration-200">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button variant="outline" className="w-full sm:w-auto border-gray-300 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 px-8 py-6 text-lg font-medium transition-all duration-200">
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
            <div className="bg-gray-50 py-16 mb-16">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Where your pipeline goes to close.</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-16">
                  If HubSpot is a help desk, and Salesforce is a boardroom…
                  Gonzigo is the guy at the bar who closed the deal before you even ordered.
                </p>

                <blockquote className="border-l-4 border-blue-200 pl-6 py-2 max-w-xl mx-auto text-left">
                  <p className="italic text-xl text-gray-700 mb-3">"This one's ready. You'll want your 'yes' voice."</p>
                  <cite className="text-sm text-gray-500 block">— Gonzigo, your AI assistant</cite>
                </blockquote>
              </div>
            </div>

            <div className="mt-16 mb-8">
              <Link href="/pricing">
                <Button className="bg-[#0047AB] hover:bg-[#003d91] text-white px-8 py-6 text-lg font-medium transition-all duration-200">
                  Get Started Now
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
