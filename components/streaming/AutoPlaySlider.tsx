'use client';

import { useState } from 'react';
import { Movie } from '@/types/movie';
import AutoPlayCarousel from '@/components/ui/AutoPlayCarousel';
import { motion } from 'framer-motion';
import { Play, Plus, Star, Calendar } from 'lucide-react';

interface AutoPlaySliderProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

export default function AutoPlaySlider({ title, movies, onMovieClick }: AutoPlaySliderProps) {
    if (!movies?.length) return null;

    const slides = movies.slice(0, 5).map((movie, index) => (
        <AutoPlaySlide 
          key={movie.id} 
          movie={movie} 
          onMovieClick={onMovieClick}
          index={index}
        />
    ));

    return (
        <AutoPlayCarousel 
            title={title}
            autoPlayInterval={6000}
        >
            {slides}
        </AutoPlayCarousel>
    );
}

interface AutoPlaySlideProps {
    movie: Movie;
    onMovieClick: (movie: Movie) => void;
    index: number;
}

function AutoPlaySlide({ movie, onMovieClick, index }: AutoPlaySlideProps) {
    const OVERVIEW_LIMIT = 200;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative bg-[#1a1a1a] rounded-xl overflow-hidden mx-4 sm:mx-6 lg:mx-12"
        >
            <div className="flex flex-col lg:flex-row">
                {/* Large Poster / Backdrop Area */}
                <div className="w-full lg:w-[280px] xl:w-[320px] relative aspect-2/3 lg:aspect-auto lg:h-[400px] shrink-0 border-r border-white/5">
                    <img
                        src={movie.backdrop_url || movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-black/60" />
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 lg:p-8 xl:p-10 flex flex-col justify-center">
                    <div className="max-w-2xl">
                        {/* Title */}
                        <h3 className="text-2xl lg:text-3xl xl:text-4xl font-black text-white mb-4 leading-tight">
                            {movie.title}
                        </h3>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-white font-semibold">{movie.score || '8.5'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-300">
                                <Calendar className="w-4 h-4" />
                                <span>{movie.year}</span>
                            </div>
                            {movie.rating && (
                                <span className="px-2 py-0.5 border border-gray-500 text-gray-300 text-xs rounded">
                                    {movie.rating}
                                </span>
                            )}
                            <span className="text-gray-300">{movie.duration}</span>
                        </div>

                        {/* Genres */}
                        {movie.genre && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {movie.genre.slice(0, 3).map((genre, i) => (
                                    <span key={i} className="px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Synopsis */}
                        <p className="text-gray-300 text-sm lg:text-base leading-relaxed mb-6 line-clamp-3">
                            {movie.synopsis && movie.synopsis.length > OVERVIEW_LIMIT
                                ? `${movie.synopsis.slice(0, OVERVIEW_LIMIT)}...`
                                : movie.synopsis || 'No description available.'}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => onMovieClick(movie)}
                                className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Watch Now
                            </button>
                            <button
                                onClick={() => onMovieClick(movie)}
                                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 rounded-lg backdrop-blur-sm transition-all duration-200 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                My List
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}