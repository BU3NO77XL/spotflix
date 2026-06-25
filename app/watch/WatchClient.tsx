'use client';

import { useState, useEffect, Suspense, memo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/dataClient';
import { Movie, CastMember } from '@/types/movie';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

import { toast } from 'sonner';
import { TMDBService } from '@/components/streaming/TMDBIntegration';
import CastSlider from '@/components/streaming/CastSlider';
import Carousel from '@/components/streaming/Carousel';
import MovieModal from '@/components/streaming/MovieModal';
import ProgressiveImage from '@/components/streaming/ProgressiveImage';
import VideoPlayer from '@/components/streaming/VideoPlayer';
import MovieTitle from '@/components/streaming/MovieTitle';
import { cn } from '@/lib/utils';
import { useLogoStore } from '@/stores/logoStore';
import LoginRequiredModal from '@/components/streaming/LoginRequiredModal';

// Hook para preload de imagens
const useImagePreload = (urls: string[]) => {
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (urls.length === 0) return;

        const preloadPromises = urls.map(url => {
            return new Promise<string>((resolve, reject) => {
                const img = new window.Image();
                img.onload = () => {
                    setLoadedImages((prev: Set<string>) => new Set([...prev, url]));
                    resolve(url);
                };
                img.onerror = () => reject(url);
                img.src = url;
            });
        });

        Promise.allSettled(preloadPromises);
    }, [urls]);

    return loadedImages;
};

