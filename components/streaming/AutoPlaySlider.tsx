'use client';

import { Movie } from '@/types/movie';
import AutoPlayCarousel from '@/components/ui/AutoPlayCarousel';
import { Play, Info, Star } from 'lucide-react';
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
        <div className="mb-12">
            <AutoPlayCarousel
                title={title}
                autoPlayInterval={10000}
                showIndicators={true}
            >
                {slides}
            </AutoPlayCarousel>
        </div>
    );
}

interface AutoPlaySlideProps {
    movie: Movie;
    onMovieClick: (movie: Movie) => void;
    index: number;
}

function AutoPlaySlide({ movie, onMovieClick, index }: AutoPlaySlideProps) {
    const backdropUrl = movie.backdrop_url || movie.poster_url;

    return (
        <div className="relative mx-4 sm:mx-6 lg:mx-[24px] h-[300px] sm:h-[350px] lg:h-[380px] rounded-lg overflow-hidden group">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={backdropUrl || ''}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                />
                {/* Overlays - Toned down */}
                <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/30 to-transparent" />
            </div>

            {/* Content Section */}
            <div className="absolute inset-0 flex flex-col justify-center p-8 lg:p-12 max-w-2xl">
                {/* Subtle Rating */}
                <div className="flex items-center gap-1.5 mb-3">
                    <Star className="w-4 h-4 text-[#1DB954] fill-[#1DB954]" />
                    <span className="text-white font-bold text-sm">{movie.score}</span>
                    <span className="text-gray-400 text-sm">• {movie.year}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                    {movie.title}
                </h3>

                <p className="text-gray-300 text-sm lg:text-base mb-6 line-clamp-2 max-w-xl">
                    {movie.synopsis}
                </p>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onMovieClick(movie)}
                        className="bg-white hover:bg-white/90 text-black font-bold px-6 py-2 rounded transition-all duration-200 flex items-center gap-2 text-sm"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Assistir
                    </button>
                    <button
                        onClick={() => onMovieClick(movie)}
                        className="bg-[#6D6D6E]/70 hover:bg-[#6D6D6E]/80 text-white font-bold px-6 py-2 rounded transition-all duration-200 flex items-center gap-2 backdrop-blur-md text-sm"
                    >
                        <Info className="w-4 h-4" />
                        Informações
                    </button>
                </div>
            </div>
        </div>
    );
}