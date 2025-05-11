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
    <section id="features" className="py-24 md:py-32" ref={ref}>
      <motion.div
        style={{ opacity, y }}
        className="container mx-auto px-4"
      >
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">CRM with brains, not baggage</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            You don't need more dashboards. You need decisions.
            gonzigo listens, remembers, and nudges—all without making you pay enterprise prices to keep up.
          </p>
        </div>

        {/* First Feature Section */}
        <div className="mb-32">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 order-2 md:order-1">
              <div className="relative">
                <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-[#3B28CC]/5 rounded-full blur-3xl"></div>
                <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl"></div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
                  <div className="absolute top-0 left-0 right-0 h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="mx-auto text-sm text-gray-500">gonzigo pipeline view</div>
                  </div>
                  <div className="pt-16 pb-6 px-6">
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1 bg-[#3B28CC]/10 rounded-lg p-3 text-center">
                        <div className="text-sm text-gray-600">New Leads</div>
                        <div className="text-2xl font-bold text-[#3B28CC]">24</div>
                      </div>
                      <div className="flex-1 bg-amber-100 rounded-lg p-3 text-center">
                        <div className="text-sm text-gray-600">In Progress</div>
                        <div className="text-2xl font-bold text-amber-600">18</div>
                      </div>
                      <div className="flex-1 bg-green-100 rounded-lg p-3 text-center">
                        <div className="text-sm text-gray-600">Closed</div>
                        <div className="text-2xl font-bold text-green-600">12</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex justify-between">
                            <div className="font-medium">Acme Corp</div>
                            <div className="text-green-600 text-sm">Hot Lead</div>
                          </div>
                          <div className="text-sm text-gray-500">Last activity: 2 hours ago</div>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#3B28CC] rounded-full" style={{ width: `${70 - i * 20}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 order-1 md:order-2">
              <div className="mb-2 inline-block">
                <div className="w-12 h-12 bg-[#3B28CC]/10 rounded-full flex items-center justify-center text-2xl mb-4">
                  📊
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-6">Pipeline Clarity</h3>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Your deals don't fall through the cracks—they glide. Visualize your entire sales pipeline with clarity.
              </p>
              <ul className="space-y-4">
                {[
                  "Visual pipeline management with drag-and-drop simplicity",
                  "Custom stages that match your unique sales process",
                  "Real-time deal progress tracking with smart alerts"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-[#3B28CC]/10 text-[#3B28CC] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Second Feature Section */}
        <div className="mb-32">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1">
              <div className="mb-2 inline-block">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl mb-4">
                  🤖
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-6">Street-Smart AI</h3>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                They opened it twice. Want to nudge again? gonzigo's AI suggests the next best action based on real behavior.
              </p>
              <ul className="space-y-4">
                {[
                  "AI-powered follow-up recommendations based on engagement",
                  "Smart scheduling that knows when your leads are most responsive",
                  "Behavior analysis that helps you focus on the hottest opportunities"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1">
              <div className="relative">
                <div className="absolute -z-10 -bottom-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl"></div>
                <div className="absolute -z-10 -top-10 -left-10 w-40 h-40 bg-[#3B28CC]/5 rounded-full blur-3xl"></div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="absolute top-0 left-0 right-0 h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="mx-auto text-sm text-gray-500">gonzigo ai assistant</div>
                  </div>
                  <div className="pt-16 pb-6 px-6">
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100 relative overflow-hidden">
                      <div className="text-sm text-blue-800 font-medium flex items-center">
                        gonzigo says:
                        <span className="ml-1 w-2 h-2 bg-[#3B28CC] rounded-full animate-pulse"></span>
                      </div>
                      <div className="text-gray-700">"Globex Industries has viewed your proposal 3 times in the last 24 hours. Their engagement pattern suggests they're ready for a follow-up call."</div>
                      <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-blue-100/50 rounded-full blur-xl"></div>
                    </div>
                    <div className="flex gap-3 mb-4">
                      <button className="flex-1 bg-[#3B28CC] text-white py-2 px-4 rounded-lg text-sm font-medium">Schedule Call</button>
                      <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium">Send Email</button>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <div className="text-sm font-medium text-amber-800 mb-2">Recommended follow-up:</div>
                      <div className="text-gray-700 text-sm">"Hi John, I noticed you've been reviewing our proposal. Do you have any questions I can help clarify before we move forward?"</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.filter((_, i) => i !== 2 && i !== 4).map((feature, index) => (
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
      </motion.div>
    </section>
  );
}
