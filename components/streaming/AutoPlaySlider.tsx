'use client';

import { useState } from 'react';
import { Movie } from '@/types/movie';
import AutoPlayCarousel from '@/components/ui/AutoPlayCarousel';
import { motion } from 'framer-motion';
import { Play, Plus, Star, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            autoPlayInterval={8000}
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
    const OVERVIEW_LIMIT = 180;

    return (
        <div className="relative mx-4 sm:mx-6 lg:mx-12 mb-8">
            <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 flex flex-col md:flex-row h-auto md:h-[320px] lg:h-[380px]">

                {/* Image Section */}
                <div className="relative w-full md:w-[240px] lg:w-[280px] h-[200px] md:h-full shrink-0">
                    <img
                        src={movie.poster_url || movie.backdrop_url}
                        alt={movie.title}
                        className="w-full h-full object-cover md:hidden"
                    />
                    <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="hidden md:block w-full h-full object-cover"
                    />
                    {/* Gradient Overlay for Mobile */}
                    <div className="absolute inset-0 bg-linear-to-t from-[#1a1a1a] via-transparent to-transparent md:hidden" />
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5 sm:p-6 lg:p-8 flex flex-col justify-center relative">

                    {/* Title */}
                    <h3
                        className="text-xl sm:text-2xl lg:text-4xl font-black text-white mb-2 sm:mb-3 leading-tight cursor-pointer transition-colors"
                        onClick={() => onMovieClick(movie)}
                    >
                        {movie.title}
                    </h3>

                    {/* Metadata Minimalist */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 text-xs sm:text-sm text-gray-400">
                        {movie.score && (
                            <div className="flex items-center gap-1 text-white font-medium">
                                <Star className="w-3.5 h-3.5 text-[#1DB954] fill-[#1DB954]" />
                                <span>{movie.score}</span>
                            </div>
                        )}
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        <span>{movie.year}</span>
                        {movie.duration && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span>{movie.duration}</span>
                            </>
                        )}
                        {movie.rating && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span className="px-1.5 py-0.5 border border-gray-600 rounded text-[10px] sm:text-xs">
                                    {movie.rating}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Synopsis */}
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3 md:line-clamp-4 max-w-2xl hidden sm:block">
                        {movie.synopsis || 'Sem descrição disponível.'}
                    </p>

                    {/* Synopsis Mobile */}
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2 sm:hidden">
                        {movie.synopsis || 'Sem descrição disponível.'}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-auto md:mt-0">
                        <button
                            onClick={() => onMovieClick(movie)}
                            className="bg-white text-black hover:bg-gray-200 font-bold text-sm px-5 py-2.5 rounded-full transition-all duration-200 flex items-center gap-2"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            Assistir
                        </button>
                        <button
                            onClick={() => onMovieClick(movie)}
                            className="bg-white/10 text-white hover:bg-white/20 font-medium text-sm px-5 py-2.5 rounded-full transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Minha Lista
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}