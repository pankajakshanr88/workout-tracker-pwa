import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { hapticFeedback } from '../../utils/haptics';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'error' | 'success' | 'glass' | 'outline';
  children: ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function Button({
  variant = 'primary',
  children,
  fullWidth = false,
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      hapticFeedback('medium');
      onClick?.(e);
    }
  };

  const baseClasses = clsx(
    'touch-target rounded-2xl font-semibold transition-all duration-300 haptic-feedback',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      'w-full': fullWidth,
      'inline-flex items-center justify-center gap-2': icon,
    }
  );

  const sizeClasses = {
    sm: fullWidth ? 'px-4 py-2 text-sm' : 'px-4 py-2 text-sm',
    md: fullWidth ? 'px-6 py-3 text-base' : 'px-6 py-3 text-base',
    lg: fullWidth ? 'px-8 py-4 text-lg' : 'px-8 py-4 text-lg',
    xl: fullWidth ? 'px-10 py-5 text-xl' : 'px-10 py-5 text-xl',
  };

  const variantClasses = {
    primary: clsx(
      'bg-gradient-primary text-white shadow-primary-glow',
      'hover:shadow-lg hover:scale-[1.02] hover:shadow-primary/25',
      'active:scale-[0.98] active:shadow-md',
      'focus:ring-primary/50 focus:ring-offset-white',
      'border border-primary/20'
    ),
    secondary: clsx(
      'bg-white/90 backdrop-blur-sm text-gray-700 border border-gray-200/50',
      'hover:bg-white hover:shadow-medium hover:scale-[1.02]',
      'active:scale-[0.98]',
      'focus:ring-gray-400/50 focus:ring-offset-white'
    ),
    error: clsx(
      'bg-gradient-error text-white shadow-error-glow',
      'hover:shadow-lg hover:scale-[1.02] hover:shadow-error/25',
      'active:scale-[0.98] active:shadow-md',
      'focus:ring-error/50 focus:ring-offset-white',
      'border border-error/20'
    ),
    success: clsx(
      'bg-gradient-success text-white shadow-success-glow',
      'hover:shadow-lg hover:scale-[1.02] hover:shadow-success/25',
      'active:scale-[0.98] active:shadow-md',
      'focus:ring-success/50 focus:ring-offset-white',
      'border border-success/20'
    ),
    glass: clsx(
      'glass text-white border border-white/20',
      'hover:bg-white/20 hover:shadow-medium hover:scale-[1.02]',
      'active:scale-[0.98]',
      'focus:ring-white/50 focus:ring-offset-gray-900',
      'backdrop-blur-md'
    ),
    outline: clsx(
      'bg-transparent text-primary border-2 border-primary',
      'hover:bg-primary hover:text-white hover:shadow-medium hover:scale-[1.02]',
      'active:scale-[0.98]',
      'focus:ring-primary/50 focus:ring-offset-white'
    ),
  };

  return (
    <button
      className={clsx(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}

      <span className={loading ? 'opacity-70' : ''}>{children}</span>

      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
}

