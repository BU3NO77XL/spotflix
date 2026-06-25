'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Movie } from '@/types/movie';

interface Top10CardProps {
  movie: Movie;
  rank: number;
  onClick: (movie: Movie) => void;
  index: number;
}

export default function Top10Card({ movie, rank, onClick, index }: Top10CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={() => onClick(movie)}
      className={cn(
        "group relative shrink-0 cursor-pointer",
        // Height: responsive and dynamic
        "h-[154px] md:h-[150px] lg:h-[190px] xl:h-[230px]",
        // Width: responsive and dynamic, extremely tight and compact on all screens
        rank === 10
          ? "w-[210px] md:w-[165px] lg:w-[210px] xl:w-[260px]"
          : "w-[145px] md:w-[140px] lg:w-[180px] xl:w-[220px]"
      )}
    >
      <div className="relative w-full h-full">
        {/* Ranking Number - Responsive on all screens */}
        <div 
          className={cn(
            "absolute z-0 flex items-center justify-start select-none pointer-events-none",
            // Position: responsive
            "left-[-10px] lg:left-[-15px] xl:left-[-20px] top-0",
            // Width & Height: matches the card height exactly for vertical centering
            "w-[110px] h-[154px] md:w-[110px] md:h-[150px] lg:w-[140px] lg:h-[190px] xl:w-[170px] xl:h-[230px]"
          )}
        >
          <span
            className="font-bold leading-none text-transparent text-[150px] md:text-[140px] lg:text-[180px] xl:text-[220px]"
            style={{
              WebkitTextStroke: '4px rgba(255, 255, 255, 0.3)',
              fontFamily: '"Netflix Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'
            }}
          >
            {rank}
          </span>
        </div>

        {/* Poster Container */}
        <div className={cn(
          "absolute top-0 z-10 rounded-xl overflow-hidden bg-[#222] transition-all duration-300 group-hover:z-30",
          // Poster Dimensions: responsive
          "w-[109px] h-[154px] md:w-[106px] md:h-[150px] lg:w-[134px] lg:h-[190px] xl:w-[162px] xl:h-[230px]",
          // Poster Position: precise 80% overlap for 1-9, exact 50% of '0' for 10 on all screens
          rank === 10
            ? "left-[100px] md:left-[55px] lg:left-[72px] xl:left-[90px]"
            : "left-[35px] md:left-[30px] lg:left-[40px] xl:left-[50px]"
        )}>
          {/* Image */}
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Score Badge */}
          {movie.score && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm 
                px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Star className="w-2.5 h-2.5 text-[#1DB954] fill-[#1DB954]" />
              <span className="text-white text-[10px] font-semibold">{movie.score}</span>
            </div>
          )}

          {/* Hover Content */}
          <div className="absolute inset-0 p-2 opacity-0 group-hover:opacity-100 
              transition-all duration-300 flex flex-col justify-end">
            <div className="relative z-10 flex items-center gap-1 text-[10px] text-gray-300 font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <span>{movie.year}</span>
              {movie.rating && (
                <span className="px-1 py-0.5 border border-gray-500 rounded text-[8px]">{movie.rating}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}