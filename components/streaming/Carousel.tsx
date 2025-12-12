'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import { cn } from '@/lib/utils';
import { Movie } from '@/types/movie';

interface CarouselProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

export default function Carousel({ title, movies, onMovieClick }: CarouselProps) {
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

    return (
        <section className="relative py-4 lg:py-6 group/section">
            {/* Section Title */}
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mb-3 lg:mb-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">
                    {title}
                </h2>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className={cn(
                        "absolute left-0 top-0 bottom-4 z-20 w-12 lg:w-16",
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
                        "absolute right-0 top-0 bottom-4 z-20 w-12 lg:w-16",
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
                    {movies.map((movie, index) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            onClick={onMovieClick}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
