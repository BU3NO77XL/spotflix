'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AutoPlayCarouselProps {
  title: string;
  children: ReactNode[];
  className?: string;
  autoPlayInterval?: number;
  showIndicators?: boolean;
}

export default function AutoPlayCarousel({
  title,
  children,
  className,
  autoPlayInterval = 5000,
  showIndicators = true
}: AutoPlayCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || children.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % children.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, children.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
    // Resume autoplay after 10 seconds
    setTimeout(() => setIsPlaying(true), 10000);
  };

  if (!children?.length) return null;

  return (
    <section className={cn("relative py-4 lg:py-6 group/section", className)}>
      {/* Section Title */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mb-3 lg:mb-4">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">
          {title}
        </h2>
      </div>

      {/* AutoPlay Container */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full"
          >
            {children[currentIndex]}
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        {showIndicators && children.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {children.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "bg-white w-8"
                    : "bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        )}


      </div>
    </section>
  );
}