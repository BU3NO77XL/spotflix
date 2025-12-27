'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Info, Star } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ProgressiveImage from './ProgressiveImage';
import Illumination from './Illumination';
import PlayButton from '@/components/ui/PlayButton';
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
    const [nextImageReady, setNextImageReady] = useState(false);
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
    const preloadImage = useCallback((index: number): Promise<boolean> => {
        if (!featuredMovies?.[index]) return Promise.resolve(false);
        if (loadedImages.has(index)) return Promise.resolve(true);

        return new Promise<boolean>((resolve) => {
            const img = new Image();
            const src = featuredMovies[index].backdrop_url || featuredMovies[index].poster_url;
            img.onload = () => {
                setLoadedImages(prev => new Set([...prev, index]));
                resolve(true);
            };
            img.onerror = () => resolve(false);
            img.src = src || '';
        });
    }, [featuredMovies, loadedImages]);

    // Preload adjacent images and set next image ready flag
    useEffect(() => {
        if (featuredMovies?.length > 1) {
            const next = (currentIndex + 1) % featuredMovies.length;
            const prev = (currentIndex - 1 + featuredMovies.length) % featuredMovies.length;

            // Reset next image ready flag when index changes
            setNextImageReady(false);

            // Preload next image and set flag when ready
            preloadImage(next).then((success) => {
                if (success) setNextImageReady(true);
            });
            preloadImage(prev);
            setIsReady(true);
        }
    }, [currentIndex, featuredMovies?.length, preloadImage]);

    // Auto-advance - only when next image is ready (10 seconds interval)
    useEffect(() => {
        if (featuredMovies?.length > 1 && isReady && nextImageReady) {
            const interval = setInterval(() => {
                setDirection(1);
                setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
            }, 10000); // 10 seconds
            return () => clearInterval(interval);
        }
    }, [featuredMovies?.length, isReady, nextImageReady]);

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

    // Variantes cinematográficas simplificadas - sem blur customizado
    const imageVariants: Variants = {
        enter: (dir: number) => ({
            opacity: 0,
            scale: 1.05,
            x: dir > 0 ? '1%' : '-1%',
            filter: 'blur(8px)',
        }),
        center: {
            opacity: 1,
            scale: 1,
            x: 0,
            filter: 'blur(0px)',
            transition: {
                duration: 1.4,
                ease: [0.25, 0.46, 0.45, 0.94],
            }
        },
        exit: (dir: number) => ({
            opacity: 0,
            scale: 1.02,
            x: dir > 0 ? '-1%' : '1%',
            filter: 'blur(8px)',
            transition: {
                duration: 1.4,
                ease: [0.25, 0.46, 0.45, 0.94],
            }
        })
    };

    const containerVariants: Variants = {
        enter: { opacity: 0 },
        center: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.3
            }
        },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    const itemVariants: Variants = {
        enter: { opacity: 0 },
        center: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
        exit: { opacity: 0, transition: { duration: 0.3 } }
    };

    return (
        <section className="relative h-[95vh] sm:h-screen lg:h-screen w-full overflow-hidden bg-[#0a0a0a]">
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
                    <motion.div 
                        initial={{ scale: 1, filter: 'blur(8px)' }} 
                        animate={{ scale: 1.05, filter: 'blur(0px)' }} 
                        transition={{ duration: 10, ease: 'linear' }} 
                        className="w-full h-full"
                    >
                        <ProgressiveImage 
                            src={currentImageUrl} 
                            alt={featured.title} 
                            className="w-full h-full object-cover object-center"
                            preloaded={loadedImages.has(currentIndex)}
                        />
                    </motion.div>
                    {/* Vignette cinematográfico */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
                </motion.div>
            </AnimatePresence>

            {/* Gradient Overlays */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-b from-[#0a0a0a]/40 via-[#0a0a0a]/10 to-transparent z-10" />
            <div className="absolute inset-0 bg-linear-to-r from-[#0a0a0a]/40 via-[#0a0a0a]/20 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-[#0a0a0a]/80 via-[#0a0a0a]/20 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center sm:items-end z-20">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 w-full pb-12 sm:pb-24 lg:pb-32">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={featured.id}
                            variants={containerVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="max-w-2xl"
                        >
                            {/* Title - tamanho dinâmico baseado no comprimento */}
                            <motion.h1 variants={itemVariants} className={`font-black text-white mb-4 lg:mb-6 leading-tight tracking-tight ${featured.title.length > 40
                                ? 'text-2xl sm:text-3xl lg:text-4xl'
                                : featured.title.length > 25
                                    ? 'text-3xl sm:text-4xl lg:text-5xl'
                                    : 'text-4xl sm:text-5xl lg:text-7xl'
                                }`}>
                                {featured.title.length > 50 ? `${featured.title.slice(0, 50)}...` : featured.title}
                            </motion.h1>

                            {/* Metadata */}
                            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 mb-4 lg:mb-6">
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
                            </motion.div>

                            {/* Synopsis */}
                            <motion.p variants={itemVariants} className="text-gray-300 text-base lg:text-lg leading-relaxed mb-6 lg:mb-8 line-clamp-3 max-w-xl">
                                {featured.synopsis}
                            </motion.p>

                            {/* Buttons */}
                            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 sm:gap-4">
                                <PlayButton
                                    onClick={() => onWatch(featured)}
                                    size="lg"
                                    variant="primary"
                                    className="hover:translate-y-[-2px]"
                                >
                                    Watch Now
                                </PlayButton>
                                <button
                                    onClick={() => onMoreInfo(featured)}
                                    className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-lg backdrop-blur-sm transition-all duration-200 hover:translate-y-[-2px] flex items-center"
                                    aria-label={`More information about ${featured.title}`}
                                >
                                    <Info className="w-5 h-5 mr-2" />
                                    More Info
                                </button>
                            </motion.div>
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
                                className={`relative overflow-hidden rounded-lg transition-all duration-500 ${index === currentIndex
                                    ? 'w-24 h-14 ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]'
                                    : 'w-20 h-12 opacity-50 hover:opacity-100 hover:scale-105'
                                    }`}
                            >
                                <ProgressiveImage 
                                    src={movie.backdrop_url || movie.poster_url} 
                                    alt={movie.title} 
                                    className="w-full h-full object-cover"
                                    preloaded={loadedImages.has(index)}
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
