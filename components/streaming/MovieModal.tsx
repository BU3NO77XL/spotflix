'use client';

import { useEffect, useState, useMemo, Component, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Plus, Volume2, VolumeX, Check, Star } from 'lucide-react';
import { Movie } from '@/types/movie';
import { cn } from '@/lib/utils';
import { calcMatch } from '@/lib/match';
import { overlayFade, imageReveal, easeOutQuint, movieModalContent, fadeIn, slideUpFade, staggerContainer } from '@/lib/motion';
import { TMDBService } from './TMDBIntegration';
import RatingTooltip from '@/components/ui/RatingTooltip';
import NetflixBadge from '@/components/streaming/NetflixBadge';

type Rating = 'love' | 'like' | 'dislike';

class ModalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
    constructor(props: {children: ReactNode}) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error: any) {
        console.error('[MODAL-ERROR]', error);
        return { hasError: true };
    }
    componentDidCatch(error: any, info: any) {
        console.error('[MODAL-ERROR-DETAIL]', error, info);
    }
    render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

interface MovieModalProps {
    movie: Movie | null;
    isOpen: boolean;
    onClose: () => void;
    onWatch: (movie: Movie) => void;
    onAddToList: (movie: Movie) => void;
    isInWatchlist?: boolean;
    onRemoveFromList?: (movie: Movie) => void;
}

