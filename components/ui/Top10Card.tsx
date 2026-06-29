'use client';

import { motion } from 'framer-motion';
import { Play, ChevronDown, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Movie } from '@/types/movie';
import Top10Badge from './Top10Badge';

interface Top10CardProps {
  movie: Movie;
  rank: number;
  onClick: (movie: Movie) => void;
  index: number;
}

export default function Top10Card({ movie, rank, onClick, index }: Top10CardProps) {
  const router = useRouter();

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
              fontFamily: '"Netflix Sans"'
            }}
          >
            {rank}
          </span>
        </div>

        {/* Poster Container */}
        <div className={cn(
          "absolute top-0 z-10 rounded-sm sm:rounded-md overflow-hidden bg-[#222] transition-all duration-300 group-hover:z-30",
          // Poster Dimensions: responsive
          "w-[109px] h-[154px] md:w-[106px] md:h-[150px] lg:w-[134px] lg:h-[190px] xl:w-[162px] xl:h-[230px]",
          // Poster Position: precise 80% overlap for 1-9, exact 50% of '0' for 10 on all screens
          rank === 10
            ? "left-[100px] md:left-[55px] lg:left-[72px] xl:left-[90px]"
            : "left-[35px] md:left-[30px] lg:left-[40px] xl:left-[50px]"
        )}>
          {/* Image */}
          <img
            src={movie.poster_url || undefined}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-700"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top 10 Badge */}
          <div className="absolute top-1 left-1 z-10">
            <Top10Badge />
          </div>

          {/* Hover Content - Netflix Style */}
          <div className="absolute inset-0 p-2 opacity-0 group-hover:opacity-100 
              transition-all duration-300 flex flex-col justify-end z-20">
            
            {/* Action Buttons Row */}
            <div className="flex items-center justify-between mb-1.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/watch?id=${movie.tmdb_id}&type=${movie.type}&ref=${movie.tmdb_id}&rank=${rank}`);
                  }}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                  title="Assistir"
                >
                  <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black fill-current ml-0.5" />
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(movie);
                }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#2a2a2a]/90 hover:bg-[#444] border border-white/40 text-white flex items-center justify-center transition-all hover:scale-110"
                title="Mais informações"
              >
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </button>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-1 text-[10px] text-gray-200 font-medium translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75 flex-wrap">
              {movie.score && (
                <div className="flex items-center gap-0.5 text-yellow-400 font-bold">
                  <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                  <span>{(movie.score / 2).toFixed(1)}</span>
                </div>
              )}
              {movie.rating && (
                <span className="px-1 py-0.2 border border-gray-400 rounded text-[9px] leading-tight font-semibold text-gray-300">
                  {movie.rating}
                </span>
              )}
              <span className="border border-white/40 px-1 py-0.2 rounded text-[8px] font-bold text-gray-300">HD</span>
            </div>

            {/* Genres Row */}
            {movie.genre && movie.genre.length > 0 && (
              <div className="mt-0.5 text-[9px] sm:text-[10px] text-gray-300 truncate translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                {movie.genre.slice(0, 2).join(' • ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}