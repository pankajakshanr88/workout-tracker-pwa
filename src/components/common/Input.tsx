import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'modern' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    variant = 'modern',
    size = 'md',
    leftIcon,
    rightIcon,
    className,
    type = 'text',
    ...props
  }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    const baseClasses = clsx(
      'w-full border rounded-2xl transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:bg-gray-50 disabled:cursor-not-allowed',
      sizeClasses[size]
    );

    const variantClasses = {
      modern: clsx(
        'bg-white/70 backdrop-blur-sm border-gray-200 text-gray-900 placeholder-gray-500',
        'focus:bg-white focus:border-primary focus:ring-primary/20 focus:ring-offset-white'
      ),
      default: clsx(
        'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
        'focus:border-primary focus:ring-primary/20'
      ),
      minimal: clsx(
        'bg-transparent border-gray-300 text-gray-900 placeholder-gray-500',
        'focus:border-primary focus:ring-primary/20 focus:bg-white/50'
      ),
    };

    const errorClasses = error
      ? 'border-error focus:border-error focus:ring-error/20'
      : '';

    const inputClasses = clsx(
      baseClasses,
      variantClasses[variant],
      errorClasses,
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className={clsx(
            'block font-medium text-gray-700 mb-2',
            {
              'text-sm': size === 'sm',
              'text-base': size === 'md',
              'text-lg': size === 'lg',
            }
          )}>
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className={clsx(
                'text-gray-400',
                {
                  'text-sm': size === 'sm',
                  'text-base': size === 'md',
                  'text-lg': size === 'lg',
                }
              )}>
                {leftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={clsx(
              inputClasses,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10'
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className={clsx(
                'text-gray-400',
                {
                  'text-sm': size === 'sm',
                  'text-base': size === 'md',
                  'text-lg': size === 'lg',
                }
              )}>
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className="mt-2">
            {error && (
              <p className="text-sm text-error font-medium flex items-center gap-1">
                <span className="text-xs">⚠️</span>
                {error}
              </p>
            )}
            {!error && helperText && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

