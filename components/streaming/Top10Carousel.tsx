'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Movie } from '@/types/movie';

interface Top10CarouselProps {
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

export default function Top10Carousel({ movies, onMovieClick }: Top10CarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.8;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!movies?.length) return null;

    const top10Movies = movies.slice(0, 10);

    return (
        <section className="relative py-4 lg:py-6 group/section">
            {/* Section Title */}
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mb-3 lg:mb-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">
                    Top 10 Today
                </h2>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className={cn(
                        "absolute left-0 top-0 bottom-12 z-20 w-12 lg:w-16",
                        "flex items-center justify-start pl-2",
                        "transition-opacity duration-300",
                        showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <div className="p-2 rounded-lg bg-white/10 transition-all duration-200 backdrop-blur-sm">
                        <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className={cn(
                        "absolute right-0 top-0 bottom-12 z-20 w-12 lg:w-16",
                        "flex items-center justify-end pr-2",
                        "transition-opacity duration-300",
                        showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <div className="p-2 rounded-lg bg-white/10 transition-all duration-200 backdrop-blur-sm">
                        <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                </button>

                {/* Scrollable Content */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-3 lg:gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth px-4 sm:px-6 lg:px-12 pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {top10Movies.map((movie, index) => (
                        <Top10Card
                            key={movie.id}
                            movie={movie}
                            rank={index + 1}
                            onClick={onMovieClick}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

interface Top10CardProps {
    movie: Movie;
    rank: number;
    onClick: (movie: Movie) => void;
    index: number;
}

function Top10Card({ movie, rank, onClick, index }: Top10CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            onClick={() => onClick(movie)}
            className="group relative flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[220px] cursor-pointer"
        >
            <div className="relative flex items-end">
                {/* Ranking Number - Refined outlined number with thinner elegant white stroke */}
                <div className="relative z-10 flex-shrink-0 mr-[-20px] sm:mr-[-25px] lg:mr-[-30px]">
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
                <div className="relative aspect-[2/3] w-full rounded-lg lg:rounded-xl overflow-hidden 
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
