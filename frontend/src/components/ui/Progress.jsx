import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Progress = React.forwardRef(({
  value = 0,
  max = 100,
  className,
  showLabel = false,
  size = 'md',
  variant = 'default',
  animated = true,
  ...props
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6'
  };

  const variantClasses = {
    default: 'from-blue-500 to-indigo-500',
    success: 'from-green-500 to-emerald-500',
    warning: 'from-yellow-500 to-orange-500',
    danger: 'from-red-500 to-rose-500',
    purple: 'from-purple-500 to-pink-500'
  };

  return (
    <div className="w-full">
      <div
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-gray-200',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <motion.div
          className={cn(
            'h-full rounded-full bg-gradient-to-r',
            variantClasses[variant],
            animated && 'bg-size-200 animate-gradient'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 1, 
            ease: "easeOut",
            delay: 0.2
          }}
        />
        {showLabel && size !== 'sm' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white drop-shadow">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      {showLabel && size === 'sm' && (
        <div className="mt-1 text-right">
          <span className="text-xs font-medium text-gray-600">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
});

Progress.displayName = 'Progress';

export const CircularProgress = React.forwardRef(({
  value = 0,
  max = 100,
  size = 80,
  strokeWidth = 8,
  className,
  showLabel = true,
  variant = 'default',
  ...props
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#A855F7'
  };

  return (
    <div className={cn('relative inline-flex', className)} ref={ref} {...props}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          style={{
            strokeDasharray: circumference
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
});

CircularProgress.displayName = 'CircularProgress';