export default function MovieModal({ movie, isOpen, onClose, onWatch, onAddToList, isInWatchlist, onRemoveFromList }: MovieModalProps) {
    const [cast, setCast] = useState<any[]>([]);
    const [similar, setSimilar] = useState<Movie[]>([]);
    const [similarLoading, setSimilarLoading] = useState(true);
    const [similarImagesLoaded, setSimilarImagesLoaded] = useState<Set<number>>(new Set());
    const [trailers, setTrailers] = useState<{ key: string; name: string; type: string; site: string; official: boolean; size: number }[]>([]);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [isMuted, setIsMuted] = useState(true);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoLoading, setLogoLoading] = useState(true);
    const [isOnNetflix, setIsOnNetflix] = useState(false);
    const [detailGenres, setDetailGenres] = useState<string[]>([]);
    const [currentRating, setCurrentRating] = useState<Rating | null>(null);
    const [showRatingTooltip, setShowRatingTooltip] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('userBasicInfo');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                setUserId(data.id);
            } catch { /* ignore */ }
        }
    }, []);

    const handleRatingAction = async (tmdbId: number, mediaType: string, value: Rating | null) => {
        const uid = userId ?? (() => {
            try { return JSON.parse(localStorage.getItem('userBasicInfo') || '{}').id; } catch { return null; }
        })();
        if (!uid) {
            onClose();
            window.dispatchEvent(new Event('requireLogin'));
            return;
        }
        setCurrentRating(value);
        try {
            if (value) {
                await fetch('/api/ratings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: uid, tmdbId, mediaType, value }),
                });
            } else {
                await fetch('/api/ratings', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: uid, tmdbId, mediaType }),
                });
            }
        } catch (e) {
            console.error('[RATING-ERROR]', e);
        }
    };

    const [details, setDetails] = useState<{
        overview?: string;
        runtime?: number;
        number_of_seasons?: number;
        number_of_episodes?: number;
        ageRating?: string;
        tagline?: string;
        first_air_date?: string;
        last_air_date?: string;
        director?: string;
        created_by?: string;
        score?: number;
    } | null>(null);

    const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
    const [totalRatingsCount, setTotalRatingsCount] = useState(0);
    const [userDataLoaded, setUserDataLoaded] = useState(false);

    const matchReady = !!details?.score && userDataLoaded;

    const matchPercentage = useMemo(() => {
        if (!matchReady) return null;
        return calcMatch(
            details?.score as number,
            detailGenres.length > 0 ? detailGenres : (movie?.genre || []),
            currentRating,
            favoriteGenres,
        );
    }, [matchReady, details?.score, detailGenres, movie?.genre, currentRating, favoriteGenres]);

    const handleAddToListGuarded = (movie: Movie) => {
        const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('sb-session');
        if (!isAuthenticated) {
            onClose();
            window.dispatchEvent(new Event('requireLogin'));
            return;
        }
        onAddToList(movie);
    };

    useEffect(() => {
        if (isOpen && movie) {
            try {
                console.log('[MOVIE-MODAL] opened movie:', { id: movie.id, tmdb_id: movie.tmdb_id, title: movie.title, type: movie.type });
            } catch (e) { /**/ }
            setCast([]);
            setSimilar([]);
            setDetails(null);
            setDetailGenres([]);
            setLogoUrl(null);
            setLogoLoading(true);
            setShowRatingTooltip(false);
            setUserDataLoaded(false);
            if (userId) {
                Promise.all([
                    fetch(`/api/auth/profile?userId=${userId}`).then(r => r.json()),
                    fetch(`/api/ratings?userId=${userId}`).then(r => r.json()),
                ]).then(([profileData, ratingsData]) => {
                    if (profileData.user?.preferences?.genres) {
                        setFavoriteGenres(profileData.user.preferences.genres);
                    }
                    const allRatings = ratingsData.ratings || {};
                    setTotalRatingsCount(Object.keys(allRatings).length);
                    if (movie?.tmdb_id) {
                        const rating = allRatings[String(movie.tmdb_id)] as Rating | undefined;
                        if (rating) setCurrentRating(rating);
                    }
                    setUserDataLoaded(true);
                }).catch(() => setUserDataLoaded(true));
            } else {
                setUserDataLoaded(true);
            }
            const detailsPromise = movie.type === 'series'
                ? TMDBService.fetchSeriesDetails(Number(movie.tmdb_id || movie.id))
                : TMDBService.fetchMovieDetails(Number(movie.tmdb_id || movie.id));

            detailsPromise.then(details => {
                if (!details) return;
                if (details.cast) setCast(details.cast.slice(0, 5));
                if (details.genres) setDetailGenres(details.genres);
                setDetails({
                    overview: details.overview,
                    runtime: 'runtime' in details ? (details as any).runtime : undefined,
                    number_of_seasons: 'number_of_seasons' in details ? (details as any).number_of_seasons : undefined,
                    number_of_episodes: 'number_of_episodes' in details ? (details as any).number_of_episodes : undefined,
                    ageRating: details.ageRating,
                    tagline: details.tagline,
                    first_air_date: 'first_air_date' in details ? (details as any).first_air_date : undefined,
                    last_air_date: 'last_air_date' in details ? (details as any).last_air_date : undefined,
                    director: 'director' in details ? (details as any).director : undefined,
                    created_by: 'created_by' in details ? (Array.isArray((details as any).created_by) ? (details as any).created_by.map((c: any) => c.name).join(', ') : (details as any).created_by) : undefined,
                    score: (details as any).vote_average ?? undefined,
                });
            }).catch(() => {});

            TMDBService.fetchSimilar(Number(movie.tmdb_id || movie.id), movie.type === 'series').then(async (similarMovies) => {
                const sliced = similarMovies.slice(0, 6) as Movie[];
                const enriched = await Promise.all(sliced.map(async (m) => {
                    const images = await TMDBService.fetchMovieImages(Number(m.tmdb_id || m.id), m.type === 'series', 'pt-BR,pt,en');
                    if (images.length > 0) {
                        return { ...m, backdrop_url: images[0] };
                    }
                    return m;
                }));
                setSimilar(enriched);
                setSimilarLoading(false);
            }).catch(() => setSimilarLoading(false));

            TMDBService.fetchMovieVideos(Number(movie.tmdb_id || movie.id), movie.type === 'series').then(setTrailers).catch(() => {});
            TMDBService.fetchMovieKeywords(Number(movie.tmdb_id || movie.id), movie.type === 'series').then(kw => setKeywords(kw.map(k => k.name))).catch(() => {});

            TMDBService.fetchMovieLogos(Number(movie.tmdb_id || movie.id), movie.type === 'series').then(logos => {
                if (logos && logos.length > 0) {
                    setLogoUrl(logos[0].file_path);
                } else {
                    setLogoUrl(null);
                }
                setLogoLoading(false);
            }).catch(() => {
                setLogoUrl(null);
                setLogoLoading(false);
            });

            TMDBService.fetchWatchProviders(Number(movie.tmdb_id || movie.id), movie.type === 'series').then(providers => {
                if (providers?.flatrate) {
                    const hasNetflix = providers.flatrate.some(p => 
                        p.provider_name.toLowerCase().includes('netflix')
                    );
                    setIsOnNetflix(hasNetflix);
                }
            });

            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen, movie]);

    if (!movie) return null;

    const titleLines = (movie.title || '').split(' ');
    const displayTitle = titleLines.length > 2 ? [titleLines.slice(0, Math.ceil(titleLines.length/2)).join(' '), titleLines.slice(Math.ceil(titleLines.length/2)).join(' ')] : [movie.title];
    const bgUrl = movie.backdrop_url || movie.poster_url || '';

    return (
        <ModalErrorBoundary>
        <>
        <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50">
                    {/* Overlay with Radial Gradient */}
                    <motion.div
                        key="overlay"
                        onClick={onClose}
                        className="fixed inset-0 bg-[#000]/78"
                        style={{
                            background: 'radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.06), transparent 34%), rgba(0, 0, 0, 0.88)'
                        }}
                        {...overlayFade}
                    />

                    {/* Modal Content */}
                    <motion.div
                        key="modal-container"
                        className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 md:p-8 overflow-y-auto scrollbar-hide"
                        {...movieModalContent}
                    >
                        <div className="relative w-full max-w-[850px] bg-[#181818] rounded-lg shadow-[0_28px_80px_rgba(0,0,0,0.65)] overflow-hidden my-8"
                        >
                        <div className="relative h-[478px] w-full overflow-hidden">
                            {/* Backdrop Image Layer + Gradients */}
                            {bgUrl && (
                                <motion.div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: `
                                            linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.12) 30%, rgba(24, 24, 24, 0.92) 100%),
                                            linear-gradient(115deg, rgba(13, 13, 13, 0.15) 18%, rgba(13, 13, 13, 0.86) 58%, rgba(13, 13, 13, 1) 100%),
                                            radial-gradient(circle at 16% 22%, rgba(255, 245, 230, 0.4), transparent 40%),
                                            linear-gradient(135deg, #333 0%, #1a1a1a 100%),
                                            url("${bgUrl}")
                                        `,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center top',
                                        backgroundRepeat: 'no-repeat',
                                    }}
                                    {...imageReveal}
                                />
                            )}

                            {/* Separate Layer for Screen Blending */}
                            <motion.div
                                className="absolute inset-0 mix-blend-screen opacity-[0.4]"
                                style={{
                                    backgroundImage: bgUrl ? `
                                        linear-gradient(90deg, rgba(0, 0, 0, 0.01) 0%, rgba(0, 0, 0, 0.24) 68%, rgba(0, 0, 0, 0.58) 100%),
                                        url("${bgUrl}")
                                    ` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center top',
                                }}
                                {...imageReveal}
                            />

                            {/* Full Backdrop Overlay */}
                            <div className="absolute inset-0 bg-black/55 z-10" />

                            {/* Bottom Fade */}
                            <div className="absolute inset-x-0 bottom-0 h-[180px] bg-linear-to-t from-[#181818] via-[#181818]/94 to-transparent z-10" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 z-40 w-9 h-9 flex items-center justify-center bg-[#181818]/70 text-white rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" strokeWidth={2.2} />
                            </button>

                            {/* Title Shadow Layer — só renderiza quando não está carregando e não há logo */}
                            <AnimatePresence>
                                {!logoLoading && !logoUrl && (
                                    <motion.div
                                        key="title-shadow"
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 0.34, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.45, ease: easeOutQuint }}
                                        className="absolute left-6 md:left-12 bottom-[108px] z-10 select-none pointer-events-none blur-[8px] transform-gpu"
                                    >
                                        <h1 className="text-[42px] md:text-[74px] font-[800] leading-[0.92] tracking-[-0.04em] uppercase text-black">
                                            {displayTitle.map((line, i) => <span key={i} className="block">{line}</span>)}
                                        </h1>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Main Title Area */}
                            <div className="absolute left-6 md:left-12 bottom-[108px] z-20">
                                {isOnNetflix && (
                                    <div className="flex items-center gap-2 mb-4 opacity-[0.74]">
                                        <img src="/assets/netflix-n.png" alt="Netflix" className="w-[18px] h-[32px] object-contain" />
                                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                                            {movie.type === 'series' ? 'Série' : 'Filme'}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Aguarda resolução do logo antes de exibir qualquer título */}
                                <AnimatePresence mode="wait">
                                    {!logoLoading && (
                                        logoUrl ? (
                                            <motion.img
                                                key="logo-img"
                                                src={`https://image.tmdb.org/t/p/original${logoUrl}`}
                                                alt={movie.title}
                                                className="h-20 md:h-32 object-contain filter drop-shadow-2xl max-w-[80vw] md:max-w-none"
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.45, ease: easeOutQuint }}
                                            />
                                        ) : (
                                            <motion.h1
                                                key="logo-text"
                                                className="text-[42px] md:text-[74px] font-[800] leading-[0.92] tracking-[-0.04em] uppercase text-white max-w-[80vw] md:max-w-none"
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                            >
                                                {displayTitle.map((line, i) => <span key={i} className="block">{line}</span>)}
                                            </motion.h1>
                                        )
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Actions Area */}
                            <div className="absolute left-6 md:left-12 bottom-10 z-30 flex items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => onWatch(movie)}
                                        className="bg-white hover:bg-[#e6e6e6] text-black font-bold h-[48px] px-7 rounded-[4px] transition-all flex items-center gap-2"
                                    >
                                        <svg width="20" height="24" viewBox="0 0 20 24" fill="black">
                                            <path d="M19.4951 10.5876C20.1603 10.9831 20.1436 11.9519 19.465 12.324L1.4809 22.1878C0.8145 22.5533 0 22.0711 0 21.311L0 0.7577C0 -0.01775 0.8444 -0.49812 1.5109 -0.10191L19.4951 10.5876Z" transform="translate(0, 1)"/>
                                        </svg>
                                        <span className="text-base font-bold">Assistir</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (isInWatchlist && onRemoveFromList) {
                                                onRemoveFromList(movie);
                                            } else {
                                                handleAddToListGuarded(movie);
                                            }
                                        }}
                                        className="w-12 h-12 flex items-center justify-center bg-[#2a2a2a] hover:bg-[#333] border-2 border-white/50 rounded-full text-white transition-all backdrop-blur-md"
                                    >
                                        {isInWatchlist ? <Check className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                                    </button>
                                    
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                const uid = userId ?? (localStorage.getItem('userBasicInfo') ? true : false);
                                                if (!uid) {
                                                    onClose();
                                                    window.dispatchEvent(new Event('requireLogin'));
                                                    return;
                                                }
                                                if (currentRating) {
                                                    if (movie?.tmdb_id) handleRatingAction(Number(movie.tmdb_id), movie.type, null);
                                                } else {
                                                    setShowRatingTooltip(!showRatingTooltip);
                                                }
                                            }}
                                            className="w-12 h-12 flex items-center justify-center border-2 rounded-full border-white/50 bg-[#2a2a2a] hover:bg-[#333] text-white transition-all backdrop-blur-md"
                                        >
                                            {currentRating === 'love' ? (
                                                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M10.696 8.7732C10.8947 8.45534 11 8.08804 11 7.7132V4H11.8377C12.7152 4 13.4285 4.55292 13.6073 5.31126C13.8233 6.22758 14 7.22716 14 8C14 8.58478 13.8976 9.1919 13.7536 9.75039L13.4315 11H14.7219H17.5C18.3284 11 19 11.6716 19 12.5C19 12.5929 18.9917 12.6831 18.976 12.7699L18.8955 13.2149L19.1764 13.5692C19.3794 13.8252 19.5 14.1471 19.5 14.5C19.5 14.8529 19.3794 15.1748 19.1764 15.4308L18.8955 15.7851L18.976 16.2301C18.9917 16.317 19 16.4071 19 16.5C19 16.9901 18.766 17.4253 18.3994 17.7006L18 18.0006L18 18.5001C17.9999 19.3285 17.3284 20 16.5 20H14H13H12.6228C11.6554 20 10.6944 19.844 9.77673 19.5382L8.28366 19.0405C7.22457 18.6874 6.11617 18.5051 5 18.5001V13.7543L7.03558 13.1727C7.74927 12.9688 8.36203 12.5076 8.75542 11.8781L10.696 8.7732Z" /></svg>
                                            ) : currentRating === 'like' ? (
                                                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M10.696 8.7732C10.8947 8.45534 11 8.08804 11 7.7132V4H11.8377C12.7152 4 13.4285 4.55292 13.6073 5.31126C13.8233 6.22758 14 7.22716 14 8C14 8.58478 13.8976 9.1919 13.7536 9.75039L13.4315 11H14.7219H17.5C18.3284 11 19 11.6716 19 12.5C19 12.5929 18.9917 12.6831 18.976 12.7699L18.8955 13.2149L19.1764 13.5692C19.3794 13.8252 19.5 14.1471 19.5 14.5C19.5 14.8529 19.3794 15.1748 19.1764 15.4308L18.8955 15.7851L18.976 16.2301C18.9917 16.317 19 16.4071 19 16.5C19 16.9901 18.766 17.4253 18.3994 17.7006L18 18.0006L18 18.5001C17.9999 19.3285 17.3284 20 16.5 20H14H13H12.6228C11.6554 20 10.6944 19.844 9.77673 19.5382L8.28366 19.0405C7.22457 18.6874 6.11617 18.5051 5 18.5001V13.7543L7.03558 13.1727C7.74927 12.9688 8.36203 12.5076 8.75542 11.8781L10.696 8.7732Z" /></svg>
                                            ) : (
                                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M10.696 8.7732C10.8947 8.45534 11 8.08804 11 7.7132V4H11.8377C12.7152 4 13.4285 4.55292 13.6073 5.31126C13.8233 6.22758 14 7.22716 14 8C14 8.58478 13.8976 9.1919 13.7536 9.75039L13.4315 11H14.7219H17.5C18.3284 11 19 11.6716 19 12.5C19 12.5929 18.9917 12.6831 18.976 12.7699L18.8955 13.2149L19.1764 13.5692C19.3794 13.8252 19.5 14.1471 19.5 14.5C19.5 14.8529 19.3794 15.1748 19.1764 15.4308L18.8955 15.7851L18.976 16.2301C18.9917 16.317 19 16.4071 19 16.5C19 16.9901 18.766 17.4253 18.3994 17.7006L18 18.0006L18 18.5001C17.9999 19.3285 17.3284 20 16.5 20H14H13H12.6228C11.6554 20 10.6944 19.844 9.77673 19.5382L8.28366 19.0405C7.22457 18.6874 6.11617 18.5051 5 18.5001V13.7543L7.03558 13.1727C7.74927 12.9688 8.36203 12.5076 8.75542 11.8781L10.696 8.7732ZM10.5 2C9.67157 2 9 2.67157 9 3.5V7.7132L7.05942 10.8181C6.92829 11.0279 6.72404 11.1817 6.48614 11.2497L4.45056 11.8313C3.59195 12.0766 3 12.8613 3 13.7543V18.5468C3 19.6255 3.87447 20.5 4.95319 20.5C5.87021 20.5 6.78124 20.6478 7.65121 20.9378L9.14427 21.4355C10.2659 21.8094 11.4405 22 12.6228 22H13H14H16.5C18.2692 22 19.7319 20.6873 19.967 18.9827C20.6039 18.3496 21 17.4709 21 16.5C21 16.4369 20.9983 16.3742 20.995 16.3118C21.3153 15.783 21.5 15.1622 21.5 14.5C21.5 13.8378 21.3153 13.217 20.995 12.6883C20.9983 12.6258 21 12.5631 21 12.5C21 10.567 19.433 9 17.5 9H15.9338C15.9752 8.6755 16 8.33974 16 8C16 6.98865 15.7788 5.80611 15.5539 4.85235C15.1401 3.09702 13.5428 2 11.8377 2H10.5Z" fill="currentColor" /></svg>
                                            )}
                                        </button>

                                        {showRatingTooltip && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50">
                                                <RatingTooltip
                                                    currentRating={currentRating}
                                                    onRate={(value) => {
                                                        const id = Number(movie?.tmdb_id);
                                                        if (id) handleRatingAction(id, movie!.type, value);
                                                        setShowRatingTooltip(false);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Volume Button */}
                            <div className="absolute right-6 md:right-12 bottom-10 z-30">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="w-12 h-12 flex items-center justify-center bg-transparent hover:bg-white/10 border-2 border-white/20 rounded-full text-white transition-all"
                                >
                                    {isMuted ? (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                            <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
                                        </svg>
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Body Section */}
                        <div className="px-6 md:px-12 pb-12 pt-0 bg-[#181818]">
                            <AnimatePresence mode="wait">
                                {!details ? (
                                    <motion.div
                                        key="body-skeleton"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3, ease: easeOutQuint }}
                                        className="animate-pulse space-y-6 py-6"
                                    >
                                        <div className="flex gap-3">
                                            <div className="h-4 w-20 bg-[#303030] rounded" />
                                            <div className="h-4 w-12 bg-[#303030] rounded" />
                                            <div className="h-4 w-24 bg-[#303030] rounded" />
                                        </div>
                                        <div className="h-4 w-full bg-[#303030] rounded" />
                                        <div className="h-4 w-3/4 bg-[#303030] rounded" />
                                        <div className="flex gap-6">
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 w-16 bg-[#303030] rounded" />
                                                <div className="h-4 w-32 bg-[#303030] rounded" />
                                                <div className="h-4 w-24 bg-[#303030] rounded" />
                                            </div>
                                            <div className="space-y-2 w-[200px] hidden md:block">
                                                <div className="h-4 w-12 bg-[#303030] rounded" />
                                                <div className="h-4 w-40 bg-[#303030] rounded" />
                                                <div className="h-4 w-12 bg-[#303030] rounded" />
                                                <div className="h-4 w-40 bg-[#303030] rounded" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="body-content"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4, ease: easeOutQuint }}
                                    >
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-12">
                                {/* Left Column: Summary */}
                                <div className="space-y-5">
                                    {/* Meta row */}
                                    <div className="flex flex-wrap items-center gap-2 text-base">
                                        {matchReady ? <span className="text-[#46d369] font-bold">{matchPercentage}% Match</span> : <span className="text-[#46d369] font-bold">--% Match</span>}
                                        <span className="text-[#bcbcbc]">{movie.year}</span>
                                        <span className="text-[#bcbcbc]">
                                            {movie.type === 'series'
                                                ? details?.number_of_seasons
                                                    ? `${details.number_of_seasons} Temporada${details.number_of_seasons > 1 ? 's' : ''}`
                                                    : '1 Temporada'
                                                : details?.runtime
                                                ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
                                                : movie.duration}
                                        </span>
                                        <span className="px-1.5 py-0.5 border border-[#808080] text-[11px] font-bold rounded-[4px] text-[#e5e5e5]">
                                            {details?.ageRating || movie.rating || '14+'}
                                        </span>
                                        <span className="px-1.5 py-0.5 border border-white/20 text-[10px] font-bold rounded-[4px] text-white/60">HD</span>
                                        <svg className="w-10 h-4" viewBox="0 0 39 16" fill="none" aria-label="Audiodescrição">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M0 16L11.1999 0H15.9999V16H11.9999V14.4H7.19996L5.59997 16H0ZM11.9999 5.6L8.8 10.4H11.9999V5.6Z" fill="#BCBCBC"/>
                                            <path fillRule="evenodd" clipRule="evenodd" d="M16.8 0V16H24.8C26.4 15.7 29.6 14.4 29.6 8C29.3 5.3 27.7 0 23.2 0H16.8ZM20.8 11.2V4.8C24 4.8 24.8 6.9 24.8 8C24.8 10.6 23.7 11.2 23.2 11.2H20.8Z" fill="#BCBCBC"/>
                                            <path d="M28.8 0C32 1.6 32 14.4 28.8 16H29.6C33.6 13.6 33.6 2.4 29.6 0L28.8 0Z" fill="#BCBCBC"/>
                                            <path d="M32 0C35.2 1.6 35.2 14.4 32 16H32.8C36.8 13.6 36.8 2.4 32.8 0L32 0Z" fill="#BCBCBC"/>
                                        </svg>
                                    </div>

                                    {/* Top 10 Badge */}
                                    {movie.rank && (
                                        <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-500">
                                            <svg width="245" height="30" viewBox="0 0 245 30" fill="none" aria-label={`#${movie.rank} em ${movie.type === 'series' ? 'Séries' : 'Filmes'} hoje`}>
                                                <rect y="1.0957" width="27.8086" height="27.8086" rx="3.47608" fill="#F50723"/>
                                                <path d="M7.72649 13.7028H6.16834V8.3974H4.05576V7.04955H9.83908V8.3974H7.72649V13.7028Z" fill="white"/>
                                                <path d="M13.27 13.8557C12.7729 13.8557 12.3141 13.7697 11.903 13.5976C11.4824 13.4255 11.1192 13.1866 10.8228 12.8711C10.5169 12.5557 10.278 12.1924 10.1155 11.7622C9.94339 11.3416 9.85736 10.8828 9.85736 10.3762C9.85736 9.86951 9.94339 9.41067 10.1155 8.98051C10.278 8.5599 10.5169 8.19665 10.8228 7.8812C11.1192 7.56574 11.4824 7.32676 11.903 7.1547C12.3141 6.98263 12.7729 6.8966 13.27 6.8966C13.7766 6.8966 14.2355 6.98263 14.6561 7.1547C15.0671 7.32676 15.4304 7.56574 15.7363 7.8812C16.0422 8.19665 16.2812 8.5599 16.4532 8.98051C16.6157 9.41067 16.7018 9.86951 16.7018 10.3762C16.7018 10.8828 16.6157 11.3416 16.4532 11.7622C16.2812 12.1924 16.0422 12.5557 15.7363 12.8711C15.4304 13.1866 15.0671 13.4255 14.6561 13.5976C14.2355 13.7697 13.7766 13.8557 13.27 13.8557ZM13.27 12.4792C13.6333 12.4792 13.9583 12.3931 14.2355 12.2115C14.5127 12.0395 14.723 11.7909 14.8855 11.4755C15.048 11.16 15.1245 10.7968 15.1245 10.3762C15.1245 9.95555 15.048 9.58274 14.8855 9.26728C14.723 8.95183 14.5127 8.71285 14.2355 8.53123C13.9583 8.35916 13.6333 8.27313 13.27 8.27313C12.9163 8.27313 12.6009 8.35916 12.3236 8.53123C12.0464 8.71285 11.8266 8.95183 11.6736 9.26728C11.5111 9.58274 11.4346 9.95555 11.4346 10.3762C11.4346 10.7968 11.5111 11.16 11.6736 11.4755C11.8266 11.7909 12.0464 12.0395 12.3236 12.2115C12.6009 12.3931 12.9163 12.4792 13.27 12.4792Z" fill="white"/>
                                                <path d="M17.3002 13.7028V7.04955H20.0533C20.5982 7.04955 21.0761 7.14514 21.4681 7.33632C21.86 7.52751 22.1659 7.79517 22.3762 8.1393C22.5865 8.48343 22.6916 8.88492 22.6916 9.34376C22.6916 9.8026 22.5865 10.2041 22.3762 10.5482C22.1659 10.9019 21.86 11.1696 21.4681 11.3608C21.0761 11.5519 20.5982 11.6475 20.0533 11.6475H18.8584V13.7028H17.3002ZM18.8584 10.3284H19.8239C20.2732 10.3284 20.5982 10.2423 20.8085 10.0703C21.0092 9.90775 21.1144 9.65921 21.1144 9.34376C21.1144 9.0283 21.0092 8.78932 20.8085 8.61726C20.5982 8.45475 20.2732 8.36872 19.8239 8.36872H18.8584V10.3284Z" fill="white"/>
                                                <text x="9" y="24" fill="white" fontSize="13" fontWeight="900" fontFamily="'Netflix Sans'">{movie.rank}</text>
                                                <text x="35" y="21" fill="white" fontSize="17" fontWeight="400" fontFamily="'Netflix Sans'">#{movie.rank} em {movie.type === 'series' ? 'Séries' : 'Filmes'} hoje</text>
                                            </svg>
                                        </div>
                                    )}

                                    <p className="text-white text-[16px] leading-[26px] font-normal">
                                        {details?.overview || movie.synopsis}
                                    </p>
                                </div>

                                {/* Right Column: Meta */}
                                <div className="space-y-3.5 text-sm leading-5">
                                    <div className="flex flex-wrap gap-1">
                                        <span className="text-[#777777]">Elenco:</span>
                                        <span className="text-white">{cast.map(c => c.name).join(', ') || 'Informação indisponível'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="text-[#777777]">Gêneros:</span>
                                        <span className="text-white">{detailGenres.length > 0 ? detailGenres.join(', ') : movie.genre?.join(', ') || 'Filmes, Séries'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* More Like This */}
                            <motion.div
                                className="mt-12"
                                variants={fadeIn}
                                initial="initial"
                                animate={similar.length > 0 || similarLoading ? "animate" : "initial"}
                            >
                                <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Títulos semelhantes</h3>
                                {similarLoading ? (
                                    <div className="flex flex-wrap gap-x-5 gap-y-4">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="bg-[#2f2f2f] rounded-[4px] overflow-hidden flex flex-col flex-1 min-w-[200px] w-[calc(33.333%-13.33px)] animate-pulse"
                                            >
                                                <div className="w-full aspect-video bg-[#3a3a3a]" />
                                                <div className="px-4 pt-4 pb-1">
                                                    <div className="h-3 bg-[#3a3a3a] rounded w-3/4" />
                                                </div>
                                                <div className="flex items-center justify-between px-4 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-5 bg-[#3a3a3a] rounded-[3px] w-14" />
                                                        <div className="h-5 bg-[#3a3a3a] rounded-[4px] w-9" />
                                                        <div className="h-4 bg-[#3a3a3a] rounded w-10" />
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-[#3a3a3a]" />
                                                </div>
                                                <div className="px-[14px] pb-[14px] flex-1 space-y-1.5">
                                                    <div className="h-3 bg-[#3a3a3a] rounded w-full" />
                                                    <div className="h-3 bg-[#3a3a3a] rounded w-5/6" />
                                                    <div className="h-3 bg-[#3a3a3a] rounded w-4/6" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : similar.length > 0 && (
                                    <motion.div
                                        className="flex flex-wrap gap-x-5 gap-y-4"
                                        variants={staggerContainer}
                                        initial="initial"
                                        animate="animate"
                                    >
                                        {similar.map((item, idx) => {
                                            const loaded = similarImagesLoaded.has(idx);
                                            return (
                                            <motion.div
                                                key={idx}
                                                onClick={() => onWatch(item)}
                                                className="bg-[#2f2f2f] rounded-[4px] overflow-hidden group cursor-pointer flex flex-col flex-1 min-w-[200px] w-[calc(33.333%-13.33px)]"
                                                variants={slideUpFade}
                                            >
                                                <div className="relative w-full aspect-video bg-[#3a3a3a]">
                                                    <img
                                                        src={item.backdrop_url || item.poster_url}
                                                        alt=""
                                                        loading="lazy"
                                                        onLoad={() => setSimilarImagesLoaded(prev => new Set(prev).add(idx))}
                                                        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                                                    />
                                                    {loaded && (
                                                        <>
                                                            <NetflixBadge className="absolute top-[7px] left-[7px] z-10" />
                                                            {item.duration && (
                                                                <span className="absolute top-[7px] right-[7px] bg-black/60 px-[6px] py-[2px] rounded-[3px] text-[12px] font-normal text-white/92 leading-none">{item.duration}</span>
                                                            )}
                                                        </>
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                                                            <Play className="w-5 h-5 fill-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                    <div className="px-4 pt-4 pb-1">
                                                        <p className="text-white text-[13px] font-medium leading-tight truncate">{item.title}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between px-4 pb-3">
                                                        <div className="flex items-center gap-2">
                                                        <span className="px-[6.5px] border border-[#bcbcbc] text-[13px] font-semibold rounded-[3px] text-white/88 leading-none py-[5px]">{item.rating || '14'}</span>
                                                        <span className="px-[6.5px] border border-[#808080] text-[13px] font-semibold rounded-[4px] text-white/88 leading-none py-[5px]">HD</span>
                                                        <span className="text-[#bcbcbc] text-[15px] font-normal">{item.year}</span>
                                                        </div>
                                                        <button className="w-10 h-10 rounded-full bg-[#2a2a2a] border-2 border-white/50 flex items-center justify-center text-white">
                                                            <Plus className="w-5 h-5" strokeWidth={1.5} />
                                                        </button>
                                                    </div>
                                                    <div className="px-[14px] pb-[14px] flex-1">
                                                        <p className="text-[#d2d2d2] text-[14px] leading-[20px] line-clamp-4">{item.synopsis}</p>
                                                    </div>
                                            </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Trailers & More */}
                            {trailers.length > 0 && (
                                <motion.div
                                    className="mt-12"
                                    variants={fadeIn}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Trailers e mais</h3>
                                    <div className="flex gap-[33px]">
                                        {trailers.map((trailer, i) => (
                                            <a
                                                key={i}
                                                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group block flex-1 min-w-0 max-w-[236px]"
                                            >
                                                <div className="relative w-full aspect-[236/132] overflow-hidden rounded-t-[4px] bg-white/10">
                                                    <img
                                                        src={`https://img.youtube.com/vi/${trailer.key}/mqdefault.jpg`}
                                                        alt=""
                                                        loading="lazy"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Play className="w-5 h-5 fill-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full px-4 py-4 flex items-center justify-center">
                                                    <p className="text-white text-[16px] font-medium leading-tight text-center line-clamp-2">{trailer.name}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* About Section */}
                            <div className="mt-12">
                                <div className="flex items-center gap-1.5 mb-5">
                                    <span className="text-white text-[24px] font-normal leading-[30px]">Sobre</span>
                                    <span className="text-white text-[24px] font-medium leading-[30px]">{movie.title}</span>
                                </div>
                                <div className="flex flex-col gap-2 text-[15px] leading-[20px]">
                                    {movie.type === 'series' ? (
                                        <>
                                            <p><span className="text-[#777777]">Criado por: </span><span className="text-white">{details?.created_by || 'Informação indisponível'}</span></p>
                                            <p><span className="text-[#777777]">Elenco: </span><span className="text-white">{cast.map(c => c.name).join(', ')}</span></p>
                                            <p><span className="text-[#777777]">Gêneros: </span><span className="text-white">{detailGenres.length > 0 ? detailGenres.join(', ') : movie.genre?.join(', ') || 'Filmes, Séries'}</span></p>
                                            {details?.number_of_seasons && details?.number_of_episodes && (
                                                <p><span className="text-[#777777]">Temporadas: </span><span className="text-white">{details.number_of_seasons} temporada{details.number_of_seasons > 1 ? 's' : ''} • {details.number_of_episodes} episódios</span></p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <p><span className="text-[#777777]">Direção: </span><span className="text-white">{details?.director || 'Informação indisponível'}</span></p>
                                            <p><span className="text-[#777777]">Elenco: </span><span className="text-white">{cast.map(c => c.name).join(', ')}</span></p>
                                            <p><span className="text-[#777777]">Gêneros: </span><span className="text-white">{detailGenres.length > 0 ? detailGenres.join(', ') : movie.genre?.join(', ') || 'Filmes, Séries'}</span></p>
                                        </>
                                    )}
                                    
                                    {keywords.length > 0 && (
                                        <p><span className="text-[#777777]">Este programa é: </span><span className="text-white">{keywords.join(', ')}</span></p>
                                    )}
                                    
                                    <div className="flex items-center gap-3.5 text-[15px] leading-[20px]">
                                        <span className="text-[#777777]">Classificação:</span>
                                        <span className="px-[6.5px] py-[2px] border border-[#bcbcbc] rounded text-[13px] font-semibold text-white/88 leading-none">{details?.ageRating || movie.rating || '14+'}</span>
                                        <span className="text-white">recomendado para maiores de {details?.ageRating || movie.rating || '14'} anos</span>
                                    </div>
                                </div>
                            </div>
                                </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
        </AnimatePresence>
        </>
        </ModalErrorBoundary>
    );
}
