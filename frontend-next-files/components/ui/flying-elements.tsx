'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface FlyingElementProps {
  className?: string;
}

// Flying shapes component that adds animated elements to the page
export function FlyingElements({ className }: FlyingElementProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay the animation start to ensure the page is loaded
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Define different shapes to fly around
  const shapes = [
    // Purple circles
    {
      element: <div className="w-6 h-6 rounded-full bg-[#3B28CC]/20"></div>,
      initialX: '-100vw',
      initialY: '20vh',
      animateX: '120vw',
      animateY: '10vh',
      duration: 25,
      delay: 0,
    },
    {
      element: <div className="w-10 h-10 rounded-full bg-[#3B28CC]/10"></div>,
      initialX: '-50vw',
      initialY: '40vh',
      animateX: '110vw',
      animateY: '60vh',
      duration: 30,
      delay: 5,
    },
    {
      element: <div className="w-4 h-4 rounded-full bg-[#3B28CC]/30"></div>,
      initialX: '-20vw',
      initialY: '70vh',
      animateX: '110vw',
      animateY: '30vh',
      duration: 20,
      delay: 2,
    },
    
    // Amber squares
    {
      element: <div className="w-8 h-8 rounded-md bg-amber-500/10 rotate-45"></div>,
      initialX: '120vw',
      initialY: '15vh',
      animateX: '-20vw',
      animateY: '60vh',
      duration: 28,
      delay: 3,
    },
    {
      element: <div className="w-5 h-5 rounded-md bg-amber-500/20 rotate-45"></div>,
      initialX: '110vw',
      initialY: '50vh',
      animateX: '-10vw',
      animateY: '20vh',
      duration: 22,
      delay: 7,
    },
    
    // Blue triangles (using clip-path)
    {
      element: <div className="w-12 h-12 bg-blue-500/10" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>,
      initialX: '50vw',
      initialY: '-20vh',
      animateX: '20vw',
      animateY: '120vh',
      duration: 26,
      delay: 1,
    },
    {
      element: <div className="w-6 h-6 bg-blue-500/20" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>,
      initialX: '70vw',
      initialY: '-10vh',
      animateX: '80vw',
      animateY: '110vh',
      duration: 24,
      delay: 6,
    },
    
    // Green diamonds
    {
      element: <div className="w-7 h-7 bg-green-500/15 rotate-45"></div>,
      initialX: '-10vw',
      initialY: '90vh',
      animateX: '110vw',
      animateY: '-10vh',
      duration: 32,
      delay: 4,
    },
    
    // Pink plus signs
    {
      element: (
        <div className="relative w-8 h-8">
          <div className="absolute top-3 left-0 w-8 h-2 bg-pink-500/20 rounded-full"></div>
          <div className="absolute top-0 left-3 w-2 h-8 bg-pink-500/20 rounded-full"></div>
        </div>
      ),
      initialX: '110vw',
      initialY: '80vh',
      animateX: '-10vw',
      animateY: '10vh',
      duration: 29,
      delay: 8,
    },
    
    // Teal rings
    {
      element: (
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-teal-500/20"></div>
        </div>
      ),
      initialX: '30vw',
      initialY: '-15vh',
      animateX: '60vw',
      animateY: '120vh',
      duration: 27,
      delay: 9,
    },
  ];

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          initial={{ 
            x: shape.initialX, 
            y: shape.initialY,
            opacity: 0,
            rotate: 0
          }}
          animate={isVisible ? { 
            x: shape.animateX, 
            y: shape.animateY,
            opacity: [0, 1, 1, 0],
            rotate: 360
          } : {}}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
            times: [0, 0.1, 0.9, 1] // For opacity keyframes
          }}
          className="absolute"
        >
          {shape.element}
        </motion.div>
      ))}
    </div>
  );
}

// Floating icons that move slightly with a hover effect
export function FloatingIcons({ className }: FlyingElementProps) {
  const icons = [
    {
      icon: "📊",
      x: "10%",
      y: "20%",
      size: "text-4xl",
      delay: 0,
    },
    {
      icon: "💼",
      x: "80%",
      y: "15%",
      size: "text-5xl",
      delay: 0.2,
    },
    {
      icon: "📱",
      x: "20%",
      y: "70%",
      size: "text-3xl",
      delay: 0.4,
    },
    {
      icon: "📈",
      x: "70%",
      y: "60%",
      size: "text-4xl",
      delay: 0.6,
    },
    {
      icon: "🤝",
      x: "85%",
      y: "80%",
      size: "text-3xl",
      delay: 0.8,
    },
    {
      icon: "💡",
      x: "15%",
      y: "40%",
      size: "text-4xl",
      delay: 1,
    },
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {icons.map((icon, index) => (
        <motion.div
          key={index}
          className={`absolute ${icon.size}`}
          style={{
            left: icon.x,
            top: icon.y,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{
            opacity: { duration: 0.8, delay: icon.delay },
            y: { duration: 0.8, delay: icon.delay },
          }}
          whileHover={{ scale: 1.2, opacity: 1 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            {icon.icon}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
