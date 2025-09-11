import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({
  className,
  type,
  label,
  error,
  icon: Icon,
  helper,
  ...props
}, ref) => {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <motion.label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <motion.input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
            'transition-all duration-200',
            Icon && 'pl-10',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400',
            className
          )}
          ref={ref}
          id={inputId}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          {...props}
        />
      </div>
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
      {error && (
        <motion.p
          className="mt-1 text-sm text-red-600"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = React.forwardRef(({
  className,
  label,
  error,
  helper,
  rows = 4,
  ...props
}, ref) => {
  const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <motion.label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>
      )}
      <motion.textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border bg-white px-3 py-2 text-sm',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
          'transition-all duration-200 resize-y',
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400',
          className
        )}
        ref={ref}
        id={textareaId}
        rows={rows}
        whileFocus={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        {...props}
      />
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
      {error && (
        <motion.p
          className="mt-1 text-sm text-red-600"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';