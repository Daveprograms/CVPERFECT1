'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'glass' | 'gradient' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

const cardVariants = {
  default: "bg-white border border-gray-300 shadow-lg text-gray-900",
  glass: "bg-white border border-gray-300 shadow-xl text-gray-900",
  gradient: "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-gray-300 text-gray-900",
  neon: "bg-gray-100 border border-blue-400 shadow-lg text-gray-900"
};

const sizeVariants = {
  sm: "p-4 rounded-lg",
  md: "p-6 rounded-xl", 
  lg: "p-8 rounded-2xl"
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  hover = true,
  glow = false,
  ...props
}) => {
  const cardClasses = cn(
    "relative overflow-hidden transition-all duration-300",
    cardVariants[variant],
    sizeVariants[size],
    glow && "shadow-[0_0_30px_rgba(59,130,246,0.2)]",
    className
  );

  const hoverAnimation = hover ? {
    scale: 1.02,
    y: -4,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  } : {};

  return (
    <motion.div
      className={cardClasses}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverAnimation}
      transition={{
        duration: 0.3,
        ease: "easeOut"
      }}
      {...props}
    >
      {/* Animated background gradient */}
      {variant === 'gradient' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"
          animate={{
            background: [
              "linear-gradient(45deg, rgba(59,130,246,0.2), rgba(147,51,234,0.2), rgba(236,72,153,0.2))",
              "linear-gradient(90deg, rgba(147,51,234,0.2), rgba(236,72,153,0.2), rgba(59,130,246,0.2))",
              "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(59,130,246,0.2), rgba(147,51,234,0.2))"
            ]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      )}
      
      {/* Neon glow effect */}
      {variant === 'neon' && (
        <motion.div
          className="absolute inset-0 bg-cyan-500/5 rounded-xl"
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Subtle shine effect */}
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
        animate={{
          x: ["-100%", "100%"],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}; 