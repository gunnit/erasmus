import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  default: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl',
  secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300 border border-gray-300',
  ghost: 'hover:bg-gray-100 text-gray-900',
  danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600',
  success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
};

const sizeVariants = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4',
  lg: 'h-12 px-6 text-lg',
  xl: 'h-14 px-8 text-xl'
};

export const Button = React.forwardRef(({
  className,
  variant = 'default',
  size = 'md',
  children,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transform active:scale-95',
        buttonVariants[variant],
        sizeVariants[size],
        className
      )}
      disabled={isDisabled}
      onClick={onClick}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      {...props}
    >
      {loading && iconPosition === 'left' && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="ml-2 h-4 w-4" />
      )}
      {loading && iconPosition === 'right' && (
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';