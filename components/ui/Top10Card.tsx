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
      className="group relative shrink-0 w-[215px] h-[154px] cursor-pointer"
    >
      <div className="relative w-full h-full">
        {/* Ranking Number */}
        <div 
          className="absolute left-[-15px] top-[8px] w-[127px] h-[143px] flex items-center justify-start select-none pointer-events-none"
        >
          <span
            className="font-bold leading-none"
            style={{
              fontSize: '204px',
              color: 'transparent',
              WebkitTextStroke: '4px rgba(255, 255, 255, 0.3)',
              fontFamily: '"Netflix Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'
            }}
          >
            {rank}
          </span>
        </div>

        {/* Poster Container */}
        <div className={cn(
          "absolute top-0 w-[109px] h-[154px] rounded-r-[2px] overflow-hidden bg-[#222] transition-all duration-300 group-hover:z-20",
          rank === 10 ? "left-[130px]" : "left-[55px]"
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