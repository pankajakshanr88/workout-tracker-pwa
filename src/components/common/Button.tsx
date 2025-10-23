import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { hapticFeedback } from '../../utils/haptics';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'error';
  children: ReactNode;
  fullWidth?: boolean;
}

export default function Button({ 
  variant = 'primary', 
  children, 
  fullWidth = false,
  className,
  onClick,
  disabled,
  ...props 
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      hapticFeedback('medium');
      onClick?.(e);
    }
  };

  return (
    <button
      className={clsx(
        'touch-target rounded-xl font-semibold text-base transition-all haptic-feedback',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark': variant === 'primary',
          'bg-white text-gray-800 border-2 border-gray-300 hover:border-gray-400': variant === 'secondary',
          'bg-error text-white hover:bg-error-dark active:bg-error-dark': variant === 'error',
          'w-full': fullWidth,
          'px-6 py-4': !fullWidth,
          'px-4 py-3': fullWidth
        },
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

