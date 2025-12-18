'use client';

import { Play, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Movie } from '@/types/movie';

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
            className="group relative flex-shrink-0 w-[110px] sm:w-[130px] lg:w-[160px] cursor-pointer"
        >
            {/* Poster Container */}
            <div className="relative aspect-[2/3] rounded-lg lg:rounded-xl overflow-hidden 
                    bg-[#1a1a1a] transition-all duration-300 
                    group-hover:scale-105 group-hover:z-10 
                    shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                {/* Image */}
                <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-700 
                   group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent 
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
                        <button className="flex-1 flex items-center justify-center gap-1 bg-[#1DB954] hover:bg-[#1ed760] 
                             text-black font-semibold py-2 rounded-lg text-xs transition-colors">
                            <Play className="w-3 h-3 fill-current" />
                            Play
                        </button>
                        <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                            <Plus className="w-4 h-4 text-white" />
                        </button>
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

            {/* Title (always visible) */}
            <div className="mt-2 lg:mt-3">
                <h3 className="text-white text-xs sm:text-sm font-medium truncate group-hover:text-[#1DB954] 
                     transition-colors duration-200">
                    {movie.title}
                </h3>
                <p className="text-gray-500 text-xs truncate mt-0.5">
                    {movie.genre?.slice(0, 2).join(' • ')}
                </p>
            </div>
        </motion.div>
    );
}
