'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ParticlesProps {
  className?: string;
  count?: number;
  color?: string;
}

export function Particles({
  className = '',
  count = 40,
  color = '#3B28CC'
}: ParticlesProps) {
  const [isClient, setIsClient] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    duration: number;
    delay: number;
    movements: {
      x: number[];
      y: number[];
    };
  }>>([]);

  useEffect(() => {
    setIsClient(true);

    // Generate random particles
    const newParticles = Array.from({ length: count }, (_, i) => {
      // Pre-calculate random movements to avoid hydration mismatch
      const xMovements = [
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
      ];

      const yMovements = [
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
      ];

      return {
        id: i,
        x: Math.random() * 100, // Random x position (0-100%)
        y: Math.random() * 100, // Random y position (0-100%)
        size: Math.random() * 6 + 2, // Random size (2-8px)
        opacity: Math.random() * 0.5 + 0.1, // Random opacity (0.1-0.6)
        duration: Math.random() * 20 + 10, // Random animation duration (10-30s)
        delay: Math.random() * 5, // Random delay (0-5s)
        movements: {
          x: xMovements,
          y: yMovements,
        }
      };
    });

    setParticles(newParticles);
  }, [count]);

  // Only render on client-side to avoid hydration mismatch
  if (!isClient) {
    return <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} />;
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            backgroundColor: color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
          }}
          animate={{
            x: particle.movements.x,
            y: particle.movements.y,
            opacity: [
              particle.opacity,
              particle.opacity * 1.5,
              particle.opacity,
              particle.opacity * 0.7,
              particle.opacity,
            ],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Animated gradient background
export function AnimatedGradient({ className = '' }: { className?: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client-side to avoid hydration mismatch
  if (!isClient) {
    return <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} />;
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-300/20 via-blue-300/20 to-pink-300/20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 0%', '100% 100%', '0% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
        }}
        style={{
          backgroundSize: '400% 400%',
        }}
      />
    </div>
  );
}

// Animated spotlight effect
export function Spotlight({ className = '' }: { className?: string }) {
  const [isClient, setIsClient] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== 'undefined') {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        setIsActive(true);
      };

      const handleMouseLeave = () => {
        setIsActive(false);
      };

      window.addEventListener('mousemove', handleMouseMove);
      document.body.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        document.body.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  // Only render on client-side to avoid hydration mismatch
  if (!isClient) {
    return <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`} />;
  }

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-[#3B28CC]/10 to-amber-500/10 blur-[80px] opacity-50"
        animate={{
          left: mousePosition.x - 250,
          top: mousePosition.y - 250,
          opacity: isActive ? 0.5 : 0,
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 300,
          opacity: { duration: 0.3 }
        }}
      />
    </div>
  );
}
