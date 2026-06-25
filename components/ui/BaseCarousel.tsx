'use client';

import { useRef, useState, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseCarouselProps {
  title?: string;
  children: ReactNode;
  className?: string;
  showArrows?: boolean;
  showTitle?: boolean;
  titleClassName?: string;
  containerClassName?: string;
  gap?: 'sm' | 'md' | 'lg';
  padding?: 'sm' | 'md' | 'lg';
  scrollContainerClassName?: string;
  arrowBottomClass?: string;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-3 lg:gap-4',
  lg: 'gap-4 lg:gap-6'
};

const paddingClasses = {
  sm: 'pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-[24px] lg:pr-0',
  md: 'pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-[24px] lg:pr-0',
  lg: 'pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-[24px] lg:pr-0'
};

export default function BaseCarousel({
  title,
  children,
  className,
  showArrows = true,
  showTitle = true,
  titleClassName,
  containerClassName,
  gap = 'md',
  padding = 'md',
  scrollContainerClassName,
  arrowBottomClass
}: BaseCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={cn("relative py-4 lg:py-4 group/section", className)}>
      {/* Section Title */}
      {showTitle && title && (
        <div className={cn("w-full mb-3 lg:mb-4", paddingClasses[padding])}>
          <h2 className={cn(
            "text-[20px] font-medium text-[#e5e5e5] tracking-tight leading-[18px]",
            titleClassName
          )}>
            {title}
          </h2>
        </div>
      )}

      {/* Carousel Container */}
      <div className={cn("relative", containerClassName)}>
        {/* Left Arrow */}
        {showArrows && (
          <button
            onClick={() => scroll('left')}
            className={cn(
              "absolute left-0 top-0 z-20 w-12 lg:w-16",
              arrowBottomClass || "bottom-4",
              "flex items-center justify-start pl-2",
              "transition-opacity duration-300",
              showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <div className="p-2 rounded-lg bg-white/10 transition-all duration-200 backdrop-blur-sm">
              <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
          </button>
        )}

        {/* Right Arrow */}
        {showArrows && (
          <button
            onClick={() => scroll('right')}
            className={cn(
              "absolute right-0 top-0 z-20 w-12 lg:w-16",
              arrowBottomClass || "bottom-4",
              "flex items-center justify-end pr-2",
              "transition-opacity duration-300",
              showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <div className="p-2 rounded-lg bg-white/10 transition-all duration-200 backdrop-blur-sm">
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
          </button>
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            "flex overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth",
            scrollContainerClassName || "pb-4",
            gapClasses[gap],
            paddingClasses[padding]
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}