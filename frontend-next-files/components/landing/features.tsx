'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [60, 0, 0, 60]);
  
  const features = [
    {
      title: "The Gentle Nudge",
      description: "Already sent. Soft touch. Big win. Gonzigo automatically follows up with leads at the perfect time.",
      icon: "🔄",
      color: "bg-blue-50 border-blue-100",
      iconBg: "bg-blue-100",
      delay: 0.1
    },
    {
      title: "Deal Memory",
      description: "I never forget a lead. You're welcome. Every interaction is tracked and analyzed for better insights.",
      icon: "🧠",
      color: "bg-purple-50 border-purple-100",
      iconBg: "bg-purple-100",
      delay: 0.2
    },
    {
      title: "Street-Smart AI",
      description: "They opened it twice. Want to nudge again? Gonzigo's AI suggests the next best action based on real behavior.",
      icon: "🤖",
      color: "bg-amber-50 border-amber-100",
      iconBg: "bg-amber-100",
      delay: 0.3
    },
    {
      title: "The Briefing",
      description: "What matters today, minus the noise. Get a daily summary of your most important deals and actions.",
      icon: "📋",
      color: "bg-emerald-50 border-emerald-100",
      iconBg: "bg-emerald-100",
      delay: 0.4
    },
    {
      title: "Pipeline Clarity",
      description: "Your deals don't fall through the cracks—they glide. Visualize your entire sales pipeline with clarity.",
      icon: "📊",
      color: "bg-rose-50 border-rose-100",
      iconBg: "bg-rose-100",
      delay: 0.5
    },
    {
      title: "Smart Automation",
      description: "You chill. I'll ping them again. Automate routine tasks and focus on what matters—closing deals.",
      icon: "⚡",
      color: "bg-indigo-50 border-indigo-100",
      iconBg: "bg-indigo-100",
      delay: 0.6
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50" ref={ref}>
      <motion.div 
        style={{ opacity, y }}
        className="container mx-auto px-4"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">CRM with brains, not baggage.</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            You don't need more dashboards. You need decisions.
            Gonzigo listens, remembers, and nudges—all without making you pay enterprise prices to keep up.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.delay }}
            >
              <Card className={`h-full border ${feature.color} hover:shadow-md transition-shadow`}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${feature.iconBg} rounded-full flex items-center justify-center text-2xl mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-20 bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto border border-gray-100">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
              <h3 className="text-2xl font-bold mb-4">Where your pipeline goes to close.</h3>
              <p className="text-gray-600 mb-4">
                If HubSpot is a help desk, and Salesforce is a boardroom…
                Gonzigo is the guy at the bar who closed the deal before you even ordered.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="italic text-gray-700">"This one's ready. You'll want your 'yes' voice."</p>
                <p className="text-sm text-gray-500 mt-2">— Gonzigo, your AI assistant</p>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                <h4 className="font-semibold mb-3">Gonzigo's Voice</h4>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="mr-2">✓</span>
                    <span>Dry humor > loud humor</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">✓</span>
                    <span>Confident > flashy</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">✓</span>
                    <span>Friendly > formal</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">✓</span>
                    <span>Minimal words > bloated explanations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
