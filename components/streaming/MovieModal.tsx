'use client';

import { useState, useEffect } from 'react';
import { X, Play, Plus, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressiveImage from './ProgressiveImage';
import Illumination from './Illumination';
import { Movie, CastMember } from '@/types/movie';
import { TMDBService } from './TMDBIntegration';

interface MovieModalProps {
    movie: Movie | null;
    isOpen: boolean;
    onClose: () => void;
    onWatch: (movie: Movie) => void;
    onAddToList: (movie: Movie, listType: 'favorites' | 'watch_later') => void;
    isFavorited?: boolean;
    isInWatchLater?: boolean;
}

interface KeywordInfo {
    id: number;
    name: string;
}

export default function MovieModal({
    movie,
    isOpen,
    onClose,
    onWatch,
    onAddToList,
}: MovieModalProps) {
    const [localFavorited, setLocalFavorited] = useState(false);
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

    // Limite de caracteres para mostrar "Ler mais" - responsivo
    const SYNOPSIS_LIMIT_MOBILE = 150;
    const SYNOPSIS_LIMIT_DESKTOP = 300;

    const [details, setDetails] = useState<{ ageRating?: string; runtime?: string; year?: number; cast?: CastMember[]; genres?: string[] }>({});
    const [keywords, setKeywords] = useState<KeywordInfo[]>([]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (isOpen && movie?.tmdb_id) {
                // Limpar detalhes anteriores ao abrir/trocar filme
                setDetails({});
                setKeywords([]);

                const isSeries = movie.type === 'series';

                // Buscar keywords
                const keywordsData = await TMDBService.fetchMovieKeywords(movie.tmdb_id, isSeries);
                setKeywords(keywordsData);

                if (isSeries) {
                    const seriesData = await TMDBService.fetchSeriesDetails(movie.tmdb_id);
                    if (seriesData) {
                        setDetails({
                            ageRating: seriesData.ageRating,
                            runtime: `${seriesData.number_of_seasons} Temporada${seriesData.number_of_seasons !== 1 ? 's' : ''}`,
                            year: seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : undefined,
                            cast: seriesData.cast,
                            genres: seriesData.genres
                        });
                    }
                } else {
                    const movieData = await TMDBService.fetchMovieDetails(movie.tmdb_id);
                    if (movieData) {
                        const hours = movieData.runtime ? Math.floor(movieData.runtime / 60) : 0;
                        const minutes = movieData.runtime ? movieData.runtime % 60 : 0;
                        setDetails({
                            ageRating: movieData.ageRating,
                            runtime: movieData.runtime ? `${hours}h ${minutes}m` : undefined,
                            year: movieData.release_date ? new Date(movieData.release_date).getFullYear() : undefined,
                            cast: movieData.cast,
                            genres: movieData.genres
                        });
                    }
                }
            }
        };
        fetchDetails();
    }, [isOpen, movie]);

    // Bloquear scroll da página quando o modal está aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Resetar estado da sinopse quando o modal fecha ou muda de filme
    useEffect(() => {
        setIsSynopsisExpanded(false);
    }, [movie?.id, isOpen]);

    // Obter cast do details ou do movie
    const castList = details.cast && details.cast.length > 0 
        ? details.cast.map(c => c.name) 
        : movie?.cast || [];

    // Obter genres do details ou do movie
    const genresList = details.genres && details.genres.length > 0 
        ? details.genres 
        : movie?.genre || [];

    if (!movie) return null;

    // Calcular porcentagem de match
    const matchPercentage = movie.score ? Math.min(100, Math.max(0, Math.round(parseFloat(movie.score.toString()) * 10))) : 78;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-[6px] z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-4 sm:inset-8 lg:inset-16 z-50 overflow-y-auto scrollbar-hide
                     rounded-md bg-[#181818] shadow-2xl
                     flex flex-col max-h-[90vh] mx-auto max-w-5xl
                     [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        <div className="min-h-full">
                            {/* Header Image */}
                            <div className="relative h-[45vh] sm:h-[38vh] lg:h-[60vh] shrink-0">
                                <ProgressiveImage
                                    src={movie.backdrop_url || movie.poster_url}
                                    alt={movie.title}
                                    className="w-full h-full rounded-t-md"
                                />
                                <Illumination intensity={0.18} />
                                <div className="absolute inset-0 bg-linear-to-t from-[#181818] via-[#181818]/50 to-transparent" />

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-1.5 rounded-full bg-transparent hover:bg-[#444444]/50 
                         text-white transition-colors w-9 h-9 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Header Content - Positioned at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 p-0 mb-4 sm:mb-6 lg:mb-8 px-4 sm:px-8 lg:px-12">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="w-full">
                                            <h2
                                                className={`font-black text-white mb-3 sm:mb-4 leading-tight ${movie.title.length > 50
                                                        ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl'
                                                        : movie.title.length > 30
                                                            ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'
                                                            : 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl'
                                                    }`}
                                            >
                                                {movie.title}
                                            </h2>

                                            {/* Action Buttons - Netflix Style */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onWatch(movie)}
                                                    className="bg-white hover:bg-gray-200 text-black font-bold py-1.5 sm:py-2 px-4 sm:px-8
                                       rounded transition-all duration-200 flex items-center justify-center text-sm sm:text-base"
                                                >
                                                    <Play className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2 fill-current" />
                                                    Play
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setLocalFavorited(!localFavorited);
                                                        onAddToList(movie, 'favorites');
                                                    }}
                                                    className="bg-[#333333]/60 hover:bg-[#444444] border border-[#ffffff]/70 text-white p-1.5 sm:p-2
                                       rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10"
                                                >
                                                    <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
                                                </button>
                                                <button
                                                    className="bg-[#333333]/60 hover:bg-[#444444] border border-[#ffffff]/70 text-white p-1.5 sm:p-2
                                       rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10"
                                                >
                                                    <ThumbsUp className="w-4 h-4 sm:w-6 sm:h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Informações abaixo da imagem de backdrop */}
                            <div className="px-4 sm:px-8 lg:px-12 py-3 sm:py-4 bg-linear-to-b from-[#181818] to-[#181818]/90">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <span className="text-[#46d369] font-bold text-sm sm:text-base whitespace-nowrap">{matchPercentage}% Match</span>
                                    <span className="text-white font-bold text-sm sm:text-base whitespace-nowrap">{details.year || movie.year}</span>

                                    {/* MPAA Rating Badge */}
                                    <div className="flex items-center justify-center bg-[#d7262d] rounded-[4px] min-w-[26px] sm:min-w-[32px] h-[26px] sm:h-[32px] px-1">
                                        <span
                                            className="text-white leading-none"
                                            style={{
                                                fontFamily: 'var(--font-bebas-neue), "Bebas Neue", "Impact", "Arial Narrow", sans-serif',
                                                fontSize: 'clamp(16px, 4vw, 22px)',
                                                fontWeight: 400,
                                                letterSpacing: '1px',
                                            }}
                                        >
                                            {details.ageRating === '+18' ? '18' : (details.ageRating || movie.rating || '12')}
                                        </span>
                                    </div>

                                    <span className="text-white font-bold text-sm sm:text-base whitespace-nowrap">{details.runtime || movie.duration}</span>

                                    {/* HD Badge */}
                                    <div className="flex items-center justify-center h-[20px] sm:h-[24px] border border-[hsla(0,0%,100%,0.5)] rounded-[4px] px-[4px] sm:px-[6px]">
                                        <span
                                            className="text-[hsla(0,0%,100%,0.9)] leading-none"
                                            style={{
                                                fontFamily: 'var(--font-bebas-neue), "Bebas Neue", "Impact", "Arial Narrow", sans-serif',
                                                fontSize: 'clamp(14px, 3vw, 18px)',
                                                fontWeight: 400,
                                                letterSpacing: '1px',
                                            }}
                                        >
                                            HD
                                        </span>
                                    </div>

                                    {/* Audio Channels Icon */}
                                    <svg viewBox="0 0 58.07 24" className="w-[24px] sm:w-[30px] block">
                                        <path fill="currentColor" d="M18.34,10.7v7.62l-4.73,0ZM.5,26.6h8l2.17-3,7.49,0s0,2.08,0,3.06h5.7V2.77H17C16.3,3.79.5,26.6.5,26.6Z" transform="translate(-0.5 -2.62)"></path>
                                        <path fill="currentColor" d="M30.63,8.91c3.6-.13,6.1,1.8,6.48,4.9.5,4.15-2.43,6.85-6.66,6.56V9.19A.26.26,0 0,1,30.63,8.91ZM25,3V26.56c5.78.11,10.22.32,13.49-1.85a12.2,12.2,0 0,0,5.14-11.36A11.52,11.52,0 0,0,33.38,2.72c-2.76-.23-8.25,0-8.25,0A.66.66,0 0,0,25,3Z" transform="translate(-0.5 -2.62)"></path>
                                        <path fill="currentColor" d="M43.72,3.43c1.45-.4,1.88,1.2,2.51,2.31a18.73,18.73,0 0,1-1.42,20.6h-.92a1.86,1.86,0 0,1,.42-1.11,21.39,21.39,0 0,0,2.76-10.16A22.54,22.54,0 0,0,43.72,3.43Z" transform="translate(-0.5 -2.62)"></path>
                                        <path fill="currentColor" d="M48.66,3.43c1.43-.4,1.87,1.2,2.5,2.31a18.83,18.83,0 0,1-1.42,20.6h-.91c-.07-.42.24-.79.41-1.11A21.39,21.39,0 0,0,52,15.07,22.63,22.63,0 0,0,48.66,3.43Z" transform="translate(-0.5 -2.62)"></path>
                                        <path fill="currentColor" d="M53.57,3.43c1.46-.4,1.9,1.2,2.54,2.31a18.58,18.58,0 0,1-1.44,20.6h-.93c-.07-.42.24-.79.42-1.11A21,21,0 0,0,57,15.07,22.26,22.26,0 0,0,53.57,3.43Z" transform="translate(-0.5 -2.62)"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Body Content - Netflix Style Grid */}
                            <div className="px-4 sm:px-8 lg:px-12 pt-2 pb-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Main Description */}
                                    <div className="lg:col-span-2">
                                        <div className="mb-6">
                                            {/* Mobile: limite menor */}
                                            <div className="sm:hidden">
                                                <p className="text-white text-[14px] leading-[1.6] wrap-break-word">
                                                    {!isSynopsisExpanded && movie.synopsis && movie.synopsis.length > SYNOPSIS_LIMIT_MOBILE
                                                        ? `${movie.synopsis.slice(0, SYNOPSIS_LIMIT_MOBILE)}...`
                                                        : movie.synopsis}
                                                </p>
                                                {movie.synopsis && movie.synopsis.length > SYNOPSIS_LIMIT_MOBILE && (
                                                    <button
                                                        onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                                                        className="text-[#46d369] hover:text-[#5ae87a] text-sm font-medium mt-2 transition-colors"
                                                    >
                                                        {isSynopsisExpanded ? 'Ler menos' : 'Ler mais'}
                                                    </button>
                                                )}
                                            </div>
                                            {/* Desktop: limite maior */}
                                            <div className="hidden sm:block">
                                                <p className="text-white text-[14px] leading-[1.6] wrap-break-word">
                                                    {!isSynopsisExpanded && movie.synopsis && movie.synopsis.length > SYNOPSIS_LIMIT_DESKTOP
                                                        ? `${movie.synopsis.slice(0, SYNOPSIS_LIMIT_DESKTOP)}...`
                                                        : movie.synopsis}
                                                </p>
                                                {movie.synopsis && movie.synopsis.length > SYNOPSIS_LIMIT_DESKTOP && (
                                                    <button
                                                        onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                                                        className="text-[#46d369] hover:text-[#5ae87a] text-sm font-medium mt-2 transition-colors"
                                                    >
                                                        {isSynopsisExpanded ? 'Ler menos' : 'Ler mais'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Column */}
                                    <div className="space-y-4">
                                        {/* Cast - Estilo Netflix */}
                                        {castList.length > 0 && (
                                            <div className="mb-2">
                                                <span className="text-[#777] text-[14px] leading-[20px]">Cast: </span>
                                                {castList.slice(0, 5).map((actor, i) => (
                                                    <span key={i} className="text-white text-[14px] leading-[20px] hover:underline cursor-pointer">
                                                        {actor}{i < Math.min(castList.length, 5) - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                                {castList.length > 5 && (
                                                    <span className="text-white text-[14px] leading-[20px] hover:underline cursor-pointer">, more.</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Genres - Estilo Netflix */}
                                        {genresList.length > 0 && (
                                            <div className="mb-2">
                                                <span className="text-[#777] text-[14px] leading-[20px]">Genres: </span>
                                                <span className="text-white text-[14px] leading-[20px] hover:underline cursor-pointer">
                                                    {genresList.join(', ')}.
                                                </span>
                                            </div>
                                        )}

                                        {/* This show is - Usando keywords do TMDB */}
                                        <div className="mb-2">
                                            <span className="text-[#777] text-[14px] leading-[20px]">This show is: </span>
                                            {keywords.length > 0 ? (
                                                keywords.slice(0, 4).map((keyword, i) => (
                                                    <span key={keyword.id} className="text-white text-[14px] leading-[20px] hover:underline cursor-pointer">
                                                        {keyword.name}{i < Math.min(keywords.length, 4) - 1 ? ', ' : '.'}
                                                    </span>
                                                ))
                                            ) : genresList.length > 0 ? (
                                                genresList.slice(0, 3).map((g, i) => (
                                                    <span key={i} className="text-white text-[14px] leading-[20px] hover:underline cursor-pointer">
                                                        {g}{i < Math.min(genresList.length, 3) - 1 ? ', ' : '.'}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-white text-[14px] leading-[20px]">Not specified.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
