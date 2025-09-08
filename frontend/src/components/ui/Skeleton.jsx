import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-200',
        className
      )}
      {...props}
    />
  );
};

export const SkeletonCard = ({ lines = 3, showAvatar = false, showImage = false }) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
      {showImage && (
        <Skeleton className="h-48 w-full mb-4 rounded-xl" />
      )}
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        )}
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="h-3" 
              style={{ width: `${Math.random() * 40 + 60}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonText = ({ lines = 3, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4" 
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
};

export const SkeletonButton = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
    xl: 'h-14 w-40'
  };

  return (
    <Skeleton className={cn(sizeClasses[size], 'rounded-xl', className)} />
  );
};

export const SkeletonForm = ({ fields = 4 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <div className="flex gap-4 pt-4">
        <SkeletonButton size="lg" />
        <SkeletonButton size="lg" />
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="bg-gray-50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className="h-3" 
                  style={{ width: `${Math.random() * 40 + 60}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};