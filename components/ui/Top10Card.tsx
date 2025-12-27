'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Movie } from '@/types/movie';
import PlayButton from '@/components/ui/PlayButton';
import ActionButton from '@/components/ui/ActionButton';

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
      className="group relative shrink-0 w-[130px] sm:w-[150px] lg:w-[180px] cursor-pointer"
    >
      <div className="relative flex items-end">
        {/* Ranking Number */}
        <div className="relative z-10 shrink-0 mr-[-20px] sm:mr-[-25px] lg:mr-[-30px]">
          <div className="relative w-[60px] sm:w-[70px] lg:w-[90px] h-[90px] sm:h-[105px] lg:h-[135px] flex items-center justify-center">
            <span
              className="text-black font-black text-5xl sm:text-6xl lg:text-8xl select-none"
              style={{
                WebkitTextFillColor: 'black',
                WebkitTextStroke: '1.5px white',
                textShadow: '0 0 10px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.5)'
              }}
            >
              {rank}
            </span>
          </div>
        </div>

        {/* Poster Container */}
        <div className="relative aspect-2/3 w-full rounded-lg lg:rounded-xl overflow-hidden 
              bg-[#1a1a1a] transition-all duration-300 
              group-hover:scale-105 group-hover:z-20
              shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          {/* Image */}
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-700 
                 group-hover:scale-110"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Score Badge */}
          {movie.score && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm 
                px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300
                transform translate-y-2 group-hover:translate-y-0">
              <Star className="w-3 h-3 text-[#1DB954] fill-[#1DB954]" />
              <span className="text-white text-xs font-semibold">{movie.score}</span>
            </div>
          )}

          {/* Hover Content */}
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 
              transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            {/* Quick Actions */}
            <div className="flex gap-2 mb-2">
              <PlayButton 
                size="sm" 
                className="flex-1 text-xs py-2"
              />
              <ActionButton 
                type="add" 
                size="sm"
              />
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span>{movie.year}</span>
              {movie.rating && (
                <span className="px-1 border border-gray-500 text-[10px]">{movie.rating}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-2 lg:mt-3 ml-[40px] sm:ml-[45px] lg:ml-[60px]">
        <h3 className="text-white text-xs sm:text-sm font-medium truncate group-hover:text-[#1DB954] 
             transition-colors duration-200">
          {movie.title}
        </h3>
      </div>
    </motion.div>
  );
}