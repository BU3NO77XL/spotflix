'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Movie } from '@/types/movie';

interface BackdropCarouselProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
    backdropUrl?: string | null;
}

export default function BackdropCarousel({ title, movies, onMovieClick, backdropUrl }: BackdropCarouselProps) {
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

    // Remover backdrop para os carrosséis "Best Rated Movies" e "Coming Soon to Theaters"
    const shouldShowBackdrop = title !== "Best Rated Movies" && title !== "Coming Soon to Theaters";

    // Use provided backdrop or fallback to first movie's backdrop
    const effectiveBackdrop = shouldShowBackdrop ? (backdropUrl || movies[0]?.backdrop_url) : null;

    return (
        <section className={cn("relative py-8 lg:py-12 group/section overflow-hidden", 
            !shouldShowBackdrop && "py-4 lg:py-6")}>
            {/* Backdrop Image - apenas para carrosséis que não são "Best Rated Movies" ou "Coming Soon to Theaters" */}
            {effectiveBackdrop && (
                <div className="absolute inset-0 z-0">
                    <motion.img
                        src={effectiveBackdrop}
                        alt=""
                        className="w-full h-full object-cover"
                        initial={{ scale: 1 }}
                        animate={{ scale: 1.05 }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "linear"
                        }}
                    />

                    {/* Cinematic Overlay System */}
                    {/* 1. Radial Vignette: Focuses light on center (-20% opacity) and darkens corners */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0a_90%)] opacity-80" />

                    {/* 2. Side Fade: Ensures text on left is readable */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent opacity-90" />

                    {/* 3. Bottom Fade: Seamless blend into page background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
                </div>
            )}

            {/* Content */}
            <div className={cn("relative z-10", !shouldShowBackdrop && "pt-0")}>
                {/* Section Title */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{}}
                    transition={{ duration: 0.5 }}
                    className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mb-4 lg:mb-6"
                >
                    <h2 className={cn("text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight",
                        !shouldShowBackdrop && "text-lg sm:text-xl lg:text-2xl mb-3 lg:mb-4")}>
                        {title}
                    </h2>
                </motion.div>

                {/* Carousel Container */}
                <div className="relative">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scroll('left')}
                        className={cn(
                            "absolute left-0 top-0 bottom-0 z-20 w-12 lg:w-16",
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
                            "absolute right-0 top-0 bottom-0 z-20 w-12 lg:w-16",
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
                    <motion.div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex gap-3 lg:gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth px-4 sm:px-6 lg:px-12 pb-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {movies.map((movie, index) => (
                            <div key={movie.id} className="flex-shrink-0">
                                <MovieCard
                                    movie={movie}
                                    onClick={onMovieClick}
                                    index={0}
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
