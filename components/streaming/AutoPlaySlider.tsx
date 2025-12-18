'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '@/types/movie';

interface AutoPlaySliderProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

const AUTO_PLAY_INTERVAL = 6000;
const PAUSE_AFTER_INTERACTION = 120000;

export default function AutoPlaySlider({ title, movies, onMovieClick }: AutoPlaySliderProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const OVERVIEW_LIMIT = 200;

    const handleScrollArrows = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.6;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        handleScrollArrows();
        // Check arrows on resize
        window.addEventListener('resize', handleScrollArrows);
        return () => window.removeEventListener('resize', handleScrollArrows);
    }, [movies]);

    const selectedMovie = movies[selectedIndex];

    useEffect(() => {
        if (isPaused || movies.length <= 1) return;
        const interval = setInterval(() => {
            setSelectedIndex((prev) => {
                const nextIndex = (prev + 1) % movies.length;
                // Auto scroll to next item logic can be added here if desired, 
                // but usually user controls scroll separately in this design
                return nextIndex;
            });
        }, AUTO_PLAY_INTERVAL);
        return () => clearInterval(interval);
    }, [isPaused, movies.length]);

    // Update scroll position when selectedIndex changes drastically or if we want to follow selection
    // In CastSlider, we center the selected item
    useEffect(() => {
        const container = scrollRef.current;
        const child = container?.children[selectedIndex] as HTMLElement;
        if (container && child) {
            // Optional: only scroll if out of view
            const containerRect = container.getBoundingClientRect();
            const childRect = child.getBoundingClientRect();

            // Simple center logic
            const scrollLeft = child.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (childRect.width / 2);
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);

    const handleUserInteraction = useCallback((index: number) => {
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        setIsPaused(true);
        setSelectedIndex(index);
        pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), PAUSE_AFTER_INTERACTION);
    }, []);

    useEffect(() => {
        return () => {
            if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        };
    }, []);

    if (!movies?.length) return null;

    return (
        <section className="py-6 lg:py-8 group/section">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mb-4">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight mb-4">
                    {title}
                </h2>

                {/* Main Content Area */}
                <div className="bg-[#141414] rounded-xl overflow-hidden shadow-xl border border-white/5 relative">
                    {/* Background Backdrop with Overlay */}
                    <div className="absolute inset-0 z-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                className="w-full h-full relative"
                            >
                                <img
                                    src={selectedMovie.backdrop_url || selectedMovie.poster_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-[#141414]/90 backdrop-blur-sm" />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-row relative z-10">
                        {/* Large Poster / Backdrop Area */}
                        <div className="w-[110px] sm:w-[150px] lg:w-[240px] xl:w-[280px] relative aspect-[2/3] shrink-0 border-r border-white/5">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full h-full relative"
                                >
                                    <img
                                        src={selectedMovie.poster_url}
                                        alt={selectedMovie.title}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Progress bar */}
                                    {!isPaused && movies.length > 1 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 z-20">
                                            <motion.div
                                                key={selectedIndex}
                                                className="h-full bg-[#1DB954]"
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: 'linear' }}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Info Area */}
                        <div className="flex-1 p-3 sm:p-6 flex flex-col justify-center relative z-10 min-w-0">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4 }}
                                    className="space-y-3 sm:space-y-4"
                                >
                                    <div className="space-y-1">
                                        <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white leading-tight truncate">
                                            {selectedMovie.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-400">
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-white font-medium">
                                                <Star className="w-3 h-3 text-[#1DB954] fill-[#1DB954]" />
                                                {selectedMovie.score}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {selectedMovie.year}
                                            </span>
                                            {selectedMovie.rating && (
                                                <span className="px-1.5 py-0.5 border border-gray-600 rounded text-[10px]">
                                                    {selectedMovie.rating}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-3">
                                        {selectedMovie.synopsis}
                                    </p>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <button
                                            onClick={() => onMovieClick(selectedMovie)}
                                            className="flex items-center gap-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-1.5 sm:py-2 px-4 sm:px-6 rounded-full transition-transform hover:scale-105 active:scale-95 text-[10px] sm:text-xs md:text-sm"
                                        >
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            Play
                                        </button>
                                        <button
                                            onClick={() => onMovieClick(selectedMovie)}
                                            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold py-1.5 sm:py-2 px-4 sm:px-6 rounded-full transition-colors text-[10px] sm:text-xs md:text-sm"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            More Info
                                        </button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Thumbnails Slider (inside the content area, below info) */}
                            <div className="mt-3 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10 relative">
                                <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Up Next</p>

                                <div className="relative group">
                                    {/* Left Arrow */}
                                    <button
                                        onClick={() => scrollCarousel('left')}
                                        className={`absolute -left-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/80 rounded-lg transition-all duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                    >
                                        <ChevronLeft className="w-4 h-4 text-white" />
                                    </button>

                                    {/* Right Arrow */}
                                    <button
                                        onClick={() => scrollCarousel('right')}
                                        className={`absolute -right-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/80 rounded-lg transition-all duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                    >
                                        <ChevronRight className="w-4 h-4 text-white" />
                                    </button>

                                    <div
                                        ref={scrollRef}
                                        onScroll={handleScrollArrows}
                                        className="flex gap-2 overflow-x-auto scrollbar-hide py-4 px-2 mx-1 scroll-smooth items-center"
                                    >
                                        {movies.map((movie, index) => (
                                            <button
                                                key={movie.id}
                                                onClick={() => handleUserInteraction(index)}
                                                className={`relative shrink-0 transition-all duration-300 ${index === selectedIndex
                                                    ? 'ring-2 ring-[#1DB954] ring-offset-2 ring-offset-[#141414] scale-110 opacity-100 drop-shadow-md z-10'
                                                    : 'opacity-50 hover:opacity-100 hover:scale-105'
                                                    }`}
                                            >
                                                <div className="w-[50px] h-[75px] lg:w-[70px] lg:h-[105px] rounded border border-white/10 overflow-hidden bg-gray-800">
                                                    <img
                                                        src={movie.poster_url}
                                                        alt={movie.title}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
