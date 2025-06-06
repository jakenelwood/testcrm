'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedShapesProps {
  className?: string;
}

export function AnimatedShapes({ className }: AnimatedShapesProps) {
  const [isClient, setIsClient] = React.useState(false);
  const [dots, setDots] = React.useState<Array<{
    id: number;
    top: string;
    left: string;
    duration: number;
    delay: number;
  }>>([]);

  // Only run on client-side to avoid hydration mismatch
  React.useEffect(() => {
    setIsClient(true);

    // Generate random dots
    const newDots = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 80 + 10}%`,
      left: `${Math.random() * 80 + 10}%`,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));

    setDots(newDots);
  }, []);

  // Only render animations on the client
  if (!isClient) {
    return <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} />;
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Animated circle */}
      <motion.div
        className="absolute w-64 h-64 rounded-full border-4 border-[#3B28CC]/20"
        style={{ top: '10%', right: '5%' }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          borderWidth: ['4px', '2px', '4px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animated square */}
      <motion.div
        className="absolute w-48 h-48 border-4 border-amber-500/20"
        style={{ bottom: '15%', left: '10%' }}
        animate={{
          rotate: [0, 90, 180, 270, 360],
          borderRadius: ['0%', '25%', '0%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Animated triangle */}
      <motion.div
        className="absolute w-56 h-56 border-4 border-blue-500/20"
        style={{
          top: '40%',
          left: '60%',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
        }}
        animate={{
          rotate: [0, 120, 240, 360],
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animated wave */}
      <svg
        className="absolute bottom-0 left-0 w-full h-32 opacity-10"
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          fill="#3B28CC"
          initial={{
            d: "M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,197.3C672,224,768,224,864,197.3C960,171,1056,117,1152,96C1248,75,1344,85,1392,90.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          }}
          animate={{
            d: [
              "M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,197.3C672,224,768,224,864,197.3C960,171,1056,117,1152,96C1248,75,1344,85,1392,90.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,160L48,181.3C96,203,192,245,288,234.7C384,224,480,160,576,133.3C672,107,768,117,864,144C960,171,1056,213,1152,218.7C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              "M0,64L48,96C96,128,192,192,288,192C384,192,480,128,576,122.7C672,117,768,171,864,197.3C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* Animated dots */}
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute w-2 h-2 rounded-full bg-[#3B28CC]/30"
          style={{
            top: dot.top,
            left: dot.left,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            delay: dot.delay,
          }}
        />
      ))}
    </div>
  );
}

// Animated text that appears to be typed
export function AnimatedText({
  text,
  className = '',
  delay = 0.5,
  speed = 0.05
}: {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}) {
  const characters = Array.from(text);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: speed, delayChildren: delay * i }
    })
  };

  const childVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {characters.map((character, index) => (
        <motion.span
          key={index}
          variants={childVariants}
          style={{ display: 'inline-block' }}
        >
          {character === ' ' ? '\u00A0' : character}
        </motion.span>
      ))}
    </motion.div>
  );
}
