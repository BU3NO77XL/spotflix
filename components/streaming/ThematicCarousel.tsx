'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Movie } from '@/types/movie';

interface ThematicCarouselProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

export default function ThematicCarousel({ title, movies, onMovieClick }: ThematicCarouselProps) {
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
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{}}
                transition={{ duration: 0.5 }}
                className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mb-3 lg:mb-4"
            >
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">
                    {title}
                </h2>
            </motion.div>

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
                        <ThematicCard
                            key={movie.id}
                            movie={movie}
                            onClick={onMovieClick}
                            index={index}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

interface ThematicCardProps {
    movie: Movie;
    onClick: (movie: Movie) => void;
    index: number;
}

function ThematicCard({ movie, onClick, index }: ThematicCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-50px" }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            onClick={() => onClick(movie)}
            className="group relative flex-shrink-0 w-[140px] sm:w-[160px] lg:w-[200px] cursor-pointer"
        >
            {/* Poster Container */}
            <motion.div
                whileHover={{
                    scale: 1.08,
                    rotateY: 2,
                    rotateX: -2,
                    z: 50
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative aspect-[2/3] rounded-lg lg:rounded-xl overflow-hidden 
                  bg-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.5)]
                  group-hover:shadow-[0_12px_32px_rgba(29,185,84,0.3)]"
                style={{ transformStyle: "preserve-3d" }}
            >
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

                {/* Hover Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-x-0 bottom-0 p-3"
                >
                    <div className="flex gap-2 mb-2">
                        <button className="flex-1 flex items-center justify-center gap-1 bg-[#1DB954] hover:bg-[#1ed760] 
                             text-black font-semibold py-2 rounded-lg text-xs transition-colors">
                            Play
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            {/* Title */}
            <div className="mt-2 lg:mt-3">
                <h3 className="text-white text-xs sm:text-sm font-medium truncate group-hover:text-[#1DB954] 
                     transition-colors duration-200">
                    {movie.title}
                </h3>
                <p className="text-gray-500 text-xs truncate mt-0.5">
                    {movie.year}
                </p>
            </div>
        </motion.div>
    );
}
