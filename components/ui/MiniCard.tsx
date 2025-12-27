'use client';

import { motion } from 'framer-motion';
import { Play, Star } from 'lucide-react';
import { Movie } from '@/types/movie';

interface MiniCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  index?: number;
  variant?: 'landscape' | 'portrait';
  accentColor?: string;
}

export default function MiniCard({ 
  movie, 
  onClick, 
  index = 0, 
  variant = 'portrait',
  accentColor = '#1DB954'
}: MiniCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onClick(movie)}
      className="group relative shrink-0 cursor-pointer"
      style={{ width: variant === 'landscape' ? '200px' : '140px' }}
    >
      {variant === 'landscape' ? (
        // Landscape Layout
        <div className="bg-[#1a1a1a] rounded-lg overflow-hidden group-hover:bg-[#222] transition-all duration-300">
          <div className="flex">
            {/* Poster */}
            <div className="w-16 h-24 shrink-0 relative">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              {/* Animated overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <div className="p-3">
                <h3 className="text-white text-sm font-medium truncate mb-1 group-hover:text-[#1DB954] transition-colors">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <span>{movie.year}</span>
                  {movie.score && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span>{movie.score}</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-500 text-xs line-clamp-2">
                  {movie.genre?.slice(0, 2).join(' • ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Portrait Layout
        <div className="space-y-2">
          <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-[#1a1a1a] group-hover:scale-105 transition-transform duration-300">
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-white text-sm font-medium truncate">{movie.title}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                <span>{movie.year}</span>
                {movie.rating && (
                  <span className="px-1 border border-gray-500 text-[10px]">{movie.rating}</span>
                )}
              </div>
            </div>

            {/* Hover Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
                style={{ backgroundColor: accentColor }}
              >
                <Play className="w-5 h-5 text-white fill-current ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}