// Skeleton Components for Loading States
const Skeleton = memo(({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-white/10 rounded ${className}`} />
));
Skeleton.displayName = 'Skeleton';

const SectionSkeleton = memo(() => (
    <div className="py-8 border-b border-white/10">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-3 overflow-hidden">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-28 sm:w-32 lg:w-36 aspect-2/3 rounded-lg shrink-0" />
            ))}
        </div>
    </div>
));
SectionSkeleton.displayName = 'SectionSkeleton';

const CastSkeleton = memo(() => (
    <div className="py-8 border-b border-white/10">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-4 mb-4">
            {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shrink-0" />
            ))}
        </div>
        <div className="bg-[#1f1f1f] rounded-lg p-4">
            <div className="flex gap-4">
                <Skeleton className="w-28 sm:w-32 aspect-3/4 shrink-0" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        </div>
    </div>
));
CastSkeleton.displayName = 'CastSkeleton';

// optimized Image Component with lazy loading
const OptimizedImage = memo(({
    src,
    alt,
    className,
    priority = false,
    fill = false,
    width,
    height
}: {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
    fill?: boolean;
    width?: number;
    height?: number;
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    if (error || !src) {
        return <div className={`bg-[#1f1f1f] ${className}`} aria-label={`Imagem não disponível: ${alt}`} />;
    }

    return (
        <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
            {!isLoaded && <Skeleton className={`absolute inset-0 ${className}`} />}
            {fill ? (
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className={`object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setError(true)}
                    priority={priority}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            ) : (
                <img
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setError(true)}
                    loading={priority ? 'eager' : 'lazy'}
                />
            )}
        </div>
    );
});
OptimizedImage.displayName = 'OptimizedImage';


export default function Watch() {
    return (
        <Suspense fallback={<WatchLoading />}>
            <WatchContent />
        </Suspense>
    );
}

function WatchLoading() {
    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    );
}


function WatchContent() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { getLogosForMovie } = useLogoStore();
    const searchParams = useSearchParams();
    const movieId = searchParams.get('id');
    const tmdbId = searchParams.get('ref');
    const mediaType = searchParams.get('type') || 'movie'; // 'movie' ou 'series'

    // Quando o id da mídia mudar (navegação para outro filme/série),
    // em dispositivos móveis queremos garantir que a página comece no topo.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const isMobile = window.innerWidth <= 768; // breakpoint para 'sm'
            if (isMobile) {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }
        } catch (e) {
            // fallback silencioso
            window.scrollTo(0, 0);
        }
    }, [movieId, tmdbId]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [comment, setComment] = useState('');
    const [movieDetails, setMovieDetails] = useState<{ overview?: string; budget?: number; director?: string; cast: CastMember[]; genres?: string[]; runtime?: number; tagline?: string; ageRating?: string; belongs_to_collection?: { id: number; name: string; poster_path: string; backdrop_path: string } | null } | null>(null);
    const [seriesDetails, setSeriesDetails] = useState<{ overview?: string; director?: string; cast: CastMember[]; genres?: string[]; tagline?: string; ageRating?: string; seasons?: { id: number; season_number: number; episode_count: number; name: string; air_date: string; poster_path: string }[]; number_of_seasons?: number; number_of_episodes?: number; first_air_date?: string; last_air_date?: string } | null>(null);
    const [seasonDetails, setSeasonDetails] = useState<{ episodes: { id: number; episode_number: number; name: string; overview: string; air_date: string; runtime: number; still_path: string; vote_average: number }[] } | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
    const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
    const [trailers, setTrailers] = useState<{ key: string; name: string; type: string }[]>([]);
    const [keywords, setKeywords] = useState<{ id: number; name: string }[]>([]);
    const [logos, setLogos] = useState<{
        file_path: string;
        file_type: string;
        width: number;
        height: number;
        iso_639_1: string | null;
    }[]>([]);

    // Estado para indicar se o logo está pronto (carregado ou não existe)
    const [isLogoReady, setIsLogoReady] = useState(false);
    const [collection, setCollection] = useState<{ id: number; name: string; overview: string; backdrop_path: string; parts: { id: number; title: string; poster_path: string; release_date: string }[] } | null>(null);
    const [creatorSeries, setCreatorSeries] = useState<Movie[]>([]);
    const [creatorInfo, setCreatorInfo] = useState<{ id: number; name: string } | null>(null);
    const [showLeftCreatorArrow, setShowLeftCreatorArrow] = useState(false);
    const [showRightCreatorArrow, setShowRightCreatorArrow] = useState(false);
    const [activeCreatorBackdrop, setActiveCreatorBackdrop] = useState(0);
    const [selectedCreatorIndex, setSelectedCreatorIndex] = useState(0);
    const [isCreatorPaused, setIsCreatorPaused] = useState(false);
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [showLeftEpisodeArrow, setShowLeftEpisodeArrow] = useState(false);
    const [showRightEpisodeArrow, setShowRightEpisodeArrow] = useState(true);
    const [showLeftCollectionArrow, setShowLeftCollectionArrow] = useState(false);
    const [showRightCollectionArrow, setShowRightCollectionArrow] = useState(false);
    const [showLeftTrailersArrow, setShowLeftTrailersArrow] = useState(false);
    const [showRightTrailersArrow, setShowRightTrailersArrow] = useState(false);
    const [selectedModalMovie, setSelectedModalMovie] = useState<Movie | null>(null);
    // Estado para backdrops rotativos
    const [backdrops, setBackdrops] = useState<string[]>([]);
    const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);
    // Estado para armazenar detalhes atualizados da série (como no HeroSection)
    const [updatedSeriesDetails, setUpdatedSeriesDetails] = useState<Record<string, { runtime: string; year?: number }>>({});
    // Estado para controle de áudio do backdrop animado
    const [isBackdropMuted, setIsBackdropMuted] = useState(true);
    const [localFavorited, setLocalFavorited] = useState(false);
    const [localLiked, setLocalLiked] = useState(false);
    const [volume, setVolume] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const backdropVideoRef = useRef<HTMLVideoElement>(null);
    const episodesScrollRef = useRef<HTMLDivElement>(null);
    const collectionScrollRef = useRef<HTMLDivElement>(null);
    const trailersScrollRef = useRef<HTMLDivElement>(null);
    const creatorScrollRef = useRef<HTMLDivElement>(null);
    const creatorPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const handleEpisodeScroll = () => {
        if (episodesScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = episodesScrollRef.current;
            setShowLeftEpisodeArrow(scrollLeft > 10);
            setShowRightEpisodeArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scrollEpisodes = (direction: 'left' | 'right') => {
        if (episodesScrollRef.current) {
            const scrollAmount = 300;
            episodesScrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            setTimeout(() => handleEpisodeScroll(), 300);
        }
    };

    const handleCollectionScroll = () => {
        if (collectionScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = collectionScrollRef.current;
            const hasOverflow = scrollWidth > clientWidth;
            setShowLeftCollectionArrow(hasOverflow && scrollLeft > 10);
            setShowRightCollectionArrow(hasOverflow && scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scrollCollection = (direction: 'left' | 'right') => {
        if (collectionScrollRef.current) {
            collectionScrollRef.current.scrollBy({
                left: direction === 'left' ? -300 : 300,
                behavior: 'smooth'
            });
            setTimeout(() => handleCollectionScroll(), 300);
        }
    };

    const handleTrailersScroll = () => {
        if (trailersScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = trailersScrollRef.current;
            const hasOverflow = scrollWidth > clientWidth;
            setShowLeftTrailersArrow(hasOverflow && scrollLeft > 10);
            setShowRightTrailersArrow(hasOverflow && scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scrollTrailers = (direction: 'left' | 'right') => {
        if (trailersScrollRef.current) {
            trailersScrollRef.current.scrollBy({
                left: direction === 'left' ? -300 : 300,
                behavior: 'smooth'
            });
            setTimeout(() => handleTrailersScroll(), 300);
        }
    };

    const handleCreatorScroll = () => {
        if (creatorScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = creatorScrollRef.current;
            const hasOverflow = scrollWidth > clientWidth;
            setShowLeftCreatorArrow(hasOverflow && scrollLeft > 10);
            setShowRightCreatorArrow(hasOverflow && scrollLeft < scrollWidth - clientWidth - 10);

            // Calcular qual item está mais visível para mudar o backdrop
            const itemWidth = 160; // Largura aproximada de cada card + gap
            const activeIndex = Math.round(scrollLeft / itemWidth);
            setActiveCreatorBackdrop(Math.min(activeIndex, creatorSeries.length - 1));
        }
    };

    const scrollCreator = (direction: 'left' | 'right') => {
        if (creatorScrollRef.current) {
            creatorScrollRef.current.scrollBy({
                left: direction === 'left' ? -300 : 300,
                behavior: 'smooth'
            });
            setTimeout(() => handleCreatorScroll(), 300);
        }
    };

    const SYNOPSIS_LIMIT = 250;
    const CREATOR_AUTO_PLAY_INTERVAL = 6000; // 6 segundos
    const CREATOR_PAUSE_AFTER_INTERACTION = 120000; // 2 minutos



    // Autoplay para o carrossel de criadores
    useEffect(() => {
        if (isCreatorPaused || creatorSeries.length <= 1) return;

        const interval = setInterval(() => {
            setSelectedCreatorIndex((prev: number) => {
                const nextIndex = (prev + 1) % creatorSeries.length;
                setActiveCreatorBackdrop(nextIndex);

                // Scroll automático para o próximo item
                if (creatorScrollRef.current) {
                    const container = creatorScrollRef.current;
                    const child = container.children[nextIndex] as HTMLElement;
                    if (child) {
                        const containerRect = container.getBoundingClientRect();
                        const childRect = child.getBoundingClientRect();
                        const scrollLeft = child.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (childRect.width / 2);
                        container.scrollTo({
                            left: scrollLeft,
                            behavior: 'smooth'
                        });
                    }
                }

                return nextIndex;
            });
        }, CREATOR_AUTO_PLAY_INTERVAL);

        return () => clearInterval(interval);
    }, [isCreatorPaused, creatorSeries.length]);

    // Limpar timeout ao desmontar
    useEffect(() => {
        return () => {
            if (creatorPauseTimeoutRef.current) {
                clearTimeout(creatorPauseTimeoutRef.current);
            }
        };
    }, []);

    // Listener para scroll da página (animação do botão Voltar)
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Função para lidar com interação do usuário no carrossel de criadores
    const handleCreatorUserInteraction = (index: number) => {
        if (creatorPauseTimeoutRef.current) {
            clearTimeout(creatorPauseTimeoutRef.current);
        }

        setIsCreatorPaused(true);
        setSelectedCreatorIndex(index);
        setActiveCreatorBackdrop(index);

        // Scroll para o item selecionado
        if (creatorScrollRef.current) {
            const container = creatorScrollRef.current;
            const child = container.children[index] as HTMLElement;
            if (child) {
                const containerRect = container.getBoundingClientRect();
                const childRect = child.getBoundingClientRect();
                const scrollLeft = child.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (childRect.width / 2);
                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }

        // Retomar autoplay após 2 minutos
        creatorPauseTimeoutRef.current = setTimeout(() => {
            setIsCreatorPaused(false);
        }, CREATOR_PAUSE_AFTER_INTERACTION);
    };

    // Buscar filme por ID (se passado na URL)
    const { data: movieById, isLoading: isLoadingById } = useQuery({
        queryKey: ['movies', movieId],
        queryFn: async () => {
            const movies = await base44.entities.Movie.filter({ id: movieId! });
            return movies[0] || null;
        },
        enabled: !!movieId,
        // Usar dados da lista 'movies' como initialData para renderização instantânea
        initialData: () => {
            const movies = queryClient.getQueryData<Movie[]>(['movies']);
            return movies?.find(m => m.id === movieId);
        },
        staleTime: 1000 * 60 * 30, // 30 minutos
    });

    // Busca por TMDB ID (para filmes similares ou da pesquisa)
    const { data: movieByTmdb, isLoading: isLoadingByTmdb } = useQuery({
        queryKey: ['movie', 'tmdb', tmdbId, mediaType],
        queryFn: async () => {
            // Primeiro tenta buscar no banco local
            const movies = await base44.entities.Movie.filter({ tmdb_id: Number(tmdbId) });
            if (movies[0]) return movies[0];

            // Se não encontrar, busca direto do TMDB
            const tmdbIdNum = Number(tmdbId);
            const isSeries = mediaType === 'series';
            const endpoint = isSeries ? 'tv' : 'movie';

            // Busca dados básicos do TMDB via proxy
            const response = await fetch(`/api/content/${endpoint}/${tmdbIdNum}?language=pt-BR`);
            if (!response.ok) return {} as any; // Retorna objeto vazio em vez de null para evitar erro do React Query
            const tmdbData = await response.json();

            // Verificar se temos dados válidos
            if (!tmdbData || Object.keys(tmdbData).length === 0) {
                return {} as any;
            }

            const title = tmdbData.title || tmdbData.name || 'Untitled';
            const releaseDate = tmdbData.release_date || tmdbData.first_air_date || '';
            const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();

            // Para séries, calcular duração como número de temporadas
            let duration = '2h 0m';
            if (isSeries) {
                const seasons = tmdbData.number_of_seasons || 1;
                duration = `${seasons} Temporada${seasons > 1 ? 's' : ''}`;
            } else if (tmdbData.runtime) {
                duration = `${Math.floor(tmdbData.runtime / 60)}h ${tmdbData.runtime % 60}m`;
            }

            return {
                id: `tmdb-${tmdbIdNum}`,
                title,
                type: isSeries ? 'series' as const : 'movie' as const,
                year,
                rating: 'NR',
                duration,
                genre: tmdbData.genres?.map((g: { name: string }) => g.name) || [],
                synopsis: tmdbData.overview || '',
                cast: [],
                director: 'Unknown',
                poster_url: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '',
                backdrop_url: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` : '',
                score: tmdbData.vote_average ? parseFloat(tmdbData.vote_average.toFixed(1)) : 0,
                tmdb_id: tmdbIdNum,
                category: 'trending' as const,
            };
        },
        enabled: !!tmdbId,
        staleTime: 1000 * 60 * 30, // 30 minutos
        gcTime: 1000 * 60 * 60, // 1 hora
    });

    const movie = movieById || movieByTmdb;
    const isLoading = isLoadingById || isLoadingByTmdb;

    // Efeito para carregar logos pré-carregados do store global (Zustand-like/Context)
    useEffect(() => {
        if (movie?.tmdb_id) {
            const preloaded = getLogosForMovie(movie.tmdb_id);
            if (preloaded) {
                setLogos(preloaded.logos);
                setIsLogoReady(preloaded.logoImageLoaded);
            }
        }
    }, [movie?.id, movie?.tmdb_id, getLogosForMovie]);

    // Preload das imagens principais para evitar flash de loading
    const imagesToPreload = movie ? [
        movie.backdrop_url,
        movie.poster_url
    ].filter(Boolean) : [];

    const preloadedImages = useImagePreload(imagesToPreload);

    // Preload dos backdrops adicionais
    const preloadedBackdrops = useImagePreload(backdrops);

    // Fetch series details for accurate season count (como no HeroSection)
    useEffect(() => {
        const fetchSeriesDetails = async () => {
            // Verificar se temos um filme válido e um tmdb_id numérico
            const tmdbIdNum = movie?.tmdb_id ? Number(movie.tmdb_id) : null;
            if (movie && movie.id && tmdbIdNum && !isNaN(tmdbIdNum) && movie.type === 'series' && !updatedSeriesDetails[movie.id]) {
                try {
                    const seriesData = await TMDBService.fetchSeriesDetails(tmdbIdNum);
                    if (seriesData) {
                        setUpdatedSeriesDetails((prev: Record<string, { runtime: string; year?: number }>) => ({
                            ...prev,
                            [movie.id]: {
                                runtime: `${seriesData.number_of_seasons} Temporada${seriesData.number_of_seasons !== 1 ? 's' : ''}`,
                                year: seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : undefined
                            }
                        }));
                    }
                } catch (error) {
                    // Silently fail or log minimally to avoid flooding
                    console.warn(`Could not fetch extra details for series ${movie.id}:`, error);
                }
            }
        };

        fetchSeriesDetails();
    }, [movie?.id, movie?.type, movie?.tmdb_id, updatedSeriesDetails]);

    // Resetar logos quando mudar de filme/série
    useEffect(() => {
        setLogos([]);
        setIsLogoReady(false);
        setIsLoadingDetails(true); // Garantir que isLoadingDetails seja true ao mudar
    }, [tmdbId]);

    const { data: fetchedDetails, isLoading: isLoadingDetailsQuery } = useQuery({
        queryKey: ['watchDetails', movie?.tmdb_id, movie?.type],
        queryFn: async () => {
            if (!movie?.tmdb_id) return null;
            const isSeries = movie.type === 'series';

            if (isSeries) {
                const [seriesData, similar, videos, keywordsData, fullDetails, logosData] = await Promise.all([
                    TMDBService.fetchSeriesDetails(movie.tmdb_id),
                    TMDBService.fetchSimilar(movie.tmdb_id, true),
                    TMDBService.fetchMovieVideos(movie.tmdb_id, true),
                    TMDBService.fetchMovieKeywords(movie.tmdb_id, true),
                    (TMDBService as any).fetchSeriesFullDetails ? (TMDBService as any).fetchSeriesFullDetails(movie.tmdb_id) : Promise.resolve(null),
                    TMDBService.fetchMovieLogos(movie.tmdb_id, true)
                ]);

                let seasonData = null;
                if (seriesData?.seasons && seriesData.seasons.length > 0) {
                    const firstSeason = seriesData.seasons.find((s: any) => s.season_number === 1) || seriesData.seasons[0];
                    if (firstSeason) {
                        seasonData = await TMDBService.fetchSeasonDetails(movie.tmdb_id, firstSeason.season_number);
                        seasonData = { ...seasonData, season_number: firstSeason.season_number };
                    }
                }

                let creatorSeriesData = [];
                let creatorInfoData = null;
                if (fullDetails?.created_by && fullDetails.created_by.length > 0) {
                    creatorInfoData = fullDetails.created_by[0];
                    if ((TMDBService as any).fetchSeriesByCreator) {
                        const cs = await (TMDBService as any).fetchSeriesByCreator(creatorInfoData.id, movie.tmdb_id);
                        creatorSeriesData = cs.map((s: any, i: number) => ({ ...s, id: `creator-${i}` }));
                    }
                }

                return {
                    isSeries: true,
                    seriesData,
                    seasonData,
                    creatorInfoData,
                    creatorSeriesData,
                    similar: similar.map((s: any, i: number) => ({ ...s, id: `similar-${i}` })),
                    videos,
                    keywordsData,
                    logosData
                };
            } else {
                const [details, similar, videos, keywordsData, logosData] = await Promise.all([
                    TMDBService.fetchMovieDetails(movie.tmdb_id),
                    TMDBService.fetchSimilar(movie.tmdb_id, false),
                    TMDBService.fetchMovieVideos(movie.tmdb_id, false),
                    TMDBService.fetchMovieKeywords(movie.tmdb_id, false),
                    TMDBService.fetchMovieLogos(movie.tmdb_id, false)
                ]);

                let collectionData = null;
                if (details?.belongs_to_collection?.id) {
                    collectionData = await TMDBService.fetchCollection(details.belongs_to_collection.id);
                }

                return {
                    isSeries: false,
                    details,
                    collectionData,
                    similar: similar.map((s: any, i: number) => ({ ...s, id: `similar-${i}` })),
                    videos,
                    keywordsData,
                    logosData
                };
            }
        },
        enabled: !!movie?.tmdb_id,
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    useEffect(() => {
        if (!fetchedDetails) return;
        
        setIsLoadingDetails(true);
        if (fetchedDetails.isSeries) {
            if (fetchedDetails.seriesData) setSeriesDetails(fetchedDetails.seriesData);
            if (fetchedDetails.seasonData) {
                const { season_number, ...seasonData } = fetchedDetails.seasonData as any;
                setSeasonDetails(seasonData);
                setSelectedSeason(season_number);
                setSelectedEpisode(1);
            }
            if (fetchedDetails.creatorInfoData) setCreatorInfo(fetchedDetails.creatorInfoData);
            if (fetchedDetails.creatorSeriesData) setCreatorSeries(fetchedDetails.creatorSeriesData);
            setSimilarMovies(fetchedDetails.similar);
            setTrailers(fetchedDetails.videos);
            setKeywords(fetchedDetails.keywordsData);
            setLogos(fetchedDetails.logosData);
        } else {
            if (fetchedDetails.details) setMovieDetails(fetchedDetails.details);
            if (fetchedDetails.collectionData) setCollection(fetchedDetails.collectionData);
            setSimilarMovies(fetchedDetails.similar);
            setTrailers(fetchedDetails.videos);
            setKeywords(fetchedDetails.keywordsData);
            setLogos(fetchedDetails.logosData);
        }
        setIsLoadingDetails(false);
    }, [fetchedDetails]);

    // Efeito para pré-carregar a imagem do logo
    useEffect(() => {
        // Se já temos logos pré-carregados do store, usar eles
        if (movie?.tmdb_id) {
            const preloaded = getLogosForMovie(movie.tmdb_id);
            if (preloaded && preloaded.logoImageLoaded) {
                setLogos(preloaded.logos);
                setIsLogoReady(true);
                return;
            }
        }

        // Se ainda está carregando detalhes ou não tem movie, aguardar
        if (isLoadingDetails || !movie) {
            return;
        }

        // Se já está pronto, não precisa recarregar
        if (isLogoReady) {
            return;
        }

        // Se não há logos após carregar detalhes, marca como pronto
        // Mas só se realmente terminou de carregar (isLoadingDetails = false)
        if (logos.length === 0) {
            // Pequeno delay para garantir que o React processou todos os updates
            const timer = setTimeout(() => {
                setIsLogoReady(true);
            }, 50);
            return () => clearTimeout(timer);
        }

        // Se há logo, pré-carrega a imagem
        const logoUrl = `https://image.tmdb.org/t/p/original${logos[0]?.file_path}`;
        const img = new window.Image();

        // Timeout de segurança: se demorar mais de 1.5 segundos, mostra mesmo assim
        const timeout = setTimeout(() => {
            setIsLogoReady(true);
        }, 1500);

        img.onload = () => {
            clearTimeout(timeout);
            setIsLogoReady(true);
        };

        img.onerror = () => {
            clearTimeout(timeout);
            setIsLogoReady(true);
        };

        img.src = logoUrl;

        return () => clearTimeout(timeout);
    }, [movie?.tmdb_id, movie, logos, getLogosForMovie, isLoadingDetails, isLogoReady]);

    // Efeito para buscar e rotacionar backdrops
    useEffect(() => {
        // Resetar backdrops imediatamente quando o filme mudar
        setBackdrops([]);
        setCurrentBackdropIndex(0);

        if (!movie?.tmdb_id) return;

        const fetchBackdrops = async () => {
            const images = await TMDBService.fetchMovieImages(movie.tmdb_id, movie.type === 'series');
            if (images.length > 0) {
                setBackdrops(images);
            }
        };

        fetchBackdrops();
    }, [movie?.tmdb_id, movie?.type]);

    useEffect(() => {
        if (backdrops.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentBackdropIndex((prev: number) => (prev + 1) % backdrops.length);
        }, 8000); // 8 segundos

        return () => clearInterval(interval);
    }, [backdrops]);

    // Verificar overflow inicial para Collection e Trailers
    useEffect(() => {
        const checkOverflow = () => {
            handleCollectionScroll();
            handleTrailersScroll();
            handleCreatorScroll();
        };
        // Pequeno delay para garantir que o DOM foi renderizado
        const timer = setTimeout(checkOverflow, 100);
        window.addEventListener('resize', checkOverflow);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkOverflow);
        };
    }, [collection, trailers, creatorSeries]);

    // Função para buscar detalhes de uma temporada específica
    const fetchSeasonDetails = async (seasonNumber: number) => {
        // Verificar se temos um filme válido
        if (movie && Object.keys(movie).length > 0 && movie.tmdb_id) {
            setIsLoadingDetails(true);
            try {
                const seasonData = await TMDBService.fetchSeasonDetails(movie.tmdb_id, seasonNumber);
                setSeasonDetails(seasonData);
                setSelectedSeason(seasonNumber);
                setSelectedEpisode(1);
            } finally {
                setIsLoadingDetails(false);
            }
        }
    };

    const addToListMutation = useMutation({
        mutationFn: (data: { movie_id: string; list_type: 'favorites' | 'watch_later' }) =>
            base44.entities.UserList.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userList'] });
            toast.success('Adicionado à sua lista!');
        },
    });

    const handleAddToList = () => {
        // Verificar se temos um filme válido
        if (!movie || Object.keys(movie).length === 0) return;
        // Guard de autenticação
        const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('sb-session');
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        addToListMutation.mutate({ movie_id: movie.id, list_type: 'watch_later' });
    };

    const handleLikeAction = () => {
        // Guard de autenticação para o botão de curtir
        const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('sb-session');
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        setLocalLiked(!localLiked);
    };

    const handleSimilarMovieClick = (similarMovie: Movie) => {
        // Verificar se temos um filme válido
        if (similarMovie && Object.keys(similarMovie).length > 0) {
            setSelectedModalMovie(similarMovie);
        }
    };

    // Verificar se temos um filme válido e logo pronto antes de renderizar
    if (isLoading || !movie || Object.keys(movie).length === 0 || !isLogoReady) {
        return <WatchLoading />;
    }

    // Determinar se é série ou filme
    const isSeries = movie && movie.type === 'series';
    const cast = isSeries ? seriesDetails?.cast || [] : movieDetails?.cast || [];
    const synopsis = isSeries ? seriesDetails?.overview || movie.synopsis || '' : movieDetails?.overview || movie.synopsis || '';

    // Obter valores atualizados para exibição (como no HeroSection)
    const displayDuration = isSeries && updatedSeriesDetails[movie.id]
        ? updatedSeriesDetails[movie.id].runtime
        : movie.duration;

    const displayYear = isSeries && updatedSeriesDetails[movie.id]?.year
        ? updatedSeriesDetails[movie.id].year
        : (isSeries ? seriesDetails?.first_air_date?.substring(0, 4) : movie.year);

    // Mapa de backdrops animados disponíveis (futuro: migrar para banco de dados)
    const animatedBackdrops: Record<string, { url: string; hasAudio: boolean }> = {
        'series-200875': { url: '/animated-backdrops/series-200875.mp4', hasAudio: true },      // Squid Game
        'movie-396422': { url: '/animated-backdrops/annabelle-backdrop.mp4', hasAudio: true },  // Annabelle
        'movie-1010581': { url: '/animated-backdrops/myfault-movie.mp4', hasAudio: false },     // My Fault (sem áudio)
        'movie-1156593': { url: '/animated-backdrops/sua-culpa-movie.mp4', hasAudio: false },   // Sua Culpa (sem áudio)
    };

    // Verificar se tem backdrop animado disponível
    const backdropKey = `${mediaType}-${movie.tmdb_id}`;
    const animatedBackdrop = animatedBackdrops[backdropKey] || null;
    const animatedBackdropUrl = animatedBackdrop?.url || null;
    const hasBackdropAudio = animatedBackdrop?.hasAudio || false;

    return (
        <div className="min-h-screen bg-[#121212]">
            {/* Hero Section - Similar to MovieModal */}
            <section className="relative h-[70vh] sm:h-[75vh] lg:h-[80vh] overflow-hidden">
                {/* Backdrop - Video animado ou Imagem */}
                <div className="absolute inset-0 overflow-hidden">
                    {animatedBackdropUrl ? (
                        <video
                            ref={backdropVideoRef}
                            src={animatedBackdropUrl}
                            autoPlay
                            loop
                            muted={isBackdropMuted}
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                                console.error('Erro ao carregar vídeo de backdrop:', animatedBackdropUrl, e);
                            }}
                        />
                    ) : (movie.backdrop_url || movie.poster_url) ? (
                        <div className="absolute inset-0 transition-opacity duration-2000 ease-in-out">
                            {(backdrops.length > 0 ? backdrops : [movie.backdrop_url || movie.poster_url]).map((bd, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 w-full h-full transition-all duration-2000 ease-out ${index === currentBackdropIndex
                                        ? 'opacity-100 scale-100'
                                        : 'opacity-0 scale-105'
                                        }`}
                                    style={{
                                        filter: index === currentBackdropIndex ? 'blur(0px)' : 'blur(8px)'
                                    }}
                                >
                                    <ProgressiveImage
                                        src={bd}
                                        alt={movie.title}
                                        className="w-full h-full object-cover"
                                        preloaded={preloadedImages.has(bd) || preloadedBackdrops.has(bd)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-full bg-linear-to-br from-[#1f1f1f] to-[#121212] flex items-center justify-center">
                            <span className="text-white/20 text-2xl font-bold">{movie.title}</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-[#121212]/20 to-transparent" />
                    <div className="absolute inset-0 bg-linear-to-r from-[#121212]/60 via-transparent to-transparent" />
                </div>

                {/* Botão de Volume - Canto direito (apenas desktop) */}
                <button
                    onClick={() => {
                        setVolume(volume === 0 ? 1 : 0);
                        setIsBackdropMuted(!isBackdropMuted);
                        if (backdropVideoRef.current) {
                            backdropVideoRef.current.muted = !isBackdropMuted;
                        }
                    }}
                    className="hidden sm:flex absolute bottom-4 sm:bottom-8 lg:bottom-12 right-4 sm:right-8 lg:right-12 z-20
                        bg-[#2a2a2a]/60 hover:bg-[#444444] border-2 border-[#ffffff]/70 text-white p-1.5 sm:p-2
                        rounded-full transition-all duration-200 items-center justify-center w-8 h-8 sm:w-10 sm:h-10
                        opacity-40 hover:opacity-100 focus:outline-none focus:ring-0"
                    aria-label={isBackdropMuted ? "Ativar som" : "Desativar som"}
                >
                    {isBackdropMuted ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                            <path fillRule="evenodd" clipRule="evenodd" d="M11 4.00003C11 3.59557 10.7564 3.23093 10.3827 3.07615C10.009 2.92137 9.57889 3.00692 9.29289 3.29292L4.58579 8.00003H1C0.447715 8.00003 0 8.44774 0 9.00003V15C0 15.5523 0.447715 16 1 16H4.58579L9.29289 20.7071C9.57889 20.9931 10.009 21.0787 10.3827 20.9239C10.7564 20.7691 11 20.4045 11 20V4.00003ZM5.70711 9.70714L9 6.41424V17.5858L5.70711 14.2929L5.41421 14H5H2V10H5H5.41421L5.70711 9.70714ZM15.2929 9.70714L17.5858 12L15.2929 14.2929L16.7071 15.7071L19 13.4142L21.2929 15.7071L22.7071 14.2929L20.4142 12L22.7071 9.70714L21.2929 8.29292L19 10.5858L16.7071 8.29292L15.2929 9.70714Z" fill="currentColor"></path>
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                            <path fillRule="evenodd" clipRule="evenodd" d="M24 12C24 8.28699 22.525 4.72603 19.8995 2.10052L18.4853 3.51474C20.7357 5.76517 22 8.81742 22 12C22 15.1826 20.7357 18.2349 18.4853 20.4853L19.8995 21.8995C22.525 19.274 24 15.7131 24 12ZM11 4.00001C11 3.59555 10.7564 3.23092 10.3827 3.07613C10.009 2.92135 9.57889 3.00691 9.29289 3.29291L4.58579 8.00001H1C0.447715 8.00001 0 8.44773 0 9.00001V15C0 15.5523 0.447715 16 1 16H4.58579L9.29289 20.7071C9.57889 20.9931 10.009 21.0787 10.3827 20.9239C10.7564 20.7691 11 20.4045 11 20V4.00001ZM5.70711 9.70712L9 6.41423V17.5858L5.70711 14.2929L5.41421 14H5H2V10H5H5.41421L5.70711 9.70712ZM16.0001 12C16.0001 10.4087 15.368 8.8826 14.2428 7.75739L12.8285 9.1716C13.5787 9.92174 14.0001 10.9392 14.0001 12C14.0001 13.0609 13.5787 14.0783 12.8285 14.8285L14.2428 16.2427C15.368 15.1174 16.0001 13.5913 16.0001 12ZM17.0709 4.92896C18.9462 6.80432 19.9998 9.34786 19.9998 12C19.9998 14.6522 18.9462 17.1957 17.0709 19.0711L15.6567 17.6569C17.157 16.1566 17.9998 14.1218 17.9998 12C17.9998 9.87829 17.157 7.84346 15.6567 6.34317L17.0709 4.92896Z" fill="currentColor"></path>
                        </svg>
                    )}
                </button>

                {/* Back Button - DESATIVADO TEMPORARIAMENTE 
                <div className="absolute top-20 left-4 sm:left-8 lg:left-12 z-20">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm">Voltar</span>
                    </Link>
                </div>
                FIM - Back Button */}


                {/* Hero Content - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-8 lg:px-12 pb-0 sm:pb-2 lg:pb-4">
                    <div className="max-w-4xl">

                        {/* Title - Otimizado */}
                        <div className="mb-4">
                            <MovieTitle
                                title={movie.title}
                                logos={logos}
                            />
                        </div>

                        {/* Tagline */}
                        {(isSeries ? seriesDetails?.tagline : movieDetails?.tagline) && (
                            <p className="text-gray-400 text-sm sm:text-base italic mt-2 mb-4">
                                "{(isSeries ? seriesDetails?.tagline : movieDetails?.tagline)}"
                            </p>
                        )}

                        {!seriesDetails?.tagline && !movieDetails?.tagline && <div className="mb-4" />}

                        {/* Action Buttons - Netflix Style */}
                        <div
                            className="flex items-center gap-2 mb-6"
                            role="group"
                            aria-label="Ações do filme"
                        >
                            <button
                                onClick={() => {
                                    const playerUrl = isSeries
                                        ? `https://megaembed.com/embed/${movie.tmdb_id}/${selectedSeason}/${selectedEpisode}`
                                        : `https://megaembed.com/embed/${movie.tmdb_id}`;
                                    window.location.href = playerUrl;
                                }}
                                className="bg-white hover:bg-gray-200 text-black font-bold py-2 px-6 sm:px-8
                                    rounded transition-all duration-200 flex items-center justify-center text-sm sm:text-base
                                    focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                                aria-label={`Assistir ${movie.title}`}
                            >
                                <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 fill-current" aria-hidden="true" />
                                Assistir
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setLocalFavorited(!localFavorited);
                                        handleAddToList();
                                    }}
                                    className="bg-[#2a2a2a]/60 hover:bg-[#444444] border-2 border-[#ffffff]/70 text-white p-2
                                        rounded-full transition-all duration-200 flex items-center justify-center w-10 h-10
                                        focus:outline-none focus:ring-0"
                                    aria-label="Adicionar à minha lista"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M11 2V11H2V13H11V22H13V13H22V11H13V2H11Z" fill="currentColor" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleLikeAction}
                                    className="bg-[#2a2a2a]/60 hover:bg-[#444444] border-2 border-[#ffffff]/70 text-white p-2
                                        rounded-full transition-all duration-200 flex items-center justify-center w-10 h-10
                                        focus:outline-none focus:ring-0"
                                    aria-label="Gostei deste filme"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M10.696 8.7732C10.8947 8.45534 11 8.08804 11 7.7132V4H11.8377C12.7152 4 13.4285 4.55292 13.6073 5.31126C13.8233 6.22758 14 7.22716 14 8C14 8.58478 13.8976 9.1919 13.7536 9.75039L13.4315 11H14.7219H17.5C18.3284 11 19 11.6716 19 12.5C19 12.5929 18.9917 12.6831 18.976 12.7699L18.8955 13.2149L19.1764 13.5692C19.3794 13.8252 19.5 14.1471 19.5 14.5C19.5 14.8529 19.3794 15.1748 19.1764 15.4308L18.8955 15.7851L18.976 16.2301C18.9917 16.317 19 16.4071 19 16.5C19 16.9901 18.766 17.4253 18.3994 17.7006L18 18.0006L18 18.5001C17.9999 19.3285 17.3284 20 16.5 20H14H13H12.6228C11.6554 20 10.6944 19.844 9.77673 19.5382L8.28366 19.0405C7.22457 18.6874 6.11617 18.5051 5 18.5001V13.7543L7.03558 13.1727C7.74927 12.9688 8.36203 12.5076 8.75542 11.8781L10.696 8.7732ZM10.5 2C9.67157 2 9 2.67157 9 3.5V7.7132L7.05942 10.8181C6.92829 11.0279 6.72404 11.1817 6.48614 11.2497L4.45056 11.8313C3.59195 12.0766 3 12.8613 3 13.7543V18.5468C3 19.6255 3.87447 20.5 4.95319 20.5C5.87021 20.5 6.78124 20.6478 7.65121 20.9378L9.14427 21.4355C10.2659 21.8094 11.4405 22 12.6228 22H13H14H16.5C18.2692 22 19.7319 20.6873 19.967 18.9827C20.6039 18.3496 21 17.4709 21 16.5C21 16.4369 20.9983 16.3742 20.995 16.3118C21.3153 15.783 21.5 15.1622 21.5 14.5C21.5 13.8378 21.3153 13.217 20.995 12.6883C20.9983 12.6258 21 12.5631 21 12.5C21 10.567 19.433 9 17.5 9H15.9338C15.9752 8.6755 16 8.33974 16 8C16 6.98865 15.7788 5.80611 15.5539 4.85235C15.1401 3.09702 13.5428 2 11.8377 2H10.5Z" fill="currentColor" />
                                    </svg>
                                </button>
                            </div>


                        </div>


                        {/* Movie/Series Info */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base">
                            {movie.score && (
                                <span className="text-[#46d369] font-bold">{Math.round(Number(movie.score) * 10)}% Match</span>
                            )}
                            <span className="text-white font-bold">{displayYear}</span>

                            {/* Age Rating Badge - Estilo Netflix */}
                            {(isSeries ? seriesDetails?.ageRating : movieDetails?.ageRating) && (
                                <div className="flex items-center justify-center bg-[#d7262d] rounded-[3px] min-w-[26px] sm:min-w-[32px] h-[26px] sm:h-[32px] px-1 shadow-sm overflow-hidden">
                                    <span
                                        className="text-white block"
                                        style={{
                                            fontFamily: '"Arial Black", "Arial", sans-serif',
                                            fontSize: 'clamp(13px, 3.5vw, 16px)',
                                            fontWeight: 900,
                                            lineHeight: 'normal',
                                            letterSpacing: '-0.5px',
                                            transform: 'translateY(-1px)' // Levanta o texto ligeiramente para compensar a base da fonte
                                        }}
                                    >
                                        {(isSeries ? (seriesDetails?.ageRating === '+18' ? '18' : seriesDetails?.ageRating) : (movieDetails?.ageRating === '+18' ? '18' : movieDetails?.ageRating))}
                                    </span>
                                </div>
                            )}

                            <span className="text-white font-bold">{displayDuration}</span>
                            {(() => {
                                const genres = (isSeries ? seriesDetails?.genres : movieDetails?.genres) || movie.genre || [];
                                if (genres.length >= 2) {
                                    return (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                                            <span className="text-gray-400">{genres[0]}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                                            <span className="text-gray-400">{genres[1]}</span>
                                        </>
                                    );
                                } else if (genres.length === 1) {
                                    return (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                                            <span className="text-gray-400">{genres[0]}</span>
                                        </>
                                    );
                                }
                                return null;
                            })()}

                        </div>
                    </div>
                </div>

            </section>

            {/* Content */}
            <div className="relative z-20 bg-[#121212] overflow-clip">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">

                    {/* Synopsis */}
                    <section className="py-8">
                        <p className="text-gray-200 text-sm sm:text-base leading-relaxed max-w-4xl">
                            {!isSynopsisExpanded && synopsis.length > SYNOPSIS_LIMIT
                                ? `${synopsis.slice(0, SYNOPSIS_LIMIT)}...`
                                : synopsis}
                        </p>
                        {synopsis.length > SYNOPSIS_LIMIT && (
                            <button
                                onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                                className="text-white hover:text-gray-300 text-sm font-medium mt-2 transition-colors"
                            >
                                {isSynopsisExpanded ? 'Ler menos' : 'Ler mais'}
                            </button>
                        )}


                        {/* Quick Info */}
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-gray-500">

                            {(isSeries ? seriesDetails?.director : movieDetails?.director) && (
                                <span>{isSeries ? 'Criação' : 'Direção'}: <span className="text-gray-300">{(isSeries ? seriesDetails?.director : movieDetails?.director)}</span></span>
                            )}

                            {/* Star Rating based on Score */}
                            {(movie.score ?? 0) > 0 && (
                                <div className="flex items-center gap-2" title={`Avaliação: ${movie.score}/10`}>
                                    <span>Avaliação do público:</span>
                                    <div className="flex relative">
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const ratingValue = (movie.score ?? 0) / 2; // Convert 0-10 to 0-5
                                            const fillPercentage = Math.min(Math.max((ratingValue - (star - 1)) * 100, 0), 100);

                                            return (
                                                <div key={star} className="relative w-4 h-4 mr-0.5">
                                                    <svg
                                                        className="w-full h-full"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <defs>
                                                            <linearGradient id={`starGradient-${star}-${movie.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                                <stop offset={`${fillPercentage}%`} stopColor="white" />
                                                                <stop offset={`${fillPercentage}%`} stopColor="#4b5563" /> {/* gray-600 hex */}
                                                            </linearGradient>
                                                        </defs>
                                                        <path
                                                            fill={`url(#starGradient-${star}-${movie.id})`}
                                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                        />
                                                    </svg>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <span className="text-sm font-bold text-white">{((movie.score ?? 0) / 2).toFixed(1)}</span>
                                </div>
                            )}

                            {/* Informações adicionais para séries */}
                            {isSeries && seriesDetails && (
                                <>
                                    <span>Data de lançamento: <span className="text-gray-300">{seriesDetails.first_air_date}</span></span>
                                    <span>Última data: <span className="text-gray-300">{seriesDetails.last_air_date}</span></span>
                                </>
                            )}
                        </div>


                        {/* Keywords/Tags - Desativado a pedido do usuario
                        {keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">

                                {keywords.map((keyword) => (
                                    <span
                                        key={keyword.id}
                                        className="px-3 py-1 text-xs text-gray-400 bg-white/5 hover:bg-white/10 
                                            rounded-full border border-white/10 transition-colors cursor-default"
                                    >
                                        {keyword.name}
                                    </span>
                                ))}
                            </div>
                        )}
                        */}
                    </section>



                    {/* Seletor de temporadas e carrossel de episódios para séries */}
                    {isSeries && seriesDetails?.seasons && seriesDetails.seasons.length > 0 && (
                        <section className="py-8">

                            {/* Cabeçalho da seção */}
                            <div className="mb-6">
                                <h2 className="text-white text-xl font-semibold mb-2">Episódios</h2>
                                {seriesDetails && (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span>{seriesDetails.number_of_seasons} Temporadas</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-500" />
                                        <span>{seriesDetails.number_of_episodes} Episódios</span>
                                    </div>
                                )}
                            </div>

                            {/* Seletor de temporadas - Dropdown compacto */}
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-white font-medium">Temporada:</span>
                                <div className="relative">
                                    <select
                                        value={selectedSeason}
                                        onChange={(e: any) => fetchSeasonDetails(Number(e.target.value))}
                                        className="bg-[#1f1f1f] text-white border border-white/20 rounded-lg py-2 pl-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent cursor-pointer"
                                    >
                                        {seriesDetails.seasons
                                            .filter(season => season.season_number !== 0) // Excluir temporada especial
                                            .map((season) => (
                                                <option
                                                    key={season.season_number}
                                                    value={season.season_number}
                                                    className="bg-[#1f1f1f] text-white"
                                                >
                                                    {season.season_number}
                                                </option>
                                            ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-gray-400 text-sm">
                                    de {seriesDetails.seasons.filter(s => s.season_number !== 0).length}
                                </span>
                            </div>

                            {/* Carrossel de episódios */}
                            <div className="relative group/episode">
                                {/* Botões de navegação - Estilo igual ao carrossel principal */}
                                <button
                                    onClick={() => scrollEpisodes('left')}
                                    className={cn(
                                        "absolute left-0 top-0 bottom-0 z-20 w-12",
                                        "flex items-center justify-start pl-2",
                                        "transition-opacity duration-300",
                                        showLeftEpisodeArrow ? "opacity-100" : "opacity-0 pointer-events-none"
                                    )}
                                >
                                    <div className="p-2 bg-black/60 transition-all duration-200 backdrop-blur-sm border border-white/10">
                                        <ChevronLeft className="w-4 h-4 text-white" />
                                    </div>
                                </button>

                                <button
                                    onClick={() => scrollEpisodes('right')}
                                    className={cn(
                                        "absolute right-0 top-0 bottom-0 z-20 w-12",
                                        "flex items-center justify-end pr-2",
                                        "transition-opacity duration-300",
                                        showRightEpisodeArrow ? "opacity-100" : "opacity-0 pointer-events-none"
                                    )}
                                >
                                    <div className="p-2 bg-black/60 transition-all duration-200 backdrop-blur-sm border border-white/10">
                                        <ChevronRight className="w-4 h-4 text-white" />
                                    </div>
                                </button>

                                {/* Conteúdo rolável */}
                                <div
                                    ref={episodesScrollRef}
                                    onScroll={handleEpisodeScroll}
                                    className="flex gap-4 overflow-x-auto py-4 scrollbar-hide px-6"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {isLoadingDetails ? (
                                        <div className="flex gap-4 py-2">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="shrink-0 w-64">
                                                    <div className="animate-pulse bg-white/10 rounded-lg h-36 mb-2" />
                                                    <div className="animate-pulse bg-white/10 rounded h-4 w-3/4 mb-1" />
                                                    <div className="animate-pulse bg-white/10 rounded h-3 w-1/2" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : seasonDetails?.episodes && seasonDetails.episodes.length > 0 ? (
                                        <>
                                            {seasonDetails.episodes.map((episode) => (
                                                <div
                                                    key={episode.id}
                                                    onClick={() => {
                                                        setSelectedEpisode(episode.episode_number);
                                                        const playerSection = document.getElementById('player-section');
                                                        if (playerSection) {
                                                            const headerOffset = 100;
                                                            const elementPosition = playerSection.getBoundingClientRect().top;
                                                            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                                                            window.scrollTo({
                                                                top: offsetPosition,
                                                                behavior: "smooth"
                                                            });
                                                        }
                                                    }}
                                                    className={`shrink-0 w-64 bg-[#1f1f1f] rounded-lg overflow-hidden hover:scale-105 transition-all duration-200 cursor-pointer
                                                        ${selectedEpisode === episode.episode_number ? 'ring-2 ring-[#46d369] ring-offset-2 ring-offset-[#1f1f1f]' : ''}`}
                                                >
                                                    <div className="relative">
                                                        {episode.still_path ? (
                                                            <img
                                                                src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                                                alt={episode.name}
                                                                className="w-full h-36 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-36 bg-gray-800 flex items-center justify-center">
                                                                <Play className="w-8 h-8 text-gray-600" />
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                            {episode.runtime ? `${episode.runtime}min` : `Ep ${episode.episode_number}`}
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        {/* <h3 className="text-white font-medium text-sm mb-1 truncate">
                                                            {episode.episode_number}. {episode.name}
                                                        </h3> */}
                                                        <p className="text-gray-400 text-xs line-clamp-2">
                                                            {episode.overview || 'Sem descrição disponível.'}
                                                        </p>
                                                        {episode.air_date && (
                                                            <p className="text-gray-500 text-xs mt-1">
                                                                {new Date(episode.air_date).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                        </>
                                    ) : (
                                        <p className="text-gray-400">Nenhum episódio encontrado para esta temporada.</p>
                                    )}
                                </div>
                            </div>
                        </section>

                    )}

                    {/* ═══════════════════════════════════════════════════════════
                         PLAYER SECTION — DESATIVADO (comentado em 25/06/2026)
                         
                         Para REATIVAR o player com backdrop e iframe:
                         1. Descomente todo o bloco abaixo (remova as barras e asteriscos)
                         2. E remova a linha: const playerUrl = ...
                         3. O botão "Assistir" acima controla a abertura do vídeo
                         
                         Código original comentado abaixo:
                    ═══════════════════════════════════════════════════════════ */}
                    {/* 
                    <section
                        id="player-section"
                        className="relative py-12"
                        aria-label="Video Player"
                    >
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen -z-10">
                            <img
                                src={(movie.backdrop_url && movie.backdrop_url !== '')
                                    ? movie.backdrop_url
                                    : (movie.poster_url && movie.poster_url !== '')
                                        ? movie.poster_url
                                        : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1920&h=1080&fit=crop'}
                                alt=""
                                className="w-full h-full object-cover grayscale brightness-50"
                                aria-hidden="true"
                            />
                            <div className="absolute inset-0 bg-linear-to-b from-[#121212] via-transparent to-[#121212]" />
                        </div>

                        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative z-10 max-w-3xl mx-auto">
                            <iframe
                                src={
                                    isSeries
                                        ? `https://megaembed.com/embed/${movie.tmdb_id}/${selectedSeason}/${selectedEpisode}`
                                        : `https://megaembed.com/embed/${movie.tmdb_id}`
                                }
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                            />
                        </div>

                        <VideoPlayer
                            title={movie.title}
                            posterUrl={movie.poster_url}
                            backdropUrl={movie.backdrop_url}
                            duration={movie.duration}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />
                    </section>
                    */}


                    {/* Collection/Franchise */}
                    {collection && collection.parts.length > 1 && (
                        <section className="py-8">

                            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                {/* Backdrop */}
                                {collection.backdrop_path && (
                                    <div className="absolute inset-0">
                                        <img
                                            src={`https://image.tmdb.org/t/p/w1280${collection.backdrop_path}` || movie.backdrop_url || movie.poster_url}
                                            alt={collection.name}
                                            className="w-full h-full object-cover blur-[3px] scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/50" />
                                        <div className="absolute inset-0 bg-linear-to-r from-[#121212]/90 via-transparent to-transparent" />
                                        <div className="absolute inset-0 bg-linear-to-t from-[#121212]/80 via-transparent to-transparent" />
                                        {/* Brilho do Modal */}
                                        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.06), transparent 50%)' }} />
                                    </div>
                                )}

                                <div className={`relative z-10 p-4 sm:p-5 ${!collection.backdrop_path ? 'bg-[#1f1f1f]' : ''}`}>
                                    <h2 className="text-white text-lg font-semibold mb-1">{collection.name}</h2>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Parte de uma coleção com {collection.parts.length} títulos
                                    </p>
                                    <div className="relative group/collection">
                                        {/* Left Arrow */}
                                        {showLeftCollectionArrow && (
                                            <button
                                                onClick={() => scrollCollection('left')}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg bg-white/10 hover:bg-[#1DB954] transition-all duration-200 backdrop-blur-sm"
                                            >
                                                <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </button>
                                        )}
                                        {/* Right Arrow */}
                                        {showRightCollectionArrow && (
                                            <button
                                                onClick={() => scrollCollection('right')}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg bg-white/10 hover:bg-[#1DB954] transition-all duration-200 backdrop-blur-sm"
                                            >
                                                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </button>
                                        )}
                                        <div
                                            ref={collectionScrollRef}
                                            onScroll={handleCollectionScroll}
                                            className="flex gap-4 overflow-x-auto py-3 px-1 -mx-1 scrollbar-hide"
                                        >
                                            {collection.parts.map((part) => {
                                                const isCurrentMovie = part.id === movie.tmdb_id;
                                                return (
                                                    <div
                                                        key={part.id}
                                                        onClick={() => !isCurrentMovie && router.push(`/watch?ref=${part.id}`)}
                                                        className={`shrink-0 group ${isCurrentMovie ? 'cursor-default' : 'cursor-pointer'} hover:scale-103 hover:-translate-y-1 transition-all duration-200`}
                                                    >

                                                        <div
                                                            className={`relative w-28 sm:w-32 lg:w-36 aspect-2/3 rounded-lg overflow-hidden bg-[#1f1f1f] transition-all duration-300
                                                    ${isCurrentMovie ? 'ring-2 ring-[#46d369] ring-offset-2 ring-offset-[#1f1f1f]' : 'hover:ring-1 hover:ring-white/30'}`}
                                                            role="button"
                                                            tabIndex={isCurrentMovie ? -1 : 0}
                                                            aria-label={isCurrentMovie ? `${part.title} - Assistindo agora` : `Assistir ${part.title}`}
                                                            onKeyDown={(e) => {
                                                                if (!isCurrentMovie && (e.key === 'Enter' || e.key === ' ')) {
                                                                    router.push(`/watch?ref=${part.id}`);
                                                                }
                                                            }}
                                                        >
                                                            {part.poster_path && part.poster_path !== '' ? (
                                                                <img
                                                                    src={`https://image.tmdb.org/t/p/w342${part.poster_path}`}
                                                                    alt=""
                                                                    loading="lazy"
                                                                    className={`w-full h-full object-cover transition-all duration-300
                                                                ${isCurrentMovie ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#2a2a2a] to-[#1a1a1a] text-gray-400 text-xs p-3 text-center font-medium">
                                                                    {part.title}
                                                                </div>
                                                            )}
                                                            {isCurrentMovie && (
                                                                <div className="absolute bottom-0 left-0 right-0 bg-[#46d369] py-1 text-center">
                                                                    <span className="text-black text-[10px] font-bold uppercase">Assistindo</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className={`text-xs mt-2 truncate w-28 sm:w-32 lg:w-36 transition-colors text-center ${isCurrentMovie ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'}`}>
                                                            {part.title}
                                                        </p>
                                                        {part.release_date && (
                                                            <p className="text-gray-400 text-[11px] mt-1 text-center">
                                                                {new Date(part.release_date).getFullYear()}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                    )}


                    {/* Do Mesmo Criador - Para Séries (Slider estilo Collection com backdrop dinâmico) */}
                    {isSeries && creatorSeries.length > 0 && creatorInfo && (
                        <section className="py-8">

                            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                {/* Backdrop Dinâmico com transição suave e efeito de blur - usando mesma abordagem do Hero */}
                                <div className="absolute inset-0">
                                    {creatorSeries.map((series, index) => (
                                        <div
                                            key={`creator-backdrop-${index}-${movie.tmdb_id}`}
                                            className={`absolute inset-0 w-full h-full transition-all duration-2000 ease-out ${index === activeCreatorBackdrop
                                                ? 'opacity-100 scale-100 blur-[3px]'
                                                : 'opacity-0 scale-105 blur-lg'
                                                }`}
                                        >
                                            <img
                                                src={(series.backdrop_url && series.backdrop_url !== '')
                                                    ? series.backdrop_url
                                                    : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop'}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Garantir fallback para não ter fundo vazio
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop';
                                                }}
                                            />
                                        </div>
                                    ))}
                                    <div className="absolute inset-0 bg-black/50" />
                                    <div className="absolute inset-0 bg-linear-to-r from-[#121212]/90 via-transparent to-transparent" />
                                    <div className="absolute inset-0 bg-linear-to-t from-[#121212]/80 via-transparent to-transparent" />
                                    {/* Brilho do Modal */}
                                    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.06), transparent 50%)' }} />
                                </div>

                                <div className="relative z-10 p-4 sm:p-5">
                                    <h2 className="text-white text-lg font-semibold mb-1">Mais de {creatorInfo.name}</h2>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Outras séries do mesmo criador de {movie.title}
                                    </p>
                                    <div className="relative group/creator">
                                        {/* Left Arrow */}
                                        {showLeftCreatorArrow && (
                                            <button
                                                onClick={() => scrollCreator('left')}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg bg-white/10 hover:bg-[#1DB954] transition-all duration-200 backdrop-blur-sm"
                                            >
                                                <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </button>
                                        )}
                                        {/* Right Arrow */}
                                        {showRightCreatorArrow && (
                                            <button
                                                onClick={() => scrollCreator('right')}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg bg-white/10 hover:bg-[#1DB954] transition-all duration-200 backdrop-blur-sm"
                                            >
                                                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </button>
                                        )}
                                        <div
                                            ref={creatorScrollRef}
                                            onScroll={handleCreatorScroll}
                                            className="flex gap-4 overflow-x-auto py-3 px-1 -mx-1 scrollbar-hide"
                                        >

                                            {creatorSeries.map((series, index) => (
                                                <div
                                                    key={series.id}
                                                    onClick={() => {
                                                        handleCreatorUserInteraction(index);
                                                        handleSimilarMovieClick(series);
                                                    }}
                                                    className="shrink-0 group cursor-pointer hover:scale-103 hover:-translate-y-1 transition-all duration-200"
                                                >

                                                    <div
                                                        className={`relative w-28 sm:w-32 lg:w-36 aspect-2/3 rounded-lg overflow-hidden bg-[#1f1f1f] transition-all duration-300
                                                            ${index === selectedCreatorIndex ? 'ring-2 ring-[#46d369] ring-offset-2 ring-offset-transparent' : 'hover:ring-1 hover:ring-white/30'}`}
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-label={`Assistir ${series.title}`}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                handleCreatorUserInteraction(index);
                                                                handleSimilarMovieClick(series);
                                                            }
                                                        }}
                                                    >
                                                        {series.poster_url && series.poster_url !== '' ? (
                                                            <img
                                                                src={series.poster_url}
                                                                alt=""
                                                                loading="lazy"
                                                                className={`w-full h-full object-cover transition-all duration-300
                                                                    ${index === selectedCreatorIndex ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#2a2a2a] to-[#1f1f1f] text-gray-400 text-xs p-3 text-center font-medium">
                                                                {series.title}
                                                            </div>
                                                        )}

                                                        {/* Barra de progresso - igual ao CastSlider */}
                                                        {!isCreatorPaused && creatorSeries.length > 1 && index === selectedCreatorIndex && (
                                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                                                                <div
                                                                    key={`progress-${selectedCreatorIndex}`}
                                                                    className="h-full bg-[#46d369]"
                                                                    style={{
                                                                        width: '0%',
                                                                        animation: `creatorProgress ${CREATOR_AUTO_PLAY_INTERVAL / 1000}s linear forwards`
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                    </div>
                                                    <p className={`text-xs mt-2 truncate w-28 sm:w-32 lg:w-36 transition-colors text-center
                                                        ${index === selectedCreatorIndex ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'}`}>
                                                        {series.title}
                                                    </p>
                                                    {series.year && (
                                                        <p className="text-gray-400 text-[11px] mt-1 text-center">
                                                            {series.year}
                                                        </p>
                                                    )}
                                                </div>

                                            ))}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </section>

                    )}



                    {/* Cast */}
                    {isLoadingDetails ? (
                        <CastSkeleton />
                    ) : cast.length > 0 && (
                        <section
                            className="py-8"
                            aria-label="Elenco principal do filme"
                        >
                            <CastSlider cast={cast} />
                        </section>
                    )}


                    {/* Trailers Section - DESATIVADO TEMPORARIAMENTE
                    {trailers.length > 0 && (
                        <section
                            className="py-8 bg-[#1f1f1f] rounded-lg p-6"
                            aria-labelledby="trailers-heading"
                        >
                            <h2 id="trailers-heading" className="text-white text-lg font-semibold mb-4">Trailers & Teasers</h2>

                            <div className="relative">
                                {showLeftTrailersArrow && (
                                    <button
                                        onClick={() => scrollTrailers('left')}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg bg-white/10 hover:bg-[#1DB954] transition-all duration-200 backdrop-blur-sm"
                                    >
                                        <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                    </button>
                                )}
                                {showRightTrailersArrow && (
                                    <button
                                        onClick={() => scrollTrailers('right')}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-lg bg-white/10 hover:bg-[#1DB954] transition-all duration-200 backdrop-blur-sm"
                                    >
                                        <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                    </button>
                                )}
                                <div
                                    ref={trailersScrollRef}
                                    onScroll={handleTrailersScroll}
                                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                                    role="list"
                                    aria-label="Lista de trailers"
                                >

                                    {trailers.map((trailer, i) => (
                                        <a
                                            key={i}
                                            href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-md hover:scale-103 hover:-translate-y-1 transition-all duration-200"
                                            role="listitem"
                                            aria-label={`Assistir ${trailer.type}: ${trailer.name} no YouTube`}
                                        >
                                            <div className="relative w-48 sm:w-56 aspect-video rounded-md overflow-hidden bg-[#1f1f1f]">

                                                <img
                                                    src={`https://img.youtube.com/vi/${trailer.key}/mqdefault.jpg`}
                                                    alt=""
                                                    loading="lazy"
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />
                                                <div
                                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    aria-hidden="true"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center scale-50 group-hover:scale-100 transition-transform">
                                                        <Play className="w-4 h-4 text-black ml-0.5" />
                                                    </div>
                                                </div>

                                                <div className="absolute bottom-2 left-2">
                                                    <span className="text-white/90 text-[10px] font-medium uppercase tracking-wide">
                                                        {trailer.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                    ))}

                                </div>

                            </div>
                        </section>

                    )}
                    FIM - Trailers Section */}

                    {/* Discussões - Desativado temporariamente
                    <section
                        className="py-8 mt-6 border-b border-white/10 bg-[#1f1f1f] rounded-lg p-6"
                        aria-labelledby="discussions-heading"
                    >
                        <h2 id="discussions-heading" className="text-white text-lg font-semibold mb-6">Discussões</h2>

                        <div
                            className="flex gap-3 mb-8 max-w-3xl"
                        >
                            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shrink-0" aria-hidden="true">
                                <span className="text-white text-sm font-medium">U</span>
                            </div>
                            <div className="flex-1">
                                <label htmlFor="comment-input" className="sr-only">Adicionar um comentário</label>
                                <textarea
                                    id="comment-input"
                                    placeholder="Adicionar um comentário..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/20 text-white placeholder:text-gray-500 
                                        resize-none focus:border-white/50 min-h-[40px] py-2 outline-none text-sm
                                        focus:ring-1 focus:ring-white/30"
                                    rows={1}
                                />
                                {comment.trim() && (
                                    <div
                                        className="flex justify-end mt-2 gap-2"
                                    >
                                        <button
                                            onClick={() => setComment('')}
                                            className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="bg-[#3ea6ff] hover:bg-[#65b8ff] text-black font-medium text-sm rounded-full px-4 py-1.5
                                                transition-colors"
                                        >
                                            Comentar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            className="space-y-6 max-w-3xl"
                        >
                            {[
                                { user: 'Maria S.', text: 'Filme incrível! A fotografia é de tirar o fôlego.', time: '2 horas atrás', likes: 24 },
                                { user: 'João P.', text: 'Um dos melhores que vi esse ano. Super recomendo!', time: '5 horas atrás', likes: 18 },
                                { user: 'Ana L.', text: 'A atuação do elenco principal é impecável.', time: '1 dia atrás', likes: 42 },
                            ].map((c, i) => (
                                <div
                                    key={i}
                                    className="flex gap-3"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                                        <span className="text-white text-sm font-medium">{c.user[0]}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white text-sm font-medium">{c.user}</span>
                                            <span className="text-gray-500 text-xs">{c.time}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">{c.text}</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <button
                                                className="flex items-center gap-1 text-gray-500 hover:text-white text-xs transition-colors"
                                            >
                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                <span>{c.likes}</span>
                                            </button>
                                            <button
                                                className="text-gray-500 hover:text-white text-xs transition-colors"
                                            >
                                                Responder
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    */}


                    {/* Similar Movies */}
                    {isLoadingDetails ? (
                        <SectionSkeleton />
                    ) : similarMovies.length > 0 && (
                        <section
                            className="py-8 -mx-4 sm:-mx-8 lg:-mx-12"
                            aria-label="Títulos semelhantes a este filme"
                        >
                            <Carousel
                                title="Títulos Semelhantes"
                                movies={similarMovies}
                                onMovieClick={handleSimilarMovieClick}
                            />
                        </section>
                    )}

                </div>
            </div >
            {/* Movie Modal */}
            < MovieModal
                movie={selectedModalMovie}
                isOpen={!!selectedModalMovie
                }
                onClose={() => setSelectedModalMovie(null)}
                onWatch={(movie: Movie) => {
                    setSelectedModalMovie(null);
                    router.push(`/watch?ref=${movie.tmdb_id}&type=${movie.type}`);
                }}
                onAddToList={() => { }}
            />
            {/* Modal de Login Necessário */}
            <LoginRequiredModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />
        </div >
    );
}


