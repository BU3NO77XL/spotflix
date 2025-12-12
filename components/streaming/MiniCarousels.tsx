'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Star, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Movie } from '@/types/movie';

interface MiniCarouselProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
    variant?: 'minimal' | 'landscape' | 'spotlight' | 'compact' | 'numbered' | 'animated';
    accentColor?: string;
}

export default function MiniCarousel({ 
    title, 
    movies, 
    onMovieClick, 
    variant = 'minimal',
    accentColor = '#1DB954'
}: MiniCarouselProps) {
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
            const scrollAmount = scrollRef.current.clientWidth * 0.75;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!movies?.length) return null;

    // Animated - Cards with subtle continuous animation
    function AnimatedCard({ movie, onClick, accentColor }: CardProps) {
        return (
            <div
                onClick={() => onClick(movie)}
                className="shrink-0 w-[180px] sm:w-[200px] lg:w-[220px] cursor-pointer group"
            >
                <div className="flex gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-pulse-slow">
                    <div className="shrink-0 w-12 h-16 rounded overflow-hidden relative">
                        <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Animated overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                        <h3 className="text-white text-xs font-medium truncate group-hover:text-white transition-colors duration-200">
                            {movie.title}
                        </h3>
                        <p className="text-white/40 text-[10px] mt-0.5">{movie.year}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            {movie.score && (
                                <span 
                                    className="flex items-center gap-0.5 text-[10px] transition-colors duration-300"
                                    style={{ color: accentColor }}
                                >
                                    <Star className="w-2.5 h-2.5 fill-current animate-pulse-subtle" />
                                    {movie.score}
                                </span>
                            )}
                            {movie.duration && (
                                <span className="flex items-center gap-0.5 text-[10px] text-white/40">
                                    <Clock className="w-2.5 h-2.5 animate-bounce-subtle" />
                                    {movie.duration}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const CardComponent = {
        minimal: MinimalCard,
        landscape: LandscapeCard,
        spotlight: SpotlightCard,
        compact: CompactCard,
        numbered: NumberedCard,
        animated: AnimatedCard,
    }[variant];

    return (
        <section className="relative py-3 lg:py-4">
            {/* Title */}
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mb-2 lg:mb-3 flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-white">
                    {title}
                </h2>
            </div>

            {/* Carousel */}
            <div className="relative group">
                {/* Arrows */}
                <button
                    onClick={() => scroll('left')}
                    className={cn(
                        "absolute left-0 top-0 bottom-0 z-20 w-12 lg:w-16",
                        "flex items-center justify-start pl-2",
                        "transition-opacity duration-300",
                        showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <div className="p-2 bg-black/60 transition-all duration-200 backdrop-blur-sm border border-white/10">
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </div>
                </button>

                <button
                    onClick={() => scroll('right')}
                    className={cn(
                        "absolute right-0 top-0 bottom-0 z-20 w-12 lg:w-16",
                        "flex items-center justify-end pr-2",
                        "transition-opacity duration-300",
                        showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <div className="p-2 bg-black/60 transition-all duration-200 backdrop-blur-sm border border-white/10">
                        <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                </button>

                {/* Content */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-2 lg:gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth px-4 sm:px-6 lg:px-12 pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {movies.map((movie, index) => (
                        <CardComponent
                            key={movie.id}
                            movie={movie}
                            onClick={onMovieClick}
                            index={index}
                            accentColor={accentColor}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

interface CardProps {
    movie: Movie;
    onClick: (movie: Movie) => void;
    index: number;
    accentColor: string;
}

// Minimal - Clean poster only
function MinimalCard({ movie, onClick }: CardProps) {
    return (
        <div
            onClick={() => onClick(movie)}
            className="shrink-0 w-[100px] sm:w-[120px] lg:w-[140px] cursor-pointer group"
        >
            <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-white/5 transition-transform duration-300 group-hover:scale-105">
                <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 fill-white" />
                </div>
            </div>
            <p className="text-white/80 text-xs mt-1.5 truncate group-hover:text-white transition-colors">
                {movie.title}
            </p>
        </div>
    );
}

// Landscape - Wide cards with backdrop
function LandscapeCard({ movie, onClick, accentColor }: CardProps) {
    return (
        <div
            onClick={() => onClick(movie)}
            className="shrink-0 w-[200px] sm:w-[240px] lg:w-[280px] cursor-pointer group"
        >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5">
                <img
                    src={movie.backdrop_url || movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white text-sm font-medium truncate">{movie.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        {movie.score && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: accentColor }}>
                                <Star className="w-3 h-3 fill-current" />
                                {movie.score}
                            </span>
                        )}
                        <span className="text-white/50 text-xs">{movie.year}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Spotlight - Featured style with glow
function SpotlightCard({ movie, onClick, accentColor }: CardProps) {
    return (
        <div
            onClick={() => onClick(movie)}
            className="shrink-0 w-[130px] sm:w-[150px] lg:w-[170px] cursor-pointer group"
        >
            <div 
                className="relative aspect-2/3 rounded-xl overflow-hidden bg-white/5 transition-all duration-300 group-hover:shadow-lg"
                style={{ 
                    boxShadow: `0 0 0 1px ${accentColor}20`,
                }}
            >
                <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ 
                        background: `linear-gradient(to top, ${accentColor}40, transparent 60%)` 
                    }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button 
                        className="w-full py-1.5 rounded-lg text-xs font-semibold text-black transition-colors"
                        style={{ backgroundColor: accentColor }}
                    >
                        Watch
                    </button>
                </div>
            </div>
            <div className="mt-2 px-0.5">
                <h3 className="text-white text-xs font-medium truncate">{movie.title}</h3>
                <p className="text-white/40 text-[10px] mt-0.5">{movie.year}</p>
            </div>
        </div>
    );
}

// Compact - Small horizontal cards
function CompactCard({ movie, onClick }: CardProps) {
    return (
        <div
            onClick={() => onClick(movie)}
            className="shrink-0 w-[180px] sm:w-[200px] lg:w-[220px] cursor-pointer group"
        >
            <div className="flex gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200">
                <div className="shrink-0 w-12 h-16 rounded overflow-hidden">
                    <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="text-white text-xs font-medium truncate">{movie.title}</h3>
                    <p className="text-white/40 text-[10px] mt-0.5">{movie.year}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        {movie.score && (
                            <span className="flex items-center gap-0.5 text-[10px] text-[#1DB954]">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                {movie.score}
                            </span>
                        )}
                        {movie.duration && (
                            <span className="flex items-center gap-0.5 text-[10px] text-white/40">
                                <Clock className="w-2.5 h-2.5" />
                                {movie.duration}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Numbered - With ranking
function NumberedCard({ movie, onClick, index, accentColor }: CardProps) {
    return (
        <div
            onClick={() => onClick(movie)}
            className="shrink-0 w-[110px] sm:w-[130px] lg:w-[150px] cursor-pointer group"
        >
            <div className="relative">
                {/* Number */}
                <span 
                    className="absolute -left-2 -top-1 text-4xl sm:text-5xl font-black z-10 opacity-80"
                    style={{ 
                        color: 'transparent',
                        WebkitTextStroke: `2px ${accentColor}`,
                    }}
                >
                    {index + 1}
                </span>
                
                {/* Poster */}
                <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-white/5 ml-4 transition-transform duration-300 group-hover:scale-105">
                    <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            <p className="text-white/80 text-xs mt-1.5 ml-4 truncate group-hover:text-white transition-colors">
                {movie.title}
            </p>
        </div>
    );
}



// Quick access exports for specific themed carousels
export function TrendingMini({ movies, onMovieClick }: Omit<MiniCarouselProps, 'title' | 'variant'>) {
    return (
        <MiniCarousel
            title="Trending Now"
            movies={movies}
            onMovieClick={onMovieClick}
            variant="landscape"
            accentColor="#FF6B6B"
        />
    );
}

export function NewReleasesMini({ movies, onMovieClick }: Omit<MiniCarouselProps, 'title' | 'variant'>) {
    return (
        <MiniCarousel
            title="New Releases"
            movies={movies}
            onMovieClick={onMovieClick}
            variant="spotlight"
            accentColor="#1DB954"
        />
    );
}

export function QuickPicksMini({ movies, onMovieClick }: Omit<MiniCarouselProps, 'title' | 'variant'>) {
    return (
        <MiniCarousel
            title="Quick Picks"
            movies={movies}
            onMovieClick={onMovieClick}
            variant="compact"
            accentColor="#9B59B6"
        />
    );
}

export function WeeklyTopMini({ movies, onMovieClick }: Omit<MiniCarouselProps, 'title' | 'variant'>) {
    return (
        <MiniCarousel
            title="This Week's Top"
            movies={movies.slice(0, 10)}
            onMovieClick={onMovieClick}
            variant="numbered"
            accentColor="#F39C12"
        />
    );
}
