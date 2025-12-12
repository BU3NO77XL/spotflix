'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '@/types/movie';
import { convertScoreToFivePoint } from '@/lib/utils';
import { TMDBService } from './TMDBIntegration';

interface HeroSectionProps {
    featuredMovies: Movie[];
    onWatch: (movie: Movie) => void;
    onMoreInfo: (movie: Movie) => void;
}

export default function HeroSection({ featuredMovies, onWatch, onMoreInfo }: HeroSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
    const [isReady, setIsReady] = useState(false);
    const [seriesDetails, setSeriesDetails] = useState<Record<string, { runtime: string; year?: number }>>({});
    
    const featured = featuredMovies?.[currentIndex];
    
    // Extract dependencies to avoid issues with optional chaining in useEffect deps
    const featuredId = featured?.id;
    const featuredType = featured?.type;
    const featuredTmdbId = featured?.tmdb_id;

    // Fetch series details for accurate season count
    useEffect(() => {
        const fetchSeriesDetails = async () => {
            if (featured && featuredType === 'series' && featuredTmdbId && !seriesDetails[featuredId]) {
                try {
                    const seriesData = await TMDBService.fetchSeriesDetails(featuredTmdbId);
                    if (seriesData) {
                        setSeriesDetails(prev => ({
                            ...prev,
                            [featuredId]: {
                                runtime: `${seriesData.number_of_seasons} Temporada${seriesData.number_of_seasons !== 1 ? 's' : ''}`,
                                year: seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : undefined
                            }
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching series details:', error);
                }
            }
        };

        fetchSeriesDetails();
    }, [featuredId, featuredType, featuredTmdbId, seriesDetails]);

    // Preload images
    const preloadImage = useCallback((index: number) => {
        if (!featuredMovies?.[index] || loadedImages.has(index)) return Promise.resolve();
        
        return new Promise<void>((resolve) => {
            const img = new Image();
            const src = featuredMovies[index].backdrop_url || featuredMovies[index].poster_url;
            img.onload = () => {
                setLoadedImages(prev => new Set([...prev, index]));
                resolve();
            };
            img.onerror = () => resolve();
            img.src = src || '';
        });
    }, [featuredMovies, loadedImages]);

    // Preload adjacent images
    useEffect(() => {
        if (featuredMovies?.length > 1) {
            const next = (currentIndex + 1) % featuredMovies.length;
            const prev = (currentIndex - 1 + featuredMovies.length) % featuredMovies.length;
            preloadImage(next);
            preloadImage(prev);
            setIsReady(true);
        }
    }, [currentIndex, featuredMovies?.length, preloadImage]);

    // Auto-advance
    useEffect(() => {
        if (featuredMovies?.length > 1 && isReady) {
            const interval = setInterval(() => {
                setDirection(1);
                setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [featuredMovies?.length, isReady]);

    const goToSlide = async (index: number) => {
        if (index === currentIndex) return;
        setDirection(index > currentIndex ? 1 : -1);
        await preloadImage(index);
        setCurrentIndex(index);
    };

    if (!featured) return null;

    const currentImageUrl = featured.backdrop_url || featured.poster_url;
    
    // Get display values - use fetched details for series, fallback to existing data
    const displayDuration = featured.type === 'series' && seriesDetails[featured.id] 
        ? seriesDetails[featured.id].runtime 
        : featured.duration;
    
    const displayYear = seriesDetails[featured.id]?.year || featured.year;

    // Variantes cinematográficas
    const imageVariants = {
        enter: (dir: number) => ({
            opacity: 0,
            scale: 1.1,
            x: dir > 0 ? '5%' : '-5%',
            filter: 'brightness(0.3)',
        }),
        center: {
            opacity: 1,
            scale: 1,
            x: 0,
            filter: 'brightness(1)',
            transition: {
                duration: 1.2,
                ease: 'easeOut' as const,
            }
        },
        exit: (dir: number) => ({
            opacity: 0,
            scale: 1.05,
            x: dir > 0 ? '-5%' : '5%',
            filter: 'brightness(0.3)',
            transition: {
                duration: 0.8,
                ease: 'easeIn' as const,
            }
        })
    };

    const contentVariants = {
        enter: { opacity: 0, y: 30 },
        center: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' as const }
        },
        exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
    };

    return (
        <section className="relative h-[95vh] sm:h-[100vh] lg:h-[100vh] w-full overflow-hidden bg-[#0a0a0a]">
            {/* Backdrop Image with Cinematic Transition */}
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                    key={featured.id}
                    custom={direction}
                    variants={imageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0"
                >
                    <motion.img
                        src={currentImageUrl}
                        alt={featured.title}
                        className="w-full h-full object-cover object-center"
                        initial={{ scale: 1 }}
                        animate={{ scale: 1.05 }}
                        transition={{ duration: 10, ease: 'linear' }}
                    />
                    {/* Vignette cinematográfico */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
                </motion.div>
            </AnimatePresence>

            {/* Gradient Overlays */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center z-20">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={featured.id}
                            variants={contentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="max-w-2xl"
                        >
                            {/* Title - tamanho dinâmico baseado no comprimento */}
                            <h1 className={`font-black text-white mb-4 lg:mb-6 leading-tight tracking-tight ${
                                featured.title.length > 40 
                                    ? 'text-2xl sm:text-3xl lg:text-4xl' 
                                    : featured.title.length > 25 
                                        ? 'text-3xl sm:text-4xl lg:text-5xl'
                                        : 'text-4xl sm:text-5xl lg:text-7xl'
                            }`}>
                                {featured.title.length > 50 ? `${featured.title.slice(0, 50)}...` : featured.title}
                            </h1>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-3 mb-4 lg:mb-6">
                                {featured.score && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="text-white font-semibold text-sm">{convertScoreToFivePoint(featured.score)}</span>
                                    </div>
                                )}
                                <span className="text-gray-300 text-sm font-medium">{displayYear}</span>
                                {featured.rating && (
                                    <span className="px-2 py-0.5 border border-gray-500 text-gray-300 text-xs font-medium rounded">
                                        {featured.rating}
                                    </span>
                                )}
                                <span className="text-gray-300 text-sm">{displayDuration}</span>
                                {featured.genre?.slice(0, 2).map((g, i) => (
                                    <span key={i} className="text-gray-400 text-sm">• {g}</span>
                                ))}
                            </div>

                            {/* Synopsis */}
                            <p className="text-gray-300 text-base lg:text-lg leading-relaxed mb-6 lg:mb-8 line-clamp-3 max-w-xl">
                                {featured.synopsis}
                            </p>

                            {/* Buttons */}
                            <div className="flex flex-wrap gap-3 sm:gap-4">
                                <button
                                    onClick={() => onWatch(featured)}
                                    className="bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-lg transition-all duration-200 hover:translate-y-[-2px] flex items-center"
                                >
                                    <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 fill-current" />
                                    Watch Now
                                </button>
                                <button
                                    onClick={() => onMoreInfo(featured)}
                                    className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-lg backdrop-blur-sm transition-all duration-200 hover:translate-y-[-2px] flex items-center"
                                >
                                    <Info className="w-5 h-5 mr-2" />
                                    More Info
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Progress Bar (Netflix style) */}
            {featuredMovies?.length > 1 && (
                <div className="absolute bottom-20 sm:bottom-16 lg:bottom-12 left-1/2 -translate-x-1/2 z-30">
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2">
                        {featuredMovies.map((movie, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className="group relative h-1 overflow-hidden rounded-full transition-all duration-500"
                                style={{ width: index === currentIndex ? '32px' : '8px' }}
                            >
                                <div className="absolute inset-0 bg-white/30 group-hover:bg-white/50 transition-colors" />
                                {index === currentIndex && (
                                    <motion.div
                                        className="absolute inset-0 bg-white origin-left"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 10, ease: 'linear' }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Thumbnail Preview (Netflix style) */}
            {featuredMovies?.length > 1 && (
                <div className="absolute bottom-24 sm:bottom-28 right-4 sm:right-8 lg:right-12 z-30 hidden lg:flex gap-2">
                    {featuredMovies.map((movie, index) => {
                        if (Math.abs(index - currentIndex) > 2 && index !== 0 && index !== featuredMovies.length - 1) return null;
                        return (
                            <button
                                key={movie.id}
                                onClick={() => goToSlide(index)}
                                className={`relative overflow-hidden rounded-lg transition-all duration-500 ${
                                    index === currentIndex 
                                        ? 'w-24 h-14 ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]' 
                                        : 'w-20 h-12 opacity-50 hover:opacity-100 hover:scale-105'
                                }`}
                            >
                                <img
                                    src={movie.backdrop_url || movie.poster_url}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                />
                                {index === currentIndex && (
                                    <div className="absolute inset-0 bg-white/20" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
