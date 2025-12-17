'use client';

import { useState, useEffect } from 'react';
import { X, Play, Plus, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressiveImage from './ProgressiveImage';
import Illumination from './Illumination';
import { Movie } from '@/types/movie';
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

export default function MovieModal({
    movie,
    isOpen,
    onClose,
    onWatch,
    onAddToList,
    isFavorited,
    isInWatchLater
}: MovieModalProps) {
    const [localFavorited, setLocalFavorited] = useState(false);
    const [localWatchLater, setLocalWatchLater] = useState(false);
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

    // Limite de caracteres para mostrar "Ler mais" - responsivo
    const SYNOPSIS_LIMIT_MOBILE = 150;
    const SYNOPSIS_LIMIT_DESKTOP = 300;

    const [details, setDetails] = useState<{ ageRating?: string; runtime?: string; year?: number }>({});

    useEffect(() => {
        const fetchDetails = async () => {
            if (isOpen && movie?.tmdb_id) {
                // Limpar detalhes anteriores ao abrir/trocar filme
                setDetails({});

                if (movie.type === 'series') {
                    const seriesData = await TMDBService.fetchSeriesDetails(movie.tmdb_id);
                    if (seriesData) {
                        setDetails({
                            ageRating: seriesData.ageRating,
                            runtime: `${seriesData.number_of_seasons} Temporada${seriesData.number_of_seasons !== 1 ? 's' : ''}`,
                            year: seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : undefined
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
                            year: movieData.release_date ? new Date(movieData.release_date).getFullYear() : undefined
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

    if (!movie) return null;

    // Calcular porcentagem de match (simulação - você pode substituir pela lógica real)
    const matchPercentage = movie.score ? Math.min(100, Math.max(0, Math.round(parseFloat(movie.score.toString()) * 10))) : 78;

    // Verificar se é uma imagem de backdrop
    const isBackdropImage = movie.backdrop_url && movie.backdrop_url !== '';

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
                            <div className="relative h-[45vh] sm:h-[38vh] lg:h-[60vh] flex-shrink-0">
                                <ProgressiveImage
                                    src={movie.backdrop_url || movie.poster_url}
                                    alt={movie.title}
                                    className="w-full h-full rounded-t-md"
                                />
                                <Illumination intensity={0.18} />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/50 to-transparent" />

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
                                        {/* Title Logo (using text for now) */}
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
                                                {/* Ícone de volume - mudo quando é backdrop, com volume quando não é */}
                                                <button
                                                    className="bg-[#333333]/60 hover:bg-[#444444] border border-[#ffffff]/70 text-white p-1.5 sm:p-2
                                       rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 ml-auto opacity-40 hover:opacity-100"
                                                >
                                                    {isBackdropImage ? (
                                                        // Ícone de volume mudo (como no exemplo da Netflix)
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                                                            <path fillRule="evenodd" clipRule="evenodd" d="M11 4.00003C11 3.59557 10.7564 3.23093 10.3827 3.07615C10.009 2.92137 9.57889 3.00692 9.29289 3.29292L4.58579 8.00003H1C0.447715 8.00003 0 8.44774 0 9.00003V15C0 15.5523 0.447715 16 1 16H4.58579L9.29289 20.7071C9.57889 20.9931 10.009 21.0787 10.3827 20.9239C10.7564 20.7691 11 20.4045 11 20V4.00003ZM5.70711 9.70714L9 6.41424V17.5858L5.70711 14.2929L5.41421 14H5H2V10H5H5.41421L5.70711 9.70714ZM15.2929 9.70714L17.5858 12L15.2929 14.2929L16.7071 15.7071L19 13.4142L21.2929 15.7071L22.7071 14.2929L20.4142 12L22.7071 9.70714L21.2929 8.29292L19 10.5858L16.7071 8.29292L15.2929 9.70714Z" fill="currentColor"></path>
                                                        </svg>
                                                    ) : (
                                                        // Ícone de volume normal
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                                                            <path fillRule="evenodd" clipRule="evenodd" d="M24 12C24 8.28699 22.525 4.72603 19.8995 2.10052L18.4853 3.51474C20.7357 5.76517 22 8.81742 22 12C22 15.1826 20.7357 18.2349 18.4853 20.4853L19.8995 21.8995C22.525 19.274 24 15.7131 24 12ZM11 4.00001C11 3.59555 10.7564 3.23092 10.3827 3.07613C10.009 2.92135 9.57889 3.00691 9.29289 3.29291L4.58579 8.00001H1C0.447715 8.00001 0 8.44773 0 9.00001V15C0 15.5523 0.447715 16 1 16H4.58579L9.29289 20.7071C9.57889 20.9931 10.009 21.0787 10.3827 20.9239C10.7564 20.7691 11 20.4045 11 20V4.00001ZM5.70711 9.70712L9 6.41423V17.5858L5.70711 14.2929L5.41421 14H5H2V10H5H5.41421L5.70711 9.70712ZM16.0001 12C16.0001 10.4087 15.368 8.8826 14.2428 7.75739L12.8285 9.1716C13.5787 9.92174 14.0001 10.9392 14.0001 12C14.0001 13.0609 13.5787 14.0783 12.8285 14.8285L14.2428 16.2427C15.368 15.1174 16.0001 13.5913 16.0001 12ZM17.0709 4.92896C18.9462 6.80432 19.9998 9.34786 19.9998 12C19.9998 14.6522 18.9462 17.1957 17.0709 19.0711L15.6567 17.6569C17.157 16.1566 17.9998 14.1218 17.9998 12C17.9998 9.87829 17.157 7.84346 15.6567 6.34317L17.0709 4.92896Z" fill="currentColor"></path>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Informações abaixo da imagem de backdrop */}
                            <div className="px-4 sm:px-8 lg:px-12 py-3 sm:py-4 bg-gradient-to-b from-[#181818] to-[#181818]/90">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <span className="text-[#46d369] font-bold text-sm sm:text-base whitespace-nowrap">{matchPercentage}% Match</span>
                                    <span className="text-white font-bold text-sm sm:text-base whitespace-nowrap">{details.year || movie.year}</span>

                                    {/* MPAA Rating Badge - Estilo Netflix idêntico ao exemplo */}
                                    <div className="flex items-center justify-center bg-[#d7262d] rounded-[4px] min-w-[26px] sm:min-w-[32px] h-[26px] sm:h-[32px] px-1">
                                        <span
                                            className="text-white leading-none font-[var(--font-bebas-neue)]"
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

                                    {/* HD Badge - Estilo Netflix idêntico ao exemplo */}
                                    <div
                                        className="flex items-center justify-center h-[20px] sm:h-[24px] border border-[hsla(0,0%,100%,0.5)] rounded-[4px] px-[4px] sm:px-[6px]"
                                    >
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

                                    {/* Audio Channels Icon - IDENTICAL to exemplo */}
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
                                        {/* Netflix Style Description com "Ler mais" inteligente */}
                                        <div className="mb-6">
                                            {/* Mobile: limite menor */}
                                            <div className="sm:hidden">
                                                <p className="text-white text-[14px] leading-[1.6] break-words">
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
                                                <p className="text-white text-[14px] leading-[1.6] break-words">
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
                                        {/* Cast */}
                                        {movie.cast && movie.cast.length > 0 && (
                                            <div>
                                                <h3 className="text-[#777777] font-normal mb-2 text-sm">Cast:</h3>
                                                <div className="flex flex-wrap gap-1">
                                                    {movie.cast.slice(0, 6).map((actor, i) => (
                                                        <span key={i} className="text-white text-sm hover:underline cursor-pointer">
                                                            {actor}{i < Math.min(movie.cast!.length, 6) - 1 && ','}
                                                        </span>
                                                    ))}
                                                    {movie.cast.length > 6 && (
                                                        <span className="text-white text-sm">more.</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Genres */}
                                        {movie.genre && movie.genre.length > 0 && (
                                            <div>
                                                <h3 className="text-[#777777] font-normal mb-2 text-sm">Genres:</h3>
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="text-white text-sm">
                                                        {movie.genre.join(', ')}.
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* This show is */}
                                        <div>
                                            <h3 className="text-[#777777] font-normal mb-2 text-sm">This show is:</h3>
                                            <div className="flex flex-wrap gap-1">
                                                {movie.genre && movie.genre.length > 0 ? (
                                                    movie.genre.map((g, i) => (
                                                        <span key={i} className="text-white text-sm">
                                                            {g}{i < movie.genre!.length - 1 ? ',' : '.'}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-white text-sm">Not specified.</span>
                                                )}
                                            </div>
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