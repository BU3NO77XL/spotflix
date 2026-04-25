'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Info } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ProgressiveImage from './ProgressiveImage';
import { Movie } from '@/types/movie';
import { TMDBService } from './TMDBIntegration';

interface HeroSectionProps {
    featuredMovies: Movie[];
    onWatch: (movie: Movie) => void;
    onMoreInfo: (movie: Movie) => void;
}

export default function HeroSection({ featuredMovies, onWatch, onMoreInfo }: HeroSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    
    // Cache for assets to ensure instant loading during transitions
    const [logosCache, setLogosCache] = useState<Record<string, string | null>>({});
    const [preloadedBackdrops, setPreloadedBackdrops] = useState<Set<string>>(new Set());
    
    // State synchronization: update everything at once to prevent "millisecond delay"
    const [displayContent, setDisplayContent] = useState<{
        movie: Movie;
        logo: string | null;
        isReady: boolean;
    } | null>(null);

    const isInitialMount = useRef(true);

    // 1. Initial Pre-fetching: Load everything for all featured movies upfront
    useEffect(() => {
        const prefetchAssets = async () => {
            if (!featuredMovies?.length) return;

            // Prefetch logos for all movies in the carousel
            const logoPromises = featuredMovies.map(async (movie) => {
                if (logosCache[movie.id] !== undefined) return;
                
                try {
                    const logos = await TMDBService.fetchMovieLogos(
                        Number(movie.tmdb_id || movie.id), 
                        movie.type === 'series'
                    );
                    const logoUrl = logos.length > 0 
                        ? `https://image.tmdb.org/t/p/original${logos[0].file_path}` 
                        : null;
                    
                    setLogosCache(prev => ({ ...prev, [movie.id]: logoUrl }));
                } catch (err) {
                    console.error(`Error prefetching logo for ${movie.title}:`, err);
                }
            });

            // Prefetch backdrops into browser cache
            featuredMovies.forEach(movie => {
                const url = movie.backdrop_url || movie.poster_url;
                if (url && !preloadedBackdrops.has(url)) {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => setPreloadedBackdrops(prev => new Set([...prev, url]));
                }
            });

            await Promise.all(logoPromises);
        };

        prefetchAssets();
    }, [featuredMovies]);

    // 2. Synchronized State Update: Ensure background and info change together
    useEffect(() => {
        const movie = featuredMovies[currentIndex];
        if (!movie) return;

        // If we already have the logo in cache, we can switch immediately
        const logo = logosCache[movie.id] || null;
        
        // Batch the update to ensure everything changes in the same frame
        setDisplayContent({
            movie,
            logo,
            isReady: true
        });

        // Set initial mount to false after first successful display
        if (isInitialMount.current) isInitialMount.current = false;
    }, [currentIndex, featuredMovies, logosCache]);

    // 3. Auto-rotation with high-performance interval
    useEffect(() => {
        if (featuredMovies?.length <= 1) return;

        const interval = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
        }, 12000); // Relaxed interval for better UX

        return () => clearInterval(interval);
    }, [featuredMovies?.length]);

    if (!displayContent) return null;

    const { movie, logo } = displayContent;
    const currentImageUrl = movie.backdrop_url || movie.poster_url;

    // Optimized Animation Variants
    const backdropVariants: Variants = {
        enter: (dir: number) => ({
            opacity: 0,
            scale: 1.05,
        }),
        center: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 1.2,
                ease: [0.33, 1, 0.68, 1], // Smooth ease-out
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 1.2,
                ease: [0.33, 1, 0.68, 1],
            }
        }
    };

    const contentVariants: Variants = {
        enter: { opacity: 0, y: 10 },
        center: {
            opacity: 1,
            y: 0,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
                duration: 0.6,
                ease: "easeOut"
            }
        },
        exit: { 
            opacity: 0, 
            y: -5,
            transition: { duration: 0.4, ease: "easeIn" } 
        }
    };

    const itemVariants: Variants = {
        enter: { opacity: 0, y: 10 },
        center: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
        <section className="relative h-[810px] w-full overflow-hidden bg-[#141414]">
            {/* Background Layer: High-performance Cross-fade */}
            <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                    key={`bg-${movie.id}`}
                    variants={backdropVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0"
                >
                    <ProgressiveImage
                        src={currentImageUrl || ''}
                        alt={movie.title}
                        className="w-full h-full object-cover object-top"
                        preloaded={preloadedBackdrops.has(currentImageUrl || '')}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Premium Overlays */}
            <div 
                className="absolute inset-0 z-10 pointer-events-none" 
                style={{
                    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.38) 0%, rgba(0, 0, 0, 0.08) 30%, rgba(0, 0, 0, 0.42) 78%, rgba(0, 0, 0, 0.92) 100%)'
                }}
            />
            <div 
                className="absolute inset-0 z-10 pointer-events-none" 
                style={{
                    background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.76) 0%, rgba(0, 0, 0, 0.36) 21%, rgba(0, 0, 0, 0) 44%), linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 18%)'
                }}
            />

            {/* Content Layer */}
            <div className="absolute inset-0 z-20 flex items-start justify-start">
                <div className="w-full h-full px-[38px] pt-[154px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`content-${movie.id}`}
                            variants={contentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="max-w-[518px] flex flex-col gap-[20px]"
                        >
                            {/* Logo/Title Area */}
                            <motion.div variants={itemVariants} className="min-h-[100px] flex items-end">
                                {logo ? (
                                    <img 
                                        src={logo} 
                                        alt={movie.title} 
                                        className="max-w-[518px] max-h-[207px] object-contain object-left"
                                    />
                                ) : (
                                    <h1 className="text-white font-black text-5xl leading-tight tracking-tighter uppercase drop-shadow-lg">
                                        {movie.title}
                                    </h1>
                                )}
                            </motion.div>

                            {/* Synopsis */}
                            <motion.p 
                                variants={itemVariants} 
                                className="text-white text-[17px] leading-[1.35] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] max-w-[518px]"
                            >
                                {movie.synopsis}
                            </motion.p>

                            {/* Buttons */}
                            <motion.div variants={itemVariants} className="flex items-center gap-[12px] mt-[2px]">
                                <button
                                    onClick={() => onWatch(movie)}
                                    className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white flex items-center justify-center gap-2 px-[24px] h-[42px] rounded-[4px] transition-colors"
                                >
                                    <Play className="w-6 h-6 fill-white" />
                                    <span className="text-[18px] font-bold">Assistir</span>
                                </button>
                                <button
                                    onClick={() => onMoreInfo(movie)}
                                    className="bg-[#6D6D6E]/70 hover:bg-[#6D6D6E]/80 text-white flex items-center justify-center gap-2 px-[24px] h-[42px] rounded-[4px] transition-colors backdrop-blur-md"
                                >
                                    <Info className="w-6 h-6" />
                                    <span className="text-[18px] font-bold">Mais Informações</span>
                                </button>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Rating Circle */}
            <div className="absolute right-0 top-[492px] z-20 flex items-center h-[35px]">
                <div className="relative w-[35px] h-[35px] mr-[8px] z-10">
                    <svg viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <circle cx="17.5" cy="17.5" r="17" stroke="white" strokeOpacity="0.7"/>
                        <path d="M21.7507 12.1205C21.9559 12.2231 22.0585 12.4284 22.2638 12.531C22.3664 12.6336 22.3664 12.6336 22.469 12.7362L20.6219 13.0441C20.1088 13.1467 19.6984 13.6598 19.801 14.2755C19.9036 14.7886 20.3141 15.0964 20.8271 15.0964C20.9298 15.0964 20.9298 15.0964 21.0324 15.0964L25.3423 14.2755C25.8554 14.1729 26.2659 13.6598 26.1632 13.0441L25.3423 8.83677C25.2397 8.32368 24.7266 7.91321 24.1109 8.01583C23.5978 8.11845 23.1873 8.63153 23.29 9.24724L23.5978 10.9917C23.3926 10.7865 23.0847 10.4786 22.8795 10.376C22.8795 10.376 22.8795 10.376 22.7769 10.376C22.6743 10.2734 22.5716 10.1708 22.469 10.1708C22.2638 9.96556 22.0585 9.86294 21.7507 9.6577C21.4428 9.45247 21.135 9.34985 20.8271 9.14462H20.7245C20.6219 9.042 20.4167 9.042 20.2114 8.93938C19.801 8.83677 19.3905 8.73415 19.0827 8.63153C18.8774 8.63153 18.6722 8.52892 18.4669 8.52892H18.3643C18.2617 8.52892 18.0565 8.52892 17.9539 8.52892C17.7486 8.52892 17.4408 8.52892 17.2355 8.52892C12.1047 8.52892 8 12.6336 8 17.7645C8 22.8953 12.1047 27 17.2355 27C22.3664 27 26.4711 22.8953 26.4711 17.7645C26.4711 17.1488 26.0606 16.7383 25.4449 16.7383C24.8292 16.7383 24.4187 17.1488 24.4187 17.7645C24.4187 21.7665 21.2376 24.9477 17.2355 24.9477C13.2335 24.9477 10.0523 21.7665 10.0523 17.7645C10.0523 13.7624 13.2335 10.5813 17.2355 10.5813C17.4408 10.5813 17.7486 10.5813 17.9539 10.5813C18.1591 10.5813 18.2617 10.5813 18.4669 10.6839C18.6722 10.6839 18.7748 10.7865 18.98 10.7865C19.0827 10.7865 19.1853 10.8891 19.2879 10.8891C20.0062 11.0943 20.7245 11.4022 21.3402 11.9153C21.4428 12.0179 21.5455 12.0179 21.6481 12.1205C21.6481 11.9153 21.7507 12.0179 21.7507 12.1205Z" fill="white"/>
                    </svg>
                </div>
                <div className="flex items-center bg-[#333333]/60 border-l-[3px] border-[#DCDCDC] h-[35px] pl-[12px] pr-[58px]">
                    <span className="text-white text-[18px] font-medium tracking-wider whitespace-nowrap">
                        {movie.rating || '14+'}
                    </span>
                </div>
            </div>

            {/* Bottom Gradient */}
            <div 
                className="absolute bottom-0 left-0 right-0 h-[222px] z-20 pointer-events-none"
                style={{
                    background: 'linear-gradient(180deg, rgba(20, 20, 20, 0) 0%, rgba(20, 20, 20, 0.15) 12.06%, rgba(20, 20, 20, 0.35) 25.99%, rgba(20, 20, 20, 0.58) 52.22%, rgba(20, 20, 20, 1) 100%)'
                }}
            />
        </section>
    );
}
