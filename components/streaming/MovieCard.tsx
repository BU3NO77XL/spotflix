'use client';

import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { Movie } from '@/types/movie';
import PlayButton from '@/components/ui/PlayButton';
import ActionButton from '@/components/ui/ActionButton';

interface MovieCardProps {
    movie: Movie;
    onClick: (movie: Movie) => void;
    index?: number;
}

export default function MovieCard({ movie, onClick, index = 0 }: MovieCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            onClick={() => onClick(movie)}
            className="group relative shrink-0 w-[110px] sm:w-[130px] lg:w-[160px] cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(movie);
                }
            }}
            aria-label={`View details for ${movie.title}`}
        >
            {/* Poster Container */}
            <div className="relative aspect-2/3 rounded-lg lg:rounded-xl overflow-hidden 
                    bg-[#1f1f1f] transition-all duration-300 
                    group-hover:z-10 
                    shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                {/* Image */}
                <img
                    src={movie.poster_url}
                    alt={`${movie.title} poster`}
                    className="w-full h-full object-cover transition-transform duration-700"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Score Badge */}
                {movie.score && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm 
                        px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300
                        transform translate-y-2 group-hover:translate-y-0"
                        aria-label={`Rating: ${movie.score} out of 10`}
                    >
                        <svg className="w-3 h-3 text-[#1DB954] fill-[#1DB954]" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-white text-xs font-semibold">{movie.score}</span>
                    </div>
                )}

                {/* Hover Content */}
                <div className="absolute inset-0 p-3 opacity-0 group-hover:opacity-100 
                      transition-all duration-300 flex flex-col justify-end">



                    {/* Meta */}
                    <div className="relative z-10 flex items-center gap-2 text-xs text-gray-300 font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <span>{movie.year}</span>
                        {movie.rating && (
                            <span className="px-1.5 py-0.5 border border-gray-500 rounded text-[10px]" aria-label={`Rated ${movie.rating}`}>
                                {movie.rating}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Title (always visible) - DISABLED */}
            {/* <div className="mt-2 lg:mt-3">
                <h3 className="text-white text-xs sm:text-sm font-medium truncate group-hover:text-[#1DB954] 
                     transition-colors duration-200">
                    {movie.title}
                </h3>
                <p className="text-gray-500 text-xs truncate mt-0.5">
                    {movie.genre?.slice(0, 2).join(' • ')}
                </p>
            </div> */}
        </motion.div>
    );
}