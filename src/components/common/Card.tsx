import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'glass' | 'modern' | 'elevated' | 'bordered' | 'minimal';
  shadow?: 'none' | 'soft' | 'medium' | 'strong' | 'glow';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  hover?: boolean;
  animate?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  padding = 'md',
  variant = 'default',
  shadow = 'soft',
  rounded = 'xl',
  hover = false,
  animate = false,
  gradient = false,
  onClick
}: CardProps) {
  const baseClasses = 'transition-all duration-300';

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  };

  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl',
    full: 'rounded-full',
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200/50',
    glass: 'glass border border-white/20',
    modern: 'card-modern border border-white/20',
    elevated: 'bg-white/95 backdrop-blur-sm border border-gray-200/30',
    bordered: 'bg-white border-2 border-gray-200',
    minimal: 'bg-transparent border-none',
  };

  const shadowClasses = {
    none: 'shadow-none',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    strong: 'shadow-strong',
    glow: 'shadow-strong',
  };

  const hoverClasses = hover ? 'hover:shadow-medium hover:-translate-y-1 hover:scale-[1.02]' : '';
  const animateClasses = animate ? 'animate-fade-in' : '';
  const gradientClasses = gradient ? 'bg-gradient-to-br from-white via-gray-50 to-white' : '';
  const clickableClasses = onClick ? 'cursor-pointer hover:shadow-medium hover:-translate-y-0.5' : '';

  return (
    <div
      className={clsx(
        baseClasses,
        paddingClasses[padding],
        roundedClasses[rounded],
        variantClasses[variant],
        shadowClasses[shadow],
        hoverClasses,
        animateClasses,
        gradientClasses,
        clickableClasses,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

