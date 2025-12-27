'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({ 
  className, 
  variant = 'rectangle',
  width,
  height,
  count = 1
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-white/10 rounded";
  
  const variantClasses = {
    card: "aspect-2/3 w-full rounded-lg",
    text: "h-4 w-full rounded",
    circle: "rounded-full",
    rectangle: "rounded"
  };

  const skeletonElement = (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(baseClasses, variantClasses[variant], className)} style={{ width, height }} />
      ))}
    </>
  );
}

// Skeleton components for specific use cases
export function MovieCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 lg:gap-4 px-4 sm:px-6 lg:px-12">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="shrink-0 w-[110px] sm:w-[130px] lg:w-[160px]">
          <Skeleton variant="card" />
          <div className="mt-2 space-y-1">
            <Skeleton variant="text" className="h-3" />
            <Skeleton variant="text" className="h-2 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CarouselSkeleton({ title }: { title?: string }) {
  return (
    <section className="relative py-4 lg:py-6">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mb-3 lg:mb-4">
        {title ? (
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">
            {title}
          </h2>
        ) : (
          <Skeleton variant="text" className="h-6 w-48" />
        )}
      </div>
      <MovieCardSkeleton />
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative h-[95vh] sm:h-screen lg:h-screen w-full bg-[#0a0a0a]">
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center sm:items-end z-20">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 w-full pb-12 sm:pb-24 lg:pb-32">
          <div className="max-w-2xl space-y-4">
            <Skeleton variant="text" className="h-12 w-3/4" />
            <div className="flex gap-3">
              <Skeleton variant="text" className="h-4 w-16" />
              <Skeleton variant="text" className="h-4 w-20" />
              <Skeleton variant="text" className="h-4 w-24" />
            </div>
            <Skeleton variant="text" className="h-20 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-32 rounded-lg" />
              <Skeleton className="h-12 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}