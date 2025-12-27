'use client';

import { motion } from 'framer-motion';

export default function WatchPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section Skeleton */}
      <div className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] bg-[#1a1a1a] overflow-hidden">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a]"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 w-full pb-12 sm:pb-24 lg:pb-32">
            <div className="max-w-2xl space-y-4">
              {/* Title skeleton */}
              <div className="h-12 sm:h-16 lg:h-20 bg-white/10 rounded-lg animate-pulse" />
              
              {/* Metadata skeleton */}
              <div className="flex gap-4">
                <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
                <div className="h-6 w-12 bg-white/10 rounded animate-pulse" />
                <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
              </div>
              
              {/* Description skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded animate-pulse" />
                <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />
              </div>
              
              {/* Buttons skeleton */}
              <div className="flex gap-4 pt-4">
                <div className="h-12 w-32 bg-[#1DB954]/50 rounded-lg animate-pulse" />
                <div className="h-12 w-28 bg-white/10 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content section skeleton */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="h-6 bg-white/10 rounded animate-pulse w-1/4" />
              <div className="h-4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 bg-white/10 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="h-6 bg-white/10 rounded animate-pulse w-1/3" />
            <div className="space-y-2">
              <div className="h-4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 bg-white/10 rounded animate-pulse w-4/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}