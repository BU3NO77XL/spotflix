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
    top10Ranks?: Record<number, number>;
}

export default function HeroSection({ featuredMovies, onWatch, onMoreInfo, top10Ranks }: HeroSectionProps) {
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
        }, 300000); // 5 minutes interval for relaxed UX

        return () => clearInterval(interval);
    }, [featuredMovies?.length]);

    if (!displayContent) return null;

    const { movie, logo } = displayContent;
    const currentImageUrl = movie.backdrop_url || movie.poster_url;
    const rank = movie.tmdb_id != null ? top10Ranks?.[movie.tmdb_id] : undefined;

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
                <div className="w-full h-full px-4 md:px-[38px] pt-[154px]">
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
                                        className="w-[80%] md:w-auto md:max-w-[518px] max-h-[120px] md:max-h-[207px] object-contain object-left"
                                    />
                                ) : (
                                    <h1 className="text-white font-black text-3xl md:text-5xl leading-tight tracking-tighter uppercase drop-shadow-lg">
                                        {movie.title}
                                    </h1>
                                )}
                            </motion.div>

                            {rank && (
                                <motion.div variants={itemVariants} className="flex items-center">
                                    <svg viewBox="0 0 245 30" fill="none" className="w-[280px] md:w-[360px] h-auto" aria-label={`#${rank} em ${movie.type === 'series' ? 'Séries' : 'Filmes'} hoje`}>
                                        <rect y="1.0957" width="27.8086" height="27.8086" rx="3.47608" fill="#F50723"/>
                                        <path d="M7.72649 13.7028H6.16834V8.3974H4.05576V7.04955H9.83908V8.3974H7.72649V13.7028Z" fill="white"/>
                                        <path d="M13.27 13.8557C12.7729 13.8557 12.3141 13.7697 11.903 13.5976C11.4824 13.4255 11.1192 13.1866 10.8228 12.8711C10.5169 12.5557 10.278 12.1924 10.1155 11.7622C9.94339 11.3416 9.85736 10.8828 9.85736 10.3762C9.85736 9.86951 9.94339 9.41067 10.1155 8.98051C10.278 8.5599 10.5169 8.19665 10.8228 7.8812C11.1192 7.56574 11.4824 7.32676 11.903 7.1547C12.3141 6.98263 12.7729 6.8966 13.27 6.8966C13.7766 6.8966 14.2355 6.98263 14.6561 7.1547C15.0671 7.32676 15.4304 7.56574 15.7363 7.8812C16.0422 8.19665 16.2812 8.5599 16.4532 8.98051C16.6157 9.41067 16.7018 9.86951 16.7018 10.3762C16.7018 10.8828 16.6157 11.3416 16.4532 11.7622C16.2812 12.1924 16.0422 12.5557 15.7363 12.8711C15.4304 13.1866 15.0671 13.4255 14.6561 13.5976C14.2355 13.7697 13.7766 13.8557 13.27 13.8557ZM13.27 12.4792C13.6333 12.4792 13.9583 12.3931 14.2355 12.2115C14.5127 12.0395 14.723 11.7909 14.8855 11.4755C15.048 11.16 15.1245 10.7968 15.1245 10.3762C15.1245 9.95555 15.048 9.58274 14.8855 9.26728C14.723 8.95183 14.5127 8.71285 14.2355 8.53123C13.9583 8.35916 13.6333 8.27313 13.27 8.27313C12.9163 8.27313 12.6009 8.35916 12.3236 8.53123C12.0464 8.71285 11.8266 8.95183 11.6736 9.26728C11.5111 9.58274 11.4346 9.95555 11.4346 10.3762C11.4346 10.7968 11.5111 11.16 11.6736 11.4755C11.8266 11.7909 12.0464 12.0395 12.3236 12.2115C12.6009 12.3931 12.9163 12.4792 13.27 12.4792Z" fill="white"/>
                                        <path d="M17.3002 13.7028V7.04955H20.0533C20.5982 7.04955 21.0761 7.14514 21.4681 7.33632C21.86 7.52751 22.1659 7.79517 22.3762 8.1393C22.5865 8.48343 22.6916 8.88492 22.6916 9.34376C22.6916 9.8026 22.5865 10.2041 22.3762 10.5482C22.1659 10.9019 21.86 11.1696 21.4681 11.3608C21.0761 11.5519 20.5982 11.6475 20.0533 11.6475H18.8584V13.7028H17.3002ZM18.8584 10.3284H19.8239C20.2732 10.3284 20.5982 10.2423 20.8085 10.0703C21.0092 9.90775 21.1144 9.65921 21.1144 9.34376C21.1144 9.0283 21.0092 8.78932 20.8085 8.61726C20.5982 8.45475 20.2732 8.36872 19.8239 8.36872H18.8584V10.3284Z" fill="white"/>
                                        <text x="9" y="24" fill="white" fontSize="13" fontWeight="900" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif">{rank}</text>
                                        <text x="35" y="21" fill="white" fontSize="17" fontWeight="700" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif">#{rank} em {movie.type === 'series' ? 'Séries' : 'Filmes'} hoje</text>
                                    </svg>
                                </motion.div>
                            )}

                            {/* Synopsis */}
                            <motion.p 
                                variants={itemVariants} 
                                className="text-white text-[17px] leading-[1.35] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] max-w-[518px] line-clamp-3 md:line-clamp-none"
                            >
                                {movie.synopsis}
                            </motion.p>

                            {/* Buttons */}
                            <motion.div variants={itemVariants} className="flex items-center gap-2 md:gap-[16px] mt-[2px]">
                                <button
                                    onClick={() => onWatch(movie)}
                                    className="bg-white hover:bg-gray-200 text-black flex items-center justify-center gap-1 md:gap-2 px-5 md:px-[32px] h-[50px] md:h-[52px] rounded-[4px] transition-colors"
                                >
                                    <Play className="w-6 h-6 md:w-7 md:h-7 fill-black" />
                                    <span className="text-[18px] md:text-[20px] font-bold">Assistir</span>
                                </button>
                                <button
                                    onClick={() => onMoreInfo(movie)}
                                    className="bg-[#6D6D6E]/70 hover:bg-[#6D6D6E]/80 text-white flex items-center justify-center gap-1 md:gap-2 px-5 md:px-[32px] h-[50px] md:h-[52px] rounded-[4px] transition-colors backdrop-blur-md"
                                >
                                    <Info className="w-6 h-6 md:w-7 md:h-7" />
                                    <span className="text-[18px] md:text-[20px] font-bold hidden md:block">Mais Informações</span>
                                    <span className="text-[18px] font-bold md:hidden">Informação</span>
                                </button>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Rating Circle */}
            <div className="absolute right-0 top-[500px] md:top-[492px] z-20 flex items-center h-[35px]">
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
