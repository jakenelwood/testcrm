'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className = '', delay = 0 }: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative"
    >
      {/* Animated glow effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#3B28CC]/20 to-amber-500/20 rounded-xl blur-xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isHovered ? 0.7 : 0,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.3 }}
      />
     
      {/* Card with hover animation */}
      <motion.div
        whileHover={{
          y: -5,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Card className={`h-full border hover:border-[#3B28CC]/20 transition-colors ${className}`}>
          <CardContent className="p-6">
            {children}
          </CardContent>
        </Card>
      </motion.div>
     
      {/* Floating particles that appear on hover */}
      {isHovered && (
        <>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-[#3B28CC]/40"
              initial={{
                opacity: 0,
                x: 0,
                y: 0,
                scale: 0
              }}
              animate={{
                opacity: [0, 1, 0],
                x: Math.random() * 100 - 50,
                y: Math.random() * -100,
                scale: [0, Math.random() * 1 + 0.5, 0]
              }}
              transition={{
                duration: Math.random() * 1 + 1,
                repeat: Infinity,
                repeatDelay: Math.random() * 0.5
              }}
              style={{
                left: `${Math.random() * 80 + 10}%`,
                bottom: '10%',
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

// 3D tilt effect card
export function TiltCard({ children, className = '', delay = 0 }: AnimatedCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
 
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
   
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
   
    const rotateXValue = (y - centerY) / 10;
    const rotateYValue = (centerX - x) / 10;
   
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };
 
  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        animate={{
          rotateX: rotateX,
          rotateY: rotateY,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Card className={`h-full border hover:border-[#3B28CC]/20 transition-colors ${className}`}>
          <CardContent className="p-6">
            {children}
          </CardContent>
        </Card>
       
        {/* Reflection effect */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{ transform: 'translateZ(2px)' }}
        />
      </motion.div>
    </motion.div>
  );
}

