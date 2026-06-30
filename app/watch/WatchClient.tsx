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
import { calcMatch } from '@/lib/match';
import { useWatchNavigation } from '@/hooks/useWatchNavigation';
import { useLogoStore } from '@/stores/logoStore';
import LoginRequiredModal from '@/components/streaming/LoginRequiredModal';
import RatingTooltip from '@/components/ui/RatingTooltip';

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
    const searchParams = useSearchParams();
    const movieId = searchParams.get('id');
    const urlTmdbId = searchParams.get('ref');
    const urlMediaType = searchParams.get('type') || 'movie';
    const urlRank = searchParams.get('rank');
    const urlSeason = searchParams.get('season');
    const urlEpisode = searchParams.get('episode');

    // Override local — ao clicar em item da Coleção, troca o filme SEM navegar
    // Isso elimina o round-trip ao servidor em produção
    const [localOverride, setLocalOverride] = useState<{
        tmdbId: string;
        mediaType: string;
        title: string;
        poster_url: string;
        backdrop_url: string;
        year: number;
    } | null>(null);

    // Hook de navegação otimizada (recebe setLocalOverride para fast-path)
    const { navigateToWatch } = useWatchNavigation(setLocalOverride);
    
    const { getLogosForMovie } = useLogoStore();

    // Valores ativos (override local tem prioridade sobre URL)
    const tmdbId = localOverride?.tmdbId ?? urlTmdbId;
    const mediaType = localOverride?.mediaType ?? urlMediaType;

    // Limpar override se a URL mudar externamente (ex: botão voltar do browser)
    useEffect(() => {
        if (localOverride && urlTmdbId !== localOverride.tmdbId) {
            setLocalOverride(null);
        }
    }, [urlTmdbId, localOverride]);

    // ── DEBUG: marca o momento em que o componente renderiza com novo tmdbId
    const navStartRef = useRef<number>(0);
    const lastLoggedTmdbId = useRef<string | null>(null);
    if (tmdbId !== lastLoggedTmdbId.current) {
        navStartRef.current = performance.now();
        lastLoggedTmdbId.current = tmdbId;
        // console.log(`%c[WATCH PERF] ▶ Novo tmdbId=${tmdbId} — componente começou a renderizar (t=0ms)`, 'color:#0af;font-weight:bold');
        const cached = queryClient.getQueryData(['movie', 'tmdb', tmdbId, mediaType]);
        // console.log(`%c[WATCH PERF] Cache React Query para este tmdbId:`, 'color:#0af', cached ? '✅ HIT — dados já disponíveis' : '❌ MISS — vai buscar da API');
    }
    
    // Estado para controlar se o componente foi montado no cliente (evita erro de hidratação)
    const [isMounted, setIsMounted] = useState(false);

    // Marcar como montado após o primeiro render no cliente
    useEffect(() => {
        setIsMounted(true);
        // console.log(`%c[WATCH PERF] ✅ isMounted=true (t=+${(performance.now() - navStartRef.current).toFixed(0)}ms)`, 'color:#0af');
    }, []);

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

    const [comment, setComment] = useState('');
    const [movieDetails, setMovieDetails] = useState<{ overview?: string; budget?: number; director?: string; cast: CastMember[]; genres?: string[]; runtime?: number; tagline?: string; ageRating?: string; belongs_to_collection?: { id: number; name: string; poster_path: string; backdrop_path: string } | null } | null>(null);
    const [seriesDetails, setSeriesDetails] = useState<{ overview?: string; director?: string; cast: CastMember[]; genres?: string[]; tagline?: string; ageRating?: string; seasons?: { id: number; season_number: number; episode_count: number; name: string; air_date: string; poster_path: string }[]; number_of_seasons?: number; number_of_episodes?: number; first_air_date?: string; last_air_date?: string } | null>(null);
    const [seasonDetails, setSeasonDetails] = useState<{ episodes: { id: number; episode_number: number; name: string; overview: string; air_date: string; runtime: number; still_path: string; vote_average: number }[] } | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<number>(urlSeason ? Number(urlSeason) : 1);
    const [selectedEpisode, setSelectedEpisode] = useState<number>(urlEpisode ? Number(urlEpisode) : 1);
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
    // Ref para dados da coleção ao navegar entre itens (evita loading ao clicar em poster)
    const pendingNavigationRef = useRef<{ id: number; title: string; poster_path: string; release_date: string } | null>(null);
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
    const [currentRating, setCurrentRating] = useState<'love' | 'like' | 'dislike' | null>(null);
    const [showRatingTooltip, setShowRatingTooltip] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    useEffect(() => {
        try {
            const u = localStorage.getItem('userBasicInfo');
            if (u) {
                setUserId(JSON.parse(u).id);
            } else {
                router.replace('/');
                setTimeout(() => window.dispatchEvent(new Event('requireLogin')), 100);
            }
        } catch { 
            router.replace('/');
            setTimeout(() => window.dispatchEvent(new Event('requireLogin')), 100);
        }
    }, [router]);
    const [watchMatch, setWatchMatch] = useState<number | null>(null);

    const { data: watchlistData = { items: [] } } = useQuery({
        queryKey: ['watchlist', userId],
        queryFn: () => fetch(`/api/watchlist?userId=${userId}`).then(r => r.json()),
        enabled: !!userId,
    });

    const [volume, setVolume] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const backdropVideoRef = useRef<HTMLVideoElement>(null);
    const episodesScrollRef = useRef<HTMLDivElement>(null);
    const collectionScrollRef = useRef<HTMLDivElement>(null);
    const trailersScrollRef = useRef<HTMLDivElement>(null);
    const creatorScrollRef = useRef<HTMLDivElement>(null);
    const creatorPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Guarda dados do item clicado na coleção para renderização instantânea
    const pendingNavRef = useRef<{ id: number; title: string; poster_path: string; release_date: string } | null>(null);
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
            // console.log(`%c[WATCH PERF] 🔍 movieById queryFn iniciou (t=+${(performance.now() - navStartRef.current).toFixed(0)}ms)`, 'color:#0af');
            const movies = await base44.entities.Movie.filter({ id: movieId! });
            // console.log(`%c[WATCH PERF] ✅ movieById queryFn concluiu (t=+${(performance.now() - navStartRef.current).toFixed(0)}ms)`, 'color:#0af');
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
            // console.log(`%c[WATCH PERF] 🔍 movieByTmdb queryFn iniciou (t=+${(performance.now() - navStartRef.current).toFixed(0)}ms)`, 'color:#0af');
            const t1 = performance.now();
            const movies = await base44.entities.Movie.filter({ tmdb_id: Number(tmdbId) });
            // console.log(`%c[WATCH PERF]   ↳ base44 filter concluiu em ${(performance.now() - t1).toFixed(0)}ms (t=+${(performance.now() - navStartRef.current).toFixed(0)}ms)`, 'color:#0af');
            if (movies[0]) {
                // console.log(`%c[WATCH PERF] ✅ movieByTmdb encontrado no banco local`, 'color:#0af');
                return movies[0];
            }

            const tmdbIdNum = Number(tmdbId);
            const isSeries = mediaType === 'series';
            const endpoint = isSeries ? 'tv' : 'movie';

            let tmdbData: any = null;
            try {
                const response = await fetch(`/api/content/${endpoint}/${tmdbIdNum}?language=pt-BR`);
                if (response.ok) {
                    tmdbData = await response.json();
                }
            } catch { /* ignore */ }

            if (tmdbData && Object.keys(tmdbData).length > 0 && !tmdbData.error) {
                const title = tmdbData.title || tmdbData.name || 'Untitled';
                const releaseDate = tmdbData.release_date || tmdbData.first_air_date || '';
                const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();

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
                    score: tmdbData.vote_average ? parseFloat(Number(tmdbData.vote_average).toFixed(1)) : 0,
                    tmdb_id: tmdbIdNum,
                    category: 'trending' as const,
                };
            }

            return {
                id: `tmdb-${tmdbIdNum}`,
                title: 'Assistir',
                type: isSeries ? 'series' as const : 'movie' as const,
                year: new Date().getFullYear(),
                rating: 'NR',
                duration: '',
                genre: [],
                synopsis: '',
                cast: [],
                director: '',
                poster_url: '',
                backdrop_url: '',
                tmdb_id: tmdbIdNum,
                category: 'trending' as const,
            };
        },
        enabled: !!tmdbId,
        staleTime: 1000 * 60 * 30, // 30 minutos
        gcTime: 1000 * 60 * 60, // 1 hora
        // Renderização instantânea ao navegar entre itens da mesma coleção
        initialData: () => {
            const nav = pendingNavRef.current;
            if (nav?.id === Number(tmdbId)) {
                pendingNavRef.current = null;
                return {
                    id: `tmdb-${nav.id}`,
                    title: nav.title,
                    type: 'movie' as const,
                    year: nav.release_date ? new Date(nav.release_date).getFullYear() : new Date().getFullYear(),
                    rating: 'NR',
                    duration: '',
                    genre: [],
                    synopsis: '',
                    cast: [],
                    director: '',
                    poster_url: nav.poster_path ? `https://image.tmdb.org/t/p/w500${nav.poster_path}` : '',
                    backdrop_url: '',
                    score: 0,
                    tmdb_id: nav.id,
                    category: 'trending' as const,
                };
            }
            return undefined;
        },
        // Forçar stale imediatamente para buscar dados reais em background
        initialDataUpdatedAt: 0,
    });

    const movie = movieById || movieByTmdb;
    const watchlistTmdbIds = new Set(watchlistData.items.map((i: any) => i.tmdb_id));
    const isInWatchlist = movie && movie.tmdb_id ? watchlistTmdbIds.has(Number(movie.tmdb_id)) : false;

    useEffect(() => {
        if (!userId || !movie?.tmdb_id || !movie.type) return;
        const params = new URLSearchParams({
            userId: String(userId),
            tmdbId: String(movie.tmdb_id),
            mediaType: movie.type,
        });
        if (movie.score != null) params.set('tmdbScore', String(movie.score));
        if (movie.genre?.length) params.set('genres', movie.genre.join(','));
        fetch(`/api/match?${params}`)
            .then(r => r.json())
            .then(data => setWatchMatch(data.match))
            .catch(() => {});
    }, [userId, movie?.tmdb_id, movie?.type]);

    useEffect(() => {
        if (!userId || !movie?.tmdb_id) return;
        fetch(`/api/ratings?userId=${userId}`)
            .then(r => r.json())
            .then(data => {
                const ratings = data.ratings || {};
                const tmdbId = Number(movie.tmdb_id);
                if (ratings[String(tmdbId)]) {
                    setCurrentRating(ratings[String(tmdbId)]);
                }
            })
            .catch(() => {});
    }, [userId, movie?.tmdb_id]);

    const [savedHistory, setSavedHistory] = useState<{ seasonNumber: number; episodeNumber: number } | null>(null);

    useEffect(() => {
        if (!userId || !movie?.tmdb_id) return;
        fetch(`/api/watch-history?userId=${userId}`)
            .then(r => r.json())
            .then(data => {
                const items = data.items || [];
                const match = items.find((i: any) => Number(i.tmdb_id) === Number(movie.tmdb_id) && i.media_type === movie.type);
                if (match && match.season_number > 0 && match.episode_number > 0) {
                    setSavedHistory({ seasonNumber: match.season_number, episodeNumber: match.episode_number });
                }
            })
            .catch(() => {});
    }, [userId, movie?.tmdb_id, movie?.type]);

    const handleRatingAction = async (tmdbId: number, mediaType: string, value: 'love' | 'like' | 'dislike' | null) => {
        const uid = userId ?? (() => {
            try { return JSON.parse(localStorage.getItem('userBasicInfo') || '{}').id; } catch { return null; }
        })();
        if (!uid) {
            if (value) setShowLoginModal(true);
            return;
        }
        try {
            if (value) {
                await fetch('/api/ratings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: uid, tmdbId, mediaType, value }),
                });
                setCurrentRating(value);
            } else {
                await fetch('/api/ratings', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: uid, tmdbId, mediaType }),
                });
                setCurrentRating(null);
            }
        } catch { /* ignore */ }
    };

    // Se temos um override local (clique na Coleção), usar os dados básicos dele
    // enquanto o React Query busca os dados completos em background
    const isLoading = localOverride
        ? false  // com override local, nunca mostra loading — dados básicos já disponíveis
        : movieId
            ? isLoadingById  // tem movieId: só espera a query por ID
            : isLoadingByTmdb; // só tmdbId: espera a query por tmdb

    // Timeout de segurança: se demorar mais de 8s e ainda não tiver dados, mostrar erro
    const [loadingTimedOut, setLoadingTimedOut] = useState(false);
    useEffect(() => {
        if (!isLoading) { setLoadingTimedOut(false); return; }
        const t = setTimeout(() => setLoadingTimedOut(true), 8000);
        return () => clearTimeout(t);
    }, [isLoading, tmdbId, movieId]);

    // Se não estamos carregando mas também não temos filme, algo deu errado
    const hasValidData = movie && Object.keys(movie).length > 0 && movie.tmdb_id;
    const shouldShowError = ((!isLoading && !hasValidData) || loadingTimedOut) && isMounted;

    // Determinar se é série ou filme (precisa estar antes dos useEffects que usam)
    const isSeries = movie && movie.type === 'series';

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
    ].filter((img): img is string => Boolean(img)) : [];

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
                    // console.warn(`Could not fetch extra details for series ${movie.id}:`, error);
                }
            }
        };

        fetchSeriesDetails();
    }, [movie?.id, movie?.type, movie?.tmdb_id, updatedSeriesDetails]);

    // Resetar logos e coleção quando mudar de filme/série
    useEffect(() => {
        // console.log(`%c[WATCH PERF] 🔄 Reset de estados (tmdbId=${tmdbId}) (t=+${(performance.now() - navStartRef.current).toFixed(0)}ms)`, 'color:#fa0');
        setLogos([]);
        setIsLogoReady(false);
        setIsLoadingDetails(true);
        setCollection(null);
        setMovieDetails(null);
        setSeriesDetails(null);
        setSimilarMovies([]);
        setTrailers([]);
        setCreatorSeries([]);
        setCreatorInfo(null);
    }, [movieId, tmdbId]);

    // Query rápida só para logos — resolve antes dos outros detalhes
    // Isso faz o título personalizado aparecer sem esperar todos os fetches
    const { data: quickLogosData } = useQuery({
        queryKey: ['watchLogos', movie?.tmdb_id, movie?.type],
        queryFn: async () => {
            if (!movie?.tmdb_id) return [];
            return TMDBService.fetchMovieLogos(Number(movie.tmdb_id), movie.type === 'series');
        },
        enabled: !!movie?.tmdb_id,
        staleTime: 1000 * 60 * 60, // logos mudam raramente — cache 1h
    });

    // Aplicar logos rápidos assim que chegarem (antes do fetchedDetails completo)
    useEffect(() => {
        if (quickLogosData && quickLogosData.length > 0 && logos.length === 0) {
            setLogos(quickLogosData);
        }
    }, [quickLogosData, logos.length]);

    const { data: fetchedDetails, isLoading: isLoadingDetailsQuery } = useQuery({        queryKey: ['watchDetails', movie?.tmdb_id, movie?.type],
        queryFn: async () => {
            if (!movie?.tmdb_id) return null;
            const tmdbIdNum = Number(movie.tmdb_id);
            const isSeriesType = movie.type === 'series';

            if (isSeriesType) {
                // ── FASE 1: crítico (logos + detalhes básicos) em paralelo
                const [seriesData, logosData] = await Promise.all([
                    TMDBService.fetchSeriesDetails(tmdbIdNum),
                    TMDBService.fetchMovieLogos(tmdbIdNum, true),
                ]);

                // ── FASE 2: secundário em paralelo (não bloqueia fase 1)
                const [similar, videos, keywordsData, fullDetails] = await Promise.all([
                    TMDBService.fetchSimilar(tmdbIdNum, true),
                    TMDBService.fetchMovieVideos(tmdbIdNum, true),
                    TMDBService.fetchMovieKeywords(tmdbIdNum, true),
                    (TMDBService as any).fetchSeriesFullDetails ? (TMDBService as any).fetchSeriesFullDetails(tmdbIdNum) : Promise.resolve(null),
                ]);

                let seasonTargetSeasonNumber = urlSeason ? Number(urlSeason) : 0;
                let seasonData = null;
                if (seriesData?.seasons && seriesData.seasons.length > 0) {
                    const targetSeason = seasonTargetSeasonNumber
                        ? seriesData.seasons.find((s: any) => s.season_number === seasonTargetSeasonNumber) || seriesData.seasons[0]
                        : seriesData.seasons.find((s: any) => s.season_number === 1) || seriesData.seasons[0];
                    if (targetSeason) {
                        seasonData = await TMDBService.fetchSeasonDetails(tmdbIdNum, targetSeason.season_number);
                        seasonData = { ...seasonData, season_number: targetSeason.season_number };
                    }
                }

                let creatorSeriesData: any[] = [];
                let creatorInfoData = null;
                if (fullDetails?.created_by && fullDetails.created_by.length > 0) {
                    creatorInfoData = fullDetails.created_by[0];
                    if ((TMDBService as any).fetchSeriesByCreator) {
                        const cs = await (TMDBService as any).fetchSeriesByCreator(creatorInfoData.id, tmdbIdNum);
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
                // ── FASE 1: crítico (logos + detalhes básicos) em paralelo
                const [details, logosData] = await Promise.all([
                    TMDBService.fetchMovieDetails(tmdbIdNum),
                    TMDBService.fetchMovieLogos(tmdbIdNum, false),
                ]);

                // ── FASE 2: secundário em paralelo
                const [similar, videos, keywordsData] = await Promise.all([
                    TMDBService.fetchSimilar(tmdbIdNum, false),
                    TMDBService.fetchMovieVideos(tmdbIdNum, false),
                    TMDBService.fetchMovieKeywords(tmdbIdNum, false),
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

        // Aplicar logos imediatamente (aparecem antes do resto)
        if (fetchedDetails.logosData) setLogos(fetchedDetails.logosData);

        if (fetchedDetails.isSeries) {
            if (fetchedDetails.seriesData) setSeriesDetails(fetchedDetails.seriesData);
            if (fetchedDetails.seasonData) {
                const { season_number, ...seasonData } = fetchedDetails.seasonData as any;
                setSeasonDetails(seasonData);
                const targetSeason = urlSeason ? Number(urlSeason) : (savedHistory?.seasonNumber || season_number);
                const targetEpisode = urlEpisode ? Number(urlEpisode) : (savedHistory?.episodeNumber || 1);
                setSelectedSeason(targetSeason);
                setSelectedEpisode(targetEpisode);
            }
            if (fetchedDetails.creatorInfoData) setCreatorInfo(fetchedDetails.creatorInfoData);
            if (fetchedDetails.creatorSeriesData) setCreatorSeries(fetchedDetails.creatorSeriesData);
            setSimilarMovies(fetchedDetails.similar);
            setTrailers(fetchedDetails.videos);
            setKeywords(fetchedDetails.keywordsData);
        } else {
            if (fetchedDetails.details) setMovieDetails(fetchedDetails.details);
            if (fetchedDetails.collectionData) setCollection(fetchedDetails.collectionData);
            setSimilarMovies(fetchedDetails.similar);
            setTrailers(fetchedDetails.videos);
            setKeywords(fetchedDetails.keywordsData);
        }
        setIsLoadingDetails(false);
    }, [fetchedDetails]);

    // Efeito para pré-carregar a imagem do logo
    useEffect(() => {
        // Garantir que só roda no cliente
        if (!isMounted) return;
        
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
    }, [movie?.tmdb_id, movie, logos, getLogosForMovie, isLoadingDetails, isLogoReady, isMounted]);

    // Efeito para buscar e rotacionar backdrops
    useEffect(() => {
        // Resetar backdrops imediatamente quando o filme mudar
        setBackdrops([]);
        setCurrentBackdropIndex(0);

        if (!movie?.tmdb_id) return;

        const fetchBackdrops = async () => {
            const images = await TMDBService.fetchMovieImages(Number(movie.tmdb_id), movie.type === 'series');
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
    const fetchSeasonDetails = async (seasonNumber: number, targetEpisode?: number) => {
        // Verificar se temos um filme válido
        if (movie && Object.keys(movie).length > 0 && movie.tmdb_id) {
            setIsLoadingDetails(true);
            try {
                const seasonData = await TMDBService.fetchSeasonDetails(movie.tmdb_id, seasonNumber);
                setSeasonDetails(seasonData);
                setSelectedSeason(seasonNumber);
                setSelectedEpisode(targetEpisode ?? 1);
            } finally {
                setIsLoadingDetails(false);
            }
        }
    };

    useEffect(() => {
        if (!savedHistory || !movie?.tmdb_id || movie.type !== 'series') return;
        if (urlSeason || urlEpisode) return; // URL params take precedence
        if (savedHistory.seasonNumber > 0 && savedHistory.episodeNumber > 0) {
            if (selectedSeason !== savedHistory.seasonNumber) {
                fetchSeasonDetails(savedHistory.seasonNumber, savedHistory.episodeNumber);
            } else {
                setSelectedEpisode(savedHistory.episodeNumber);
            }
        }
    }, [savedHistory, movie?.tmdb_id, movie?.type, urlSeason, urlEpisode]);

    const addToListMutation = useMutation({
        mutationFn: () =>
            fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    tmdbId: movie?.tmdb_id,
                    mediaType: movie?.type,
                    title: movie?.title,
                    posterUrl: movie?.poster_url,
                    backdropUrl: movie?.backdrop_url,
                }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
            toast.success('Adicionado à sua lista!');
        },
    });

    const removeFromListMutation = useMutation({
        mutationFn: () =>
            fetch('/api/watchlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    tmdbId: movie?.tmdb_id,
                    mediaType: movie?.type,
                }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
            toast.success('Removido da sua lista!');
        },
    });

    const handleAddToList = () => {
        if (!movie || Object.keys(movie).length === 0) return;
        if (!userId) {
            setShowLoginModal(true);
            return;
        }
        if (isInWatchlist) {
            removeFromListMutation.mutate();
        } else {
            addToListMutation.mutate();
        }
    };

    const handleLikeAction = () => {
        if (currentRating) {
            handleRatingAction(Number(movie?.tmdb_id), movie?.type || 'movie', null);
        } else {
            setShowRatingTooltip(!showRatingTooltip);
        }
    };

    const handleSimilarMovieClick = (similarMovie: Movie) => {
        // Verificar se temos um filme válido
        if (similarMovie && Object.keys(similarMovie).length > 0) {
            // Navegação direta (fast-path via localOverride se já em /watch)
            navigateToWatch(similarMovie);
        }
    };

    // Verificar se temos um filme válido antes de renderizar
    // Removida a verificação de isLogoReady para evitar que a página fique travada no loading
    if (!isMounted || isLoading || !movie || Object.keys(movie).length === 0) {
        // console.log(`%c[WATCH PERF] ⏳ Mostrando WatchLoading — isMounted=${isMounted} isLoading=${isLoading} movie=${!!movie} (t=+${(performance.now() - navStartRef.current).toFixed(0)}ms)`, 'color:#f80;font-weight:bold');
        return <WatchLoading />;
    }

    // Se não está carregando mas também não tem dados válidos, mostrar erro
    if (shouldShowError) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <h1 className="text-white text-2xl font-bold mb-4">Conteúdo não encontrado</h1>
                    <p className="text-gray-400 mb-6">Não foi possível carregar as informações deste título.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-white text-black px-6 py-2 rounded font-semibold hover:bg-gray-200 transition"
                    >
                        Voltar para Home
                    </button>
                </div>
            </div>
        );
    }

    // Dados derivados de série ou filme
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
                                // console.error('Erro ao carregar vídeo de backdrop:', animatedBackdropUrl, e);
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
                    <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-[#121212]/20 to-transparent z-[1]" />
                    <div className="absolute inset-0 bg-linear-to-r from-[#121212]/60 via-transparent to-transparent z-[2]" />
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
                        bg-[#2a2a2a]/60 hover:bg-[#444444] border-2 border-[#ffffff]/70
                        rounded-full transition-all duration-200 items-center justify-center w-12 h-12 sm:w-10 sm:h-10 md:w-12 md:h-12
                        opacity-40 hover:opacity-100 focus:outline-none focus:ring-0"
                    aria-label={isBackdropMuted ? "Ativar som" : "Desativar som"}
                >
                    {isBackdropMuted ? (
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M11 4.00003C11 3.59557 10.7564 3.23093 10.3827 3.07615C10.009 2.92137 9.57889 3.00692 9.29289 3.29292L4.58579 8.00003H1C0.447715 8.00003 0 8.44774 0 9.00003V15C0 15.5523 0.447715 16 1 16H4.58579L9.29289 20.7071C9.57889 20.9931 10.009 21.0787 10.3827 20.9239C10.7564 20.7691 11 20.4045 11 20V4.00003ZM5.70711 9.70714L9 6.41424V17.5858L5.70711 14.2929L5.41421 14H5H2V10H5H5.41421L5.70711 9.70714ZM15.2929 9.70714L17.5858 12L15.2929 14.2929L16.7071 15.7071L19 13.4142L21.2929 15.7071L22.7071 14.2929L20.4142 12L22.7071 9.70714L21.2929 8.29292L19 10.5858L16.7071 8.29292L15.2929 9.70714Z" fill="currentColor"></path>
                        </svg>
                    ) : (
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                <div className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-8 lg:px-12 pb-0 sm:pb-2 lg:pb-4">
                    <div className="max-w-4xl">

                        {/* Title - Otimizado */}
                        <div className="mb-2">
                            <MovieTitle
                                title={movie.title}
                                logos={logos}
                                isLoading={isLoadingDetails && logos.length === 0}
                            />
                        </div>

                        {/* BADGE TOP 10 DESATIVADO TEMPORARIAMENTE
                        {urlRank && (
                            <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-500 mb-4">
                                <svg width="245" height="30" viewBox="0 0 245 30" fill="none" aria-label={`#${urlRank} em ${movie.type === 'series' ? 'Séries' : 'Filmes'} hoje`}>
                                    <rect y="1.0957" width="27.8086" height="27.8086" rx="3.47608" fill="#F50723"/>
                                    <path d="M7.72649 13.7028H6.16834V8.3974H4.05576V7.04955H9.83908V8.3974H7.72649V13.7028Z" fill="white"/>
                                    <path d="M13.27 13.8557C12.7729 13.8557 12.3141 13.7697 11.903 13.5976C11.4824 13.4255 11.1192 13.1866 10.8228 12.8711C10.5169 12.5557 10.278 12.1924 10.1155 11.7622C9.94339 11.3416 9.85736 10.8828 9.85736 10.3762C9.85736 9.86951 9.94339 9.41067 10.1155 8.98051C10.278 8.5599 10.5169 8.19665 10.8228 7.8812C11.1192 7.56574 11.4824 7.32676 11.903 7.1547C12.3141 6.98263 12.7729 6.8966 13.27 6.8966C13.7766 6.8966 14.2355 6.98263 14.6561 7.1547C15.0671 7.32676 15.4304 7.56574 15.7363 7.8812C16.0422 8.19665 16.2812 8.5599 16.4532 8.98051C16.6157 9.41067 16.7018 9.86951 16.7018 10.3762C16.7018 10.8828 16.6157 11.3416 16.4532 11.7622C16.2812 12.1924 16.0422 12.5557 15.7363 12.8711C15.4304 13.1866 15.0671 13.4255 14.6561 13.5976C14.2355 13.7697 13.7766 13.8557 13.27 13.8557ZM13.27 12.4792C13.6333 12.4792 13.9583 12.3931 14.2355 12.2115C14.5127 12.0395 14.723 11.7909 14.8855 11.4755C15.048 11.16 15.1245 10.7968 15.1245 10.3762C15.1245 9.95555 15.048 9.58274 14.8855 9.26728C14.723 8.95183 14.5127 8.71285 14.2355 8.53123C13.9583 8.35916 13.6333 8.27313 13.27 8.27313C12.9163 8.27313 12.6009 8.35916 12.3236 8.53123C12.0464 8.71285 11.8266 8.95183 11.6736 9.26728C11.5111 9.58274 11.4346 9.95555 11.4346 10.3762C11.4346 10.7968 11.5111 11.16 11.6736 11.4755C11.8266 11.7909 12.0464 12.0395 12.3236 12.2115C12.6009 12.3931 12.9163 12.4792 13.27 12.4792Z" fill="white"/>
                                    <path d="M17.3002 13.7028V7.04955H20.0533C20.5982 7.04955 21.0761 7.14514 21.4681 7.33632C21.86 7.52751 22.1659 7.79517 22.3762 8.1393C22.5865 8.48343 22.6916 8.88492 22.6916 9.34376C22.6916 9.8026 22.5865 10.2041 22.3762 10.5482C22.1659 10.9019 21.86 11.1696 21.4681 11.3608C21.0761 11.5519 20.5982 11.6475 20.0533 11.6475H18.8584V13.7028H17.3002ZM18.8584 10.3284H19.8239C20.2732 10.3284 20.5982 10.2423 20.8085 10.0703C21.0092 9.90775 21.1144 9.65921 21.1144 9.34376C21.1144 9.0283 21.0092 8.78932 20.8085 8.61726C20.5982 8.45475 20.2732 8.36872 19.8239 8.36872H18.8584V10.3284Z" fill="white"/>
                                    <text x="9" y="24" fill="white" fontSize="13" fontWeight="900" fontFamily="'Netflix Sans'">{urlRank}</text>
                                    <text x="35" y="21" fill="white" fontSize="17" fontWeight="400" fontFamily="'Netflix Sans'">#{urlRank} em {movie.type === 'series' ? 'Séries' : 'Filmes'} hoje</text>
                                </svg>
                            </div>
                        )}
                        */}

                        {/* Tagline */}
                        {(isSeries ? seriesDetails?.tagline : movieDetails?.tagline) && (
                            <p className="text-gray-400 text-sm sm:text-base italic mt-2 mb-4">
                                "{(isSeries ? seriesDetails?.tagline : movieDetails?.tagline)}"
                            </p>
                        )}

                        {!seriesDetails?.tagline && !movieDetails?.tagline && <div className="mb-4" />}

                        {/* Action Buttons - Netflix Style */}
                        <div
                            className="flex flex-wrap items-center gap-2 mb-6"
                            role="group"
                            aria-label="Ações do filme"
                        >
                            {/* Texto indicativo para RAVE - DESATIVADO
                            <p className="w-full text-white/80 text-xs sm:text-sm font-medium italic mb-2">
                                AGUARDE NESSA PÁGINA, PARA ASSISTIR NO APLICATIVO RAVE
                            </p>
                            */}
                            <button
                                onClick={async () => {
                                    if (userId && movie?.tmdb_id) {
                                        try {
                                            await fetch('/api/watch-history', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    userId: String(userId),
                                                    tmdbId: String(movie.tmdb_id),
                                                    mediaType: movie.type,
                                                    seasonNumber: isSeries ? selectedSeason : undefined,
                                                    episodeNumber: isSeries ? selectedEpisode : undefined,
                                                    totalSeasons: isSeries ? seriesDetails?.number_of_seasons : undefined,
                                                    totalEpisodes: isSeries ? seriesDetails?.number_of_episodes : undefined,
                                                    seasonEpisodes: isSeries ? seriesDetails?.seasons?.find(s => s.season_number === selectedSeason)?.episode_count : undefined,
                                                    title: movie.title,
                                                    posterUrl: movie.poster_url,
                                                    backdropUrl: movie.backdrop_url,
                                                    progressPercent: 0,
                                                }),
                                            });
                                        } catch (e) { /* silent */ }
                                    }
                                    const embedUrl = isSeries
                                        ? `https://megaembed.com/embed/${movie.tmdb_id}/${selectedSeason}/${selectedEpisode}`
                                        : `https://megaembed.com/embed/${movie.tmdb_id}`;
                                    window.location.href = embedUrl;
                                }}
                                className="bg-white hover:bg-gray-200 text-black font-bold py-3 sm:py-2 md:py-3 px-8 md:px-10
                                    rounded transition-all duration-200 flex items-center justify-center text-base sm:text-base md:text-lg
                                    focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                                aria-label={`Assistir ${movie.title}`}
                            >
                                <Play className="w-6 h-6 sm:w-6 sm:h-6 mr-2 fill-current" aria-hidden="true" />
                                Assistir
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAddToList}
                                    className={`bg-[#2a2a2a]/60 hover:bg-[#444444] border-2 border-[#ffffff]/70
                                        rounded-full transition-all duration-200 flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 md:w-12 md:h-12
                                        focus:outline-none focus:ring-0 text-white`}
                                    aria-label={isInWatchlist ? 'Remover da lista' : 'Adicionar à minha lista'}
                                >
                                    {isInWatchlist ? (
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        </svg>
                                    ) : (
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M11 2V11H2V13H11V22H13V13H22V11H13V2H11Z" fill="currentColor" />
                                        </svg>
                                    )}
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={handleLikeAction}
                                        className={`bg-[#2a2a2a]/60 hover:bg-[#444444] border-2 border-[#ffffff]/70
                                            rounded-full transition-all duration-200 flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 md:w-12 md:h-12
                                            focus:outline-none focus:ring-0 text-white`}
                                        aria-label={currentRating ? 'Remover avaliação' : 'Avaliar este título'}
                                    >
                                        {currentRating === 'love' || currentRating === 'like' ? (
                                            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10.696 8.7732C10.8947 8.45534 11 8.08804 11 7.7132V4H11.8377C12.7152 4 13.4285 4.55292 13.6073 5.31126C13.8233 6.22758 14 7.22716 14 8C14 8.58478 13.8976 9.1919 13.7536 9.75039L13.4315 11H14.7219H17.5C18.3284 11 19 11.6716 19 12.5C19 12.5929 18.9917 12.6831 18.976 12.7699L18.8955 13.2149L19.1764 13.5692C19.3794 13.8252 19.5 14.1471 19.5 14.5C19.5 14.8529 19.3794 15.1748 19.1764 15.4308L18.8955 15.7851L18.976 16.2301C18.9917 16.317 19 16.4071 19 16.5C19 16.9901 18.766 17.4253 18.3994 17.7006L18 18.0006L18 18.5001C17.9999 19.3285 17.3284 20 16.5 20H14H13H12.6228C11.6554 20 10.6944 19.844 9.77673 19.5382L8.28366 19.0405C7.22457 18.6874 6.11617 18.5051 5 18.5001V13.7543L7.03558 13.1727C7.74927 12.9688 8.36203 12.5076 8.75542 11.8781L10.696 8.7732Z" />
                                            </svg>
                                        ) : currentRating === 'dislike' ? (
                                            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleY(-1)' }}>
                                                <path d="M10.696 8.7732C10.8947 8.45534 11 8.08804 11 7.7132V4H11.8377C12.7152 4 13.4285 4.55292 13.6073 5.31126C13.8233 6.22758 14 7.22716 14 8C14 8.58478 13.8976 9.1919 13.7536 9.75039L13.4315 11H14.7219H17.5C18.3284 11 19 11.6716 19 12.5C19 12.5929 18.9917 12.6831 18.976 12.7699L18.8955 13.2149L19.1764 13.5692C19.3794 13.8252 19.5 14.1471 19.5 14.5C19.5 14.8529 19.3794 15.1748 19.1764 15.4308L18.8955 15.7851L18.976 16.2301C18.9917 16.317 19 16.4071 19 16.5C19 16.9901 18.766 17.4253 18.3994 17.7006L18 18.0006L18 18.5001C17.9999 19.3285 17.3284 20 16.5 20H14H13H12.6228C11.6554 20 10.6944 19.844 9.77673 19.5382L8.28366 19.0405C7.22457 18.6874 6.11617 18.5051 5 18.5001V13.7543L7.03558 13.1727C7.74927 12.9688 8.36203 12.5076 8.75542 11.8781L10.696 8.7732Z" />
                                            </svg>
                                        ) : (
                                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M10.696 8.7732C10.8947 8.45534 11 8.08804 11 7.7132V4H11.8377C12.7152 4 13.4285 4.55292 13.6073 5.31126C13.8233 6.22758 14 7.22716 14 8C14 8.58478 13.8976 9.1919 13.7536 9.75039L13.4315 11H14.7219H17.5C18.3284 11 19 11.6716 19 12.5C19 12.5929 18.9917 12.6831 18.976 12.7699L18.8955 13.2149L19.1764 13.5692C19.3794 13.8252 19.5 14.1471 19.5 14.5C19.5 14.8529 19.3794 15.1748 19.1764 15.4308L18.8955 15.7851L18.976 16.2301C18.9917 16.317 19 16.4071 19 16.5C19 16.9901 18.766 17.4253 18.3994 17.7006L18 18.0006L18 18.5001C17.9999 19.3285 17.3284 20 16.5 20H14H13H12.6228C11.6554 20 10.6944 19.844 9.77673 19.5382L8.28366 19.0405C7.22457 18.6874 6.11617 18.5051 5 18.5001V13.7543L7.03558 13.1727C7.74927 12.9688 8.36203 12.5076 8.75542 11.8781L10.696 8.7732ZM10.5 2C9.67157 2 9 2.67157 9 3.5V7.7132L7.05942 10.8181C6.92829 11.0279 6.72404 11.1817 6.48614 11.2497L4.45056 11.8313C3.59195 12.0766 3 12.8613 3 13.7543V18.5468C3 19.6255 3.87447 20.5 4.95319 20.5C5.87021 20.5 6.78124 20.6478 7.65121 20.9378L9.14427 21.4355C10.2659 21.8094 11.4405 22 12.6228 22H13H14H16.5C18.2692 22 19.7319 20.6873 19.967 18.9827C20.6039 18.3496 21 17.4709 21 16.5C21 16.4369 20.9983 16.3742 20.995 16.3118C21.3153 15.783 21.5 15.1622 21.5 14.5C21.5 13.8378 21.3153 13.217 20.995 12.6883C20.9983 12.6258 21 12.5631 21 12.5C21 10.567 19.433 9 17.5 9H15.9338C15.9752 8.6755 16 8.33974 16 8C16 6.98865 15.7788 5.80611 15.5539 4.85235C15.1401 3.09702 13.5428 2 11.8377 2H10.5Z" fill="currentColor" />
                                            </svg>
                                        )}
                                    </button>
                                    {showRatingTooltip && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50">
                                            <RatingTooltip
                                                currentRating={currentRating}
                                                onRate={(value) => {
                                                    handleRatingAction(Number(movie?.tmdb_id), movie?.type || 'movie', value);
                                                    setShowRatingTooltip(false);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>


                        </div>


                        {/* Movie/Series Info */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-base sm:text-base md:text-lg">
                            {watchMatch != null
                                ? <span className="text-[#46d369] font-bold text-base sm:text-base md:text-lg">{watchMatch}% Match</span>
                                : movie?.score != null
                                ? <span className="text-[#46d369] font-bold text-base sm:text-base md:text-lg">{Math.round(Number(movie.score) * 10)}% Match</span>
                                : null}
                            <span className="text-white font-bold text-base sm:text-base md:text-lg">{displayYear}</span>

                            {/* Age Rating Badge - Estilo Netflix */}
                            {(isSeries ? seriesDetails?.ageRating : movieDetails?.ageRating) && (
                                <div className="flex items-center justify-center bg-[#d7262d] rounded-[3px] min-w-[30px] sm:min-w-[32px] h-[30px] sm:h-[32px] px-1 shadow-sm overflow-hidden">
                                    <span
                                        className="text-white block"
                                        style={{
                                            fontFamily: '"Netflix Sans"',
                                            fontSize: 'clamp(14px, 3.5vw, 16px)',
                                            fontWeight: 900,
                                            lineHeight: 'normal',
                                            letterSpacing: '-0.5px',
                                            transform: 'translateY(-1px)'
                                        }}
                                    >
                                        {(isSeries ? (seriesDetails?.ageRating === '+18' ? '18' : seriesDetails?.ageRating) : (movieDetails?.ageRating === '+18' ? '18' : movieDetails?.ageRating))}
                                    </span>
                                </div>
                            )}

                            <span className="text-white font-bold text-base sm:text-base md:text-lg">{displayDuration}</span>
                            {(() => {
                                const genres = (isSeries ? seriesDetails?.genres : movieDetails?.genres) || movie.genre || [];
                                if (genres.length >= 2) {
                                    return (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                                            <span className="text-gray-400 text-base sm:text-base md:text-lg">{genres[0]}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                                            <span className="text-gray-400 text-base sm:text-base md:text-lg">{genres[1]}</span>
                                        </>
                                    );
                                } else if (genres.length === 1) {
                                    return (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                                            <span className="text-gray-400 text-base sm:text-base md:text-lg">{genres[0]}</span>
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
                        <h2 className="text-white text-xl md:text-2xl font-semibold mb-3">Descrição</h2>
                        <p className="text-gray-200 text-base sm:text-base md:text-lg leading-relaxed max-w-4xl">
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


                        {/* Quick Info - MOVIDO PARA DEPOIS DOS EPISÓDIOS EM SÉRIES */}
                        {!isSeries && (
                            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm md:text-base text-gray-500">

                                {movieDetails?.director && (
                                    <span>Direção: <span className="text-gray-300">{movieDetails.director}</span></span>
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
                                                    <div key={star} className="relative w-4 h-4 md:w-5 md:h-5 mr-0.5">
                                                        <svg
                                                            className="w-full h-full"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <defs>
                                                                <linearGradient id={`starGradient-${star}-${movie.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                                    <stop offset={`${fillPercentage}%`} stopColor="#facc15" />
                                                                    <stop offset={`${fillPercentage}%`} stopColor="#4b5563" />
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
                                        <span className="text-sm md:text-base font-bold text-white">{((movie.score ?? 0) / 2).toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        )}


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
                        <section className="py-8 border-t border-white/10">

                            {/* Cabeçalho da seção - Desktop: lado a lado, Mobile: empilhado */}
                            <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                
                                {/* Lado esquerdo: Título e contador de episódios */}
                                <div>
                                    <h2 className="text-white text-xl md:text-2xl font-semibold mb-2">Episódios</h2>
                                    {seriesDetails && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <span>{seriesDetails.number_of_seasons} Temporadas</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                                            <span>{seriesDetails.number_of_episodes} Episódios</span>
                                        </div>
                                    )}
                                </div>

                                {/* Lado direito: Seletor de temporadas */}
                                <div className="flex items-center gap-3">
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
                            </div>

                            {/* Carrossel de episódios */}
                            <div className="relative group/episode -mx-4 sm:-mx-8 lg:-mx-12">
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
                                    className="flex gap-2.5 overflow-x-auto py-4 scrollbar-hide px-4 sm:px-8 lg:px-12"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {isLoadingDetails ? (
                                        <div className="flex gap-2.5 py-2">
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
                                                    className={`shrink-0 w-64 md:w-72 bg-[#1f1f1f] rounded overflow-hidden hover:bg-[#2a2a2a] transition-colors duration-200 cursor-pointer
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
                                                        <h3 className="text-white font-medium text-xs sm:text-sm mb-1">
                                                            {episode.episode_number}. {episode.name}
                                                        </h3>
                                                        <p className="text-gray-400 text-xs leading-relaxed">
                                                            {episode.overview || 'Sem descrição disponível.'}
                                                        </p>
                                                        {episode.air_date && (
                                                            <p className="text-gray-500 text-xs mt-2">
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

                    {/* Quick Info para SÉRIES - aparece DEPOIS dos episódios */}
                    {isSeries && (
                        <section className="py-8 border-b border-white/10">
                            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4">Detalhes</h2>
                            <div className="flex flex-col lg:flex-col gap-3 text-sm text-gray-500">

                                {seriesDetails?.director && (
                                    <div className="flex items-center gap-2">
                                        <span>Criação:</span>
                                        <span className="text-gray-300">{seriesDetails.director}</span>
                                    </div>
                                )}

                                {/* Star Rating based on Score */}
                                {(movie.score ?? 0) > 0 && (
                                    <div className="flex items-center gap-2" title={`Avaliação: ${movie.score}/10`}>
                                        <span>Avaliação:</span>
                                        <div className="flex relative">
                                            {[1, 2, 3, 4, 5].map((star) => {
                                                const ratingValue = (movie.score ?? 0) / 2;
                                                const fillPercentage = Math.min(Math.max((ratingValue - (star - 1)) * 100, 0), 100);

                                                return (
                                                    <div key={star} className="relative w-4 h-4 mr-0.5">
                                                        <svg className="w-full h-full" viewBox="0 0 24 24">
                                                            <defs>
                                                                <linearGradient id={`starGradient-series-${star}-${movie.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                                    <stop offset={`${fillPercentage}%`} stopColor="#facc15" />
                                                                    <stop offset={`${fillPercentage}%`} stopColor="#4b5563" />
                                                                </linearGradient>
                                                            </defs>
                                                            <path
                                                                fill={`url(#starGradient-series-${star}-${movie.id})`}
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
                                {seriesDetails && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span>Data de lançamento:</span>
                                            <span className="text-gray-300">{seriesDetails.first_air_date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>Última data:</span>
                                            <span className="text-gray-300">{seriesDetails.last_air_date}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    )}

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
                            <h2 className="text-white text-lg md:text-xl font-semibold mb-1">{collection.name}</h2>
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
                                                        onClick={() => {
                                                            if (!isCurrentMovie) {
                                                                const clickTime = performance.now();
                                                                // console.log(`%c[WATCH PERF] 🖱️ CLIQUE no poster da coleção: "${part.title}" (tmdb_id=${part.id})`, 'color:#f0f;font-weight:bold;font-size:13px');

                                                                // Troca o filme LOCALMENTE — zero round-trip ao servidor
                                                                setLocalOverride({
                                                                    tmdbId: String(part.id),
                                                                    mediaType: 'movie',
                                                                    title: part.title,
                                                                    poster_url: part.poster_path ? `https://image.tmdb.org/t/p/w500${part.poster_path}` : '',
                                                                    backdrop_url: '',
                                                                    year: part.release_date ? new Date(part.release_date).getFullYear() : new Date().getFullYear(),
                                                                });

                                                                // Pre-popular o cache React Query com dados básicos para renderização imediata
                                                                const partData = {
                                                                    id: `tmdb-${part.id}`,
                                                                    title: part.title,
                                                                    type: 'movie' as const,
                                                                    year: part.release_date ? new Date(part.release_date).getFullYear() : new Date().getFullYear(),
                                                                    rating: 'NR',
                                                                    duration: '',
                                                                    genre: [],
                                                                    synopsis: '',
                                                                    cast: [],
                                                                    director: '',
                                                                    poster_url: part.poster_path ? `https://image.tmdb.org/t/p/w500${part.poster_path}` : '',
                                                                    backdrop_url: '',
                                                                    score: 0,
                                                                    tmdb_id: part.id,
                                                                    category: 'trending' as const,
                                                                };
                                                                queryClient.setQueryData(['movie', 'tmdb', String(part.id), 'movie'], partData);
                                                                // Invalidar para forçar busca dos dados reais (score, duration, etc.) em background
                                                                queryClient.invalidateQueries({ queryKey: ['movie', 'tmdb', String(part.id), 'movie'] });

                                                                // Atualizar URL sem navegar (apenas para bookmarking/compartilhamento)
                                                                window.history.replaceState(null, '', `/watch?ref=${part.id}`);

                                                                // console.log(`%c[WATCH PERF] ✅ override local setado (t=+${(performance.now() - clickTime).toFixed(1)}ms desde clique)`, 'color:#f0f');
                                                            }
                                                        }}
                                                        onMouseEnter={() => {
                                                            if (!isCurrentMovie) {
                                                                // Prefetch da rota + pré-carregar dados do filme para ter score/duration prontos no clique
                                                                router.prefetch(`/watch?ref=${part.id}`);
                                                                // Pre-aquecer o cache React Query com dados reais no hover
                                                                if (!queryClient.getQueryData(['movie', 'tmdb', String(part.id), 'movie'])) {
                                                                    fetch(`/api/content/movie/${part.id}?language=pt-BR`)
                                                                        .then(r => r.json())
                                                                        .then(data => {
                                                                            if (data?.id) {
                                                                                queryClient.setQueryData(['movie', 'tmdb', String(part.id), 'movie'], {
                                                                                    id: `tmdb-${part.id}`,
                                                                                    title: data.title || part.title,
                                                                                    type: 'movie' as const,
                                                                                    year: data.release_date ? new Date(data.release_date).getFullYear() : new Date().getFullYear(),
                                                                                    rating: 'NR',
                                                                                    duration: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : '',
                                                                                    genre: data.genres?.map((g: any) => g.name) || [],
                                                                                    synopsis: data.overview || '',
                                                                                    cast: [],
                                                                                    director: '',
                                                                                    poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : part.poster_path ? `https://image.tmdb.org/t/p/w500${part.poster_path}` : '',
                                                                                    backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
                                                                                    score: data.vote_average ? parseFloat(data.vote_average.toFixed(1)) : 0,
                                                                                    tmdb_id: part.id,
                                                                                    category: 'trending' as const,
                                                                                });
                                                                            }
                                                                        })
                                                                        .catch(() => {});
                                                                }
                                                            }
                                                        }}
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
                                    <h2 className="text-white text-lg md:text-xl font-semibold mb-1">Mais de {creatorInfo.name}</h2>
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
                            className="py-8 border-t border-b border-white/10"
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
                        <section className="py-8" aria-label="Títulos semelhantes a este filme">
                            <h2 className="text-white text-xl md:text-2xl font-bold tracking-tight px-2 mb-3">Títulos Semelhantes</h2>
                            <div className="relative -mx-4 sm:-mx-8 lg:-mx-12">
                                <Carousel
                                    title="Títulos Semelhantes"
                                    showTitle={false}
                                    movies={similarMovies}
                                    onMovieClick={handleSimilarMovieClick}
                                />
                            </div>
                        </section>
                    )}

                </div>
            </div >
            {/* Movie Modal */}
            < MovieModal
                movie={selectedModalMovie}
                isOpen={!!selectedModalMovie}
                onClose={() => setSelectedModalMovie(null)}
                onWatch={(movie: Movie) => {
                    setSelectedModalMovie(null);
                    navigateToWatch(movie);
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


