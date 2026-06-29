'use client';

import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import BaseCarousel from './BaseCarousel';

interface BackdropCarouselProps {
  title: string;
  children: ReactNode;
  backdropUrl?: string | null;
  className?: string;
  showBackdrop?: boolean;
}

export default function BackdropCarousel({
  title,
  children,
  backdropUrl,
  className,
  showBackdrop = true
}: BackdropCarouselProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const shouldShowBackdrop = showBackdrop && Boolean(backdropUrl && backdropUrl !== '') && !imageError;

  if (!shouldShowBackdrop) {
    return (
      <BaseCarousel title={title} className={className}>
        {children}
      </BaseCarousel>
    );
  }

  return (
    <section className={cn("relative py-8 lg:py-12", className)}>
      {/* Backdrop Image */}
      <div className="absolute inset-0 z-0">
        {!imageError && (
          <motion.img
            src={backdropUrl || undefined}
            alt=""
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Cinematic Overlay System */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#121212_90%)] opacity-80" />
        <div className="absolute inset-0 bg-linear-to-r from-[#121212] via-transparent to-transparent opacity-90" />
        <div className="absolute inset-0 bg-linear-to-b from-[#121212] via-[#121212]/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-[#121212]/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <BaseCarousel
          title={title}
          titleClassName="text-2xl sm:text-3xl lg:text-4xl font-black"
          showArrows={true}
        >
          {children}
        </BaseCarousel>
      </div>
    </section>
  );
}