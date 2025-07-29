'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FuturisticButtonProps extends Omit<HTMLMotionProps<"button">, 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'neon' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
  ripple?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-lg hover:shadow-blue-500/25",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 shadow-md",
  ghost: "bg-transparent hover:bg-white/10 text-gray-700 border border-transparent hover:border-white/20",
  neon: "bg-gray-900 hover:bg-gray-800 text-cyan-400 border border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]",
  gradient: "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white border-0 shadow-lg"
};

const sizeVariants = {
  sm: "px-3 py-1.5 text-sm rounded-lg min-h-[32px]",
  md: "px-4 py-2 text-base rounded-xl min-h-[40px]",
  lg: "px-6 py-3 text-lg rounded-2xl min-h-[48px]"
};

export const FuturisticButton: React.FC<FuturisticButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  glow = false,
  ripple = true,
  children,
  className,
  disabled,
  ...props
}) => {
  const [isClicked, setIsClicked] = React.useState(false);

  const buttonClasses = cn(
    "relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 transform-gpu",
    "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    buttonVariants[variant],
    sizeVariants[size],
    glow && "hover:shadow-2xl",
    className
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple && !disabled && !loading) {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 300);
    }
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <motion.button
      className={buttonClasses}
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* Animated background for gradient variant */}
      {variant === 'gradient' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-xl opacity-0"
          animate={isClicked ? { opacity: [0, 0.3, 0] } : {}}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Ripple effect */}
      {ripple && isClicked && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-xl"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Icon */}
      {icon && iconPosition === 'left' && !loading && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {icon}
        </motion.div>
      )}

      {/* Content */}
      <motion.span
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {children}
      </motion.span>

      {/* Icon */}
      {icon && iconPosition === 'right' && !loading && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {icon}
        </motion.div>
      )}

      {/* Neon glow animation */}
      {variant === 'neon' && (
        <motion.div
          className="absolute inset-0 bg-cyan-500/10 rounded-xl"
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

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0"
        animate={isClicked ? {
          x: ["-100%", "100%"],
          opacity: [0, 1, 0]
        } : {}}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
    </motion.button>
  );
}; 