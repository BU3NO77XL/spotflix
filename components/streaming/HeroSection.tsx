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

    // Estados para rotação de backdrops (igual à página watch)
    const [backdrops, setBackdrops] = useState<string[]>([]);
    const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);
    const [backdropCycle, setBackdropCycle] = useState(0); // Controla o ciclo de backdrops

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

    // Efeito para buscar e rotacionar backdrops (igual à página watch)
    useEffect(() => {
        // Resetar backdrops quando o filme mudar
        setBackdrops([]);
        setCurrentBackdropIndex(0);

        if (!featuredTmdbId) return;

        const fetchBackdrops = async () => {
            try {
                const images = await TMDBService.fetchMovieImages(featuredTmdbId, featuredType === 'series');
                if (images.length > 0) {
                    setBackdrops(images);
                }
            } catch (error) {
                console.error('Error fetching backdrops:', error);
            }
        };

        fetchBackdrops();
    }, [featuredTmdbId, featuredType]);

    // Rotação automática dos backdrops (coordenada com mudança de filmes)
    useEffect(() => {
        if (backdrops.length <= 1) return;

        // Resetar backdrop e ciclo quando filme muda
        setCurrentBackdropIndex(0);
        setBackdropCycle(0);

        const maxBackdrops = Math.min(backdrops.length, 2); // Máximo 2 backdrops por filme

        const interval = setInterval(() => {
            setBackdropCycle(prev => {
                const nextCycle = prev + 1;
                if (nextCycle < maxBackdrops) {
                    setCurrentBackdropIndex(nextCycle);
                    return nextCycle;
                }
                // Para após mostrar 2 backdrops
                return prev;
            });
        }, 8000); // 8 segundos por backdrop

        return () => clearInterval(interval);
    }, [backdrops, currentIndex]); // Resetar quando filme muda

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

    // Auto-advance - coordenado com rotação de backdrops
    useEffect(() => {
        if (featuredMovies?.length > 1 && isReady && nextImageReady) {
            const interval = setInterval(() => {
                setDirection(1);
                setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
            }, 16000); // 16 segundos (2 backdrops de 8s cada)
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
        <section className="relative h-[70vh] sm:h-[75vh] lg:h-[80vh] w-full overflow-hidden bg-[#121212]">
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
                    {/* Rotação de backdrops (idêntico à página watch) */}
                    {/* Rotação de backdrops unificada */}
                    <div className="absolute inset-0 transition-opacity duration-2000 ease-in-out">
                        {(backdrops.length > 0 ? backdrops : [currentImageUrl]).map((bd, index) => (
                            <div
                                key={`${featured.id}-${index}`}
                                className={`absolute inset-0 w-full h-full transition-all duration-2000 ease-out ${index === currentBackdropIndex
                                    ? 'opacity-100 scale-100' // Ativa: normal
                                    : 'opacity-0 scale-110'   // Inativa: zoom maior e invisível
                                    }`}
                                style={{
                                    filter: index === currentBackdropIndex ? 'blur(0px)' : 'blur(8px)',
                                    zIndex: index === currentBackdropIndex ? 10 : 0
                                }}
                            >
                                <ProgressiveImage
                                    src={bd}
                                    alt={featured.title}
                                    className="w-full h-full object-cover object-center"
                                    preloaded={loadedImages.has(currentIndex) && index === 0}
                                />

                                {/* Efeito Ken Burns sutil contínuo via CSS para imagem ativa se for única */}
                                {backdrops.length <= 1 && index === currentBackdropIndex && (
                                    <div className="absolute inset-0 bg-transparent animate-pulse-slow" style={{ animationDuration: '20s' }} />
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Vignette cinematográfico */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
                </motion.div>
            </AnimatePresence>

            {/* Gradient Overlays */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-b from-[#121212]/40 via-[#121212]/10 to-transparent z-10" />
            <div className="absolute inset-0 bg-linear-to-r from-[#121212]/40 via-[#121212]/20 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-[#121212]/80 via-[#121212]/20 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-start z-20 overflow-hidden">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 w-full pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-20 lg:pb-24">
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
                            <motion.h1 variants={itemVariants} className={`font-black text-white mb-2 sm:mb-3 lg:mb-4 leading-tight tracking-tight ${featured.title.length > 50
                                ? 'text-lg sm:text-xl lg:text-2xl'
                                : featured.title.length > 35
                                    ? 'text-xl sm:text-2xl lg:text-3xl'
                                    : featured.title.length > 20
                                        ? 'text-2xl sm:text-3xl lg:text-4xl'
                                        : 'text-3xl sm:text-4xl lg:text-5xl'
                                }`}>
                                {featured.title.length > 55 ? `${featured.title.slice(0, 55)}...` : featured.title}
                            </motion.h1>

                            {/* Metadata */}
                            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3 lg:mb-4">
                                {featured.score && (
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="text-white font-bold text-sm">{convertScoreToFivePoint(featured.score)}</span>
                                    </div>
                                )}
                                {/* <span className="text-[#46d369] font-bold text-sm">{featured.score ? Math.min(100, Math.max(0, Math.round(parseFloat(featured.score.toString()) * 10))) : 78}% Match</span> */}
                                <span className="text-gray-300 text-sm font-bold">{displayYear}</span>
                                {featured.rating && (
                                    <span className="px-2 py-0.5 border border-gray-500 text-gray-300 text-xs font-bold rounded">
                                        {featured.rating}
                                    </span>
                                )}
                                <span className="text-gray-300 text-sm font-bold">{displayDuration}</span>
                                {featured.genre?.slice(0, 2).map((g, i) => (
                                    <span key={i} className="text-gray-400 text-sm">• {g}</span>
                                ))}
                            </motion.div>

                            {/* Synopsis */}
                            <motion.p variants={itemVariants} className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-3 sm:mb-4 lg:mb-5 line-clamp-2 sm:line-clamp-3 max-w-xl">
                                {featured.synopsis}
                            </motion.p>

                            {/* Buttons */}
                            <motion.div variants={itemVariants} className="flex flex-wrap gap-2 sm:gap-3">
                                <PlayButton
                                    onClick={() => onWatch(featured)}
                                    size="lg"
                                    variant="secondary"
                                    className="hover:translate-y-[-2px]"
                                >
                                    Assistir
                                </PlayButton>
                                <button
                                    onClick={() => onMoreInfo(featured)}
                                    className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-lg backdrop-blur-sm transition-all duration-200 hover:translate-y-[-2px] flex items-center"
                                    aria-label={`More information about ${featured.title}`}
                                >
                                    <Info className="w-5 h-5 mr-2" />
                                    Detalhes
                                </button>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Progress Bar (Netflix style) - DESATIVADO TEMPORARIAMENTE
            {featuredMovies?.length > 1 && (
                <div className="absolute bottom-24 sm:bottom-28 lg:bottom-32 left-4 sm:left-6 lg:left-12 z-30">
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
                                        transition={{ duration: 16, ease: 'linear' }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            FIM - Progress Bar */}

            {/* Barra de Navegação Progressiva - Indicadores de Dots */}
            {
                backdrops.length > 1 && (
                    <div className="absolute bottom-20 sm:bottom-24 lg:bottom-28 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                        {backdrops.slice(0, 3).map((_, index) => (
                            <button
                                key={`progress-dot-${index}`}
                                onClick={() => {
                                    setCurrentBackdropIndex(index);
                                    setBackdropCycle(index);
                                }}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentBackdropIndex
                                    ? 'bg-white w-6'
                                    : 'bg-white/40 w-1.5 hover:bg-white/60'
                                    }`}
                            />
                        ))}
                    </div>
                )
            }
        </section >
    );
}
