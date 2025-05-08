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
    <section className="py-20 bg-white" ref={ref}>
      <motion.div 
        className="container mx-auto px-4"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="relative p-8 md:p-12">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>
              
              <div className="relative z-10 text-center">
                <motion.div variants={itemVariants} className="mb-6">
                  <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-white text-sm font-medium mb-4">
                    Ready to close more deals?
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Smoother deals. Sharper instincts.
                  </h2>
                  <p className="text-lg text-white/90 max-w-2xl mx-auto">
                    Join Gonzigo today and experience the CRM that knows before you do.
                    No credit card required to get started.
                  </p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                  <Link href="/auth/signup">
                    <Button className="w-full sm:w-auto bg-white hover:bg-gray-100 text-blue-600 px-8 py-6 text-lg font-medium">
                      Start for free
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-medium">
                      Log in
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div variants={itemVariants} className="text-white/80 text-sm">
                  No credit card required. Free plan available.
                </motion.div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              variants={itemVariants}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                💡
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart.</h3>
              <p className="text-gray-600">
                AI that actually helps you close deals, not just another dashboard to manage.
              </p>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="text-center"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                🤖
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated.</h3>
              <p className="text-gray-600">
                Let Gonzigo handle the follow-ups, reminders, and routine tasks so you can focus on selling.
              </p>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                💰
              </div>
              <h3 className="text-xl font-semibold mb-2">Actually affordable.</h3>
              <p className="text-gray-600">
                Enterprise-level features without the enterprise-level price tag.
              </p>
            </motion.div>
          </div>
          
          <motion.div 
            variants={itemVariants}
            className="mt-16 text-center"
          >
            <p className="text-xl font-medium text-gray-800">
              "Want to Gonzigo it?"
            </p>
            <Link href="/auth/signup">
              <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-medium">
                Get Started Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
