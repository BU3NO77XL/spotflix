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

  const isFirst = rank === 1;
  const isTenth = rank === 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={() => onClick(movie)}
      className={cn(
        "group relative shrink-0 cursor-pointer",
        "h-[145px] md:h-[145px] lg:h-[185px] xl:h-[230px]",
        isTenth
          ? "w-[228px] lg:w-[289px] xl:w-[359px]"
          : isFirst
          ? "w-[181px] lg:w-[232px] xl:w-[291px]"
          : "w-[199px] lg:w-[255px] xl:w-[320px]"
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 overflow-hidden select-none pointer-events-none flex items-center justify-end",
          "h-[145px] md:h-[145px] lg:h-[185px] xl:h-[230px]",
          isTenth
            ? "w-[158px] lg:w-[198px] xl:w-[243px]"
            : isFirst
            ? "w-[112px] lg:w-[143px] xl:w-[178px]"
            : "w-[120px] lg:w-[153px] xl:w-[190px]"
        )}
        style={{ zIndex: -1 }}
      >
        <span
          className={cn(
            "font-bold text-transparent text-right leading-none",
            isTenth
              ? "text-[172px] lg:text-[219px] xl:text-[272px]"
              : "text-[189px] lg:text-[241px] xl:text-[299px]"
          )}
          style={{
            WebkitTextStroke: '6px #666',
            fontFamily: '"Netflix Sans"',
          }}
        >
          {rank}
        </span>
      </div>

      <div className={cn(
        "relative z-10 rounded-sm sm:rounded-md overflow-hidden bg-[#222] transition-all duration-300 group-hover:z-30",
        isTenth
          ? "ml-[123px] lg:ml-[154px] xl:ml-[189px]"
          : isFirst
          ? "ml-[76px] lg:ml-[97px] xl:ml-[121px]"
          : "ml-[94px] lg:ml-[120px] xl:ml-[150px]",
        "w-[105px] h-[145px] md:w-[105px] md:h-[145px] lg:w-[135px] lg:h-[185px] xl:w-[170px] xl:h-[230px]"
      )}>
        <img
          src={movie.poster_url || undefined}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700"
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent 
            opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-1 left-1 z-10">
          <Top10Badge />
        </div>

        <div className="absolute inset-0 p-2 opacity-0 group-hover:opacity-100 
            transition-all duration-300 flex flex-col justify-end z-20">

          <div className="flex items-center justify-between mb-1.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!localStorage.getItem('userBasicInfo')) {
                      window.dispatchEvent(new Event('requireLogin'));
                      return;
                  }
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
              title="Mais informacoes"
            >
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </button>
          </div>

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

          {movie.genre && movie.genre.length > 0 && (
            <div className="mt-0.5 text-[9px] sm:text-[10px] text-gray-300 truncate translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-100">
              {movie.genre.slice(0, 2).join(' • ')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
