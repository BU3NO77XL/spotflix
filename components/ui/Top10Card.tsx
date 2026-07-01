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

const BASE_H = 200;
const GAP = 130;
const GAP_1 = 105;
const NUM_W = 165;
const NUM_W_1 = 155;
const FONT_SZ = 260;
const STROKE_W = 6;

function scale(val: number, h: number): number {
  return Math.round(val * h / BASE_H);
}

const hMap = [
  { bp: '', h: 175 },
  { bp: 'md:', h: 175 },
  { bp: 'lg:', h: 220 },
  { bp: 'xl:', h: 265 },
] as const;

function cardWidth(h: number, rank: number, posterW: number): number {
  const gap = rank === 1 ? GAP_1 : GAP;
  return Math.round(gap * h / BASE_H) + posterW;
}

const pwMap: Record<string, number> = {
  '': 125,
  'md:': 125,
  'lg:': 155,
  'xl:': 190,
};

export default function Top10Card({ movie, rank, onClick, index }: Top10CardProps) {
  const router = useRouter();

  const gapVal = rank === 1 ? GAP_1 : GAP;
  const numWVal = rank === 1 ? NUM_W_1 : NUM_W;

  const wClasses = hMap.map(({ bp, h }) => {
    const w = cardWidth(h, rank, pwMap[bp] ?? 125);
    return `${bp}w-[${w}px]`;
  }).join(' ');

  const mlClasses = hMap.map(({ bp, h }) => {
    const ml = scale(gapVal, h);
    return `${bp}ml-[${ml}px]`;
  }).join(' ');

  const numWClasses = hMap.map(({ bp, h }) => {
    const nw = scale(numWVal, h);
    return `${bp}w-[${nw}px]`;
  }).join(' ');

  const fsClasses = hMap.map(({ bp, h }) => {
    const fs = scale(FONT_SZ, h);
    return `${bp}text-[${fs}px]`;
  }).join(' ');

  const lhClasses = hMap.map(({ bp, h }) => {
    return `${bp}leading-[${h}px]`;
  }).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={() => onClick(movie)}
      className={cn(
        "group relative shrink-0 cursor-pointer",
        "h-[175px] md:h-[175px] lg:h-[220px] xl:h-[265px]",
        wClasses
      )}
    >
      {/* Número — estilo Netflix: absolute left:0, z-index:-1, stroke #666, fundo transparente */}
      <div
        className={cn(
          "absolute left-0 top-0 overflow-hidden select-none pointer-events-none",
          numWClasses,
          "h-[175px] md:h-[175px] lg:h-[220px] xl:h-[265px]"
        )}
        style={{ zIndex: -1 }}
      >
        <span
          className={cn(
            "font-bold block text-transparent text-right w-full",
            fsClasses,
            lhClasses
          )}
          style={{
            WebkitTextStroke: `${STROKE_W}px #666`,
            fontFamily: '"Netflix Sans"',
          }}
        >
          {rank}
        </span>
      </div>

      {/* Poster Container */}
      <div className={cn(
        "relative z-10 rounded-sm sm:rounded-md overflow-hidden bg-[#222] transition-all duration-300 group-hover:z-30",
        mlClasses,
        "w-[125px] h-[175px] md:w-[125px] md:h-[175px] lg:w-[155px] lg:h-[220px] xl:w-[190px] xl:h-[265px]"
      )}>
        {/* Image */}
        <img
          src={movie.poster_url || undefined}
          alt={movie.title}
          loading="lazy"
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
    </motion.div>
  );
}
