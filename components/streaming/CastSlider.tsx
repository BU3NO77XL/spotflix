'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, MapPin, User, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CastMember } from '@/types/movie';
import { TMDBService } from './TMDBIntegration';

interface CastSliderProps {
    cast: CastMember[];
}

interface ActorDetails {
    name: string;
    biography: string;
    birthday: string;
    place_of_birth: string;
    profile_path: string;
    known_for: { title: string; poster_path: string; id: number }[];
    social_ids: { instagram_id?: string; twitter_id?: string; facebook_id?: string; tiktok_id?: string; youtube_id?: string };
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const AUTO_PLAY_INTERVAL = 6000;
const PAUSE_AFTER_INTERACTION = 120000;

export default function CastSlider({ cast }: CastSliderProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [actorDetails, setActorDetails] = useState<ActorDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [bioExpanded, setBioExpanded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleScrollArrows = useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            
            // Se o conteúdo couber inteiramente no container, não mostra nenhuma seta
            if (scrollWidth <= clientWidth + 10) {
                setShowLeftArrow(false);
                setShowRightArrow(false);
                return;
            }

            setShowLeftArrow(scrollLeft > 40);
            setShowRightArrow(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 40);
        }
    }, []);

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.6;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        handleScrollArrows();
        
        // Verifica novamente após um pequeno atraso para garantir que os elementos renderizaram
        const timeoutId = setTimeout(handleScrollArrows, 150);
        
        // Atualiza ao redimensionar a janela
        window.addEventListener('resize', handleScrollArrows);
        
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleScrollArrows);
        };
    }, [cast]);
    
    const selectedActor = cast[selectedIndex];

    /* DESATIVADO - Slider autoplay comentado a pedido do usuário
    useEffect(() => {
        if (isPaused || cast.length <= 1) return;
        const interval = setInterval(() => {
            setSelectedIndex((prev) => (prev + 1) % cast.length);
        }, AUTO_PLAY_INTERVAL);
        return () => clearInterval(interval);
    }, [isPaused, cast.length]);
    */

    const handleUserInteraction = useCallback((index: number) => {
        /*
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        setIsPaused(true);
        pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), PAUSE_AFTER_INTERACTION);
        */
        setSelectedIndex(index);
        setBioExpanded(false);
        setIsModalOpen(true);
    }, []);

    useEffect(() => {
        return () => {
            if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (selectedActor?.id) {
            setLoading(true);
            setBioExpanded(false);
            TMDBService.fetchActorDetails(selectedActor.id).then((data) => {
                setActorDetails(data);
                setLoading(false);
            });
        }
    }, [selectedActor?.id]);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    /* DESATIVADO - Auto scroll to selected thumbnail
    useEffect(() => {
        const container = scrollRef.current;
        const child = container?.children[selectedIndex] as HTMLElement;
        if (container && child && !isModalOpen) {
            const containerRect = container.getBoundingClientRect();
            const childRect = child.getBoundingClientRect();
            const scrollLeft = child.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (childRect.width / 2);
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, [selectedIndex, isModalOpen]);
    */

    const calculateAge = (birthday: string) => {
        if (!birthday) return null;
        const birth = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    if (!cast?.length) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-white text-xl md:text-2xl font-semibold px-2">Elenco Principal</h2>

            {/* Thumbnails - Cast List */}
            <div className="relative -mx-4 sm:-mx-8 lg:-mx-12">

                {/* Left Arrow */}
                {showLeftArrow && (
                    <button
                        onClick={() => scrollCarousel('left')}
                        className="absolute left-4 sm:left-8 lg:left-12 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 hover:bg-black/90 transition-all duration-200 border border-white/20 rounded-full hidden md:block"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                )}

                {/* Right Arrow */}
                {showRightArrow && (
                    <button
                        onClick={() => scrollCarousel('right')}
                        className="absolute right-4 sm:right-8 lg:right-12 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 hover:bg-black/90 transition-all duration-200 border border-white/20 rounded-full hidden md:block"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                )}

                <div
                    ref={scrollRef}
                    onScroll={handleScrollArrows}
                    className="flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-8 lg:px-12 py-4 scrollbar-hide snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-8 lg:scroll-pl-12 scroll-pr-4 sm:scroll-pr-8 lg:scroll-pr-12"
                >
                    {cast.map((actor, index) => {
                        const thumbUrl = actor.profile_path
                            ? `${TMDB_IMAGE_BASE}/w185${actor.profile_path}`
                            : null;

                        return (
                            <button
                                key={index}
                                onClick={() => handleUserInteraction(index)}
                                className="shrink-0 snap-start flex flex-col items-center group transition-all duration-300 w-24 sm:w-24 md:w-28 focus:outline-none"
                            >
                                <div className="w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-3 transition-all duration-300 ring-1 ring-white/10 group-hover:ring-white/50 group-hover:scale-105 shadow-lg bg-[#2a2a2a]">
                                    {thumbUrl ? (
                                        <img src={thumbUrl} alt={actor.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-9 h-9 text-gray-500" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-white text-sm sm:text-sm font-medium text-center line-clamp-1 w-full px-1 group-hover:text-[#1DB954] transition-colors">
                                    {actor.name}
                                </span>
                                {actor.character && (
                                    <span className="text-gray-400 text-xs sm:text-xs text-center line-clamp-2 w-full mt-0.5 leading-tight px-1">
                                        {actor.character}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 
            === SLIDER ANTIGO DESATIVADO CONFORME SOLICITADO === 
            <div className="bg-[#1f1f1f] rounded-lg">
               ... código antigo ...
            </div>
            ====================================================
            */}

            {/* Modal de Detalhes do Ator */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[65vh] overflow-y-auto scrollbar-hide relative shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-white/20 rounded-full transition-colors text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="p-6 sm:p-8">
                                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                                    {/* Actor Photo */}
                                    <div className="w-32 h-44 sm:w-40 sm:h-56 shrink-0 rounded-xl overflow-hidden bg-[#2a2a2a] mx-auto sm:mx-0 shadow-xl border border-white/5">
                                        {selectedActor?.profile_path ? (
                                            <img src={`${TMDB_IMAGE_BASE}/w500${selectedActor.profile_path}`} alt={selectedActor.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-12 h-12 text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Actor Header Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-left pt-2">
                                        <h3 className="text-white font-bold text-2xl sm:text-3xl mb-1">
                                            {selectedActor?.name}
                                        </h3>
                                        {selectedActor?.character && (
                                            <p className="text-[#1DB954] font-medium text-sm sm:text-base mb-4">
                                                como <span className="text-gray-300">{selectedActor.character}</span>
                                            </p>
                                        )}
                                        
                                        {/* Social Media */}
                                        {actorDetails?.social_ids && (actorDetails.social_ids.instagram_id || actorDetails.social_ids.twitter_id || actorDetails.social_ids.facebook_id || actorDetails.social_ids.tiktok_id) && (
                                            <div className="flex gap-3 mb-5 justify-center sm:justify-start">
                                                {actorDetails.social_ids.instagram_id && (
                                                    <a href={`https://instagram.com/${actorDetails.social_ids.instagram_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors bg-white/5 p-2.5 rounded-full hover:bg-white/10">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                                    </a>
                                                )}
                                                {actorDetails.social_ids.twitter_id && (
                                                    <a href={`https://twitter.com/${actorDetails.social_ids.twitter_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors bg-white/5 p-2.5 rounded-full hover:bg-white/10">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                                    </a>
                                                )}
                                                {actorDetails.social_ids.facebook_id && (
                                                    <a href={`https://facebook.com/${actorDetails.social_ids.facebook_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors bg-white/5 p-2.5 rounded-full hover:bg-white/10">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                                    </a>
                                                )}
                                                {actorDetails.social_ids.tiktok_id && (
                                                    <a href={`https://tiktok.com/@${actorDetails.social_ids.tiktok_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2.5 rounded-full hover:bg-white/10">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Meta Info */}
                                        {actorDetails && (
                                            <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-400 justify-center sm:justify-start">
                                                {actorDetails.birthday && calculateAge(actorDetails.birthday) && (
                                                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md">
                                                        <Calendar className="w-4 h-4" />
                                                        {calculateAge(actorDetails.birthday)} anos
                                                    </span>
                                                )}
                                                {actorDetails.place_of_birth && (
                                                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md">
                                                        <MapPin className="w-4 h-4 shrink-0" />
                                                        {actorDetails.place_of_birth}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full h-px bg-white/10 mb-6" />

                                {/* Biografia e Conhecido Por */}
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : actorDetails && (
                                    <div className="space-y-8">
                                        {actorDetails.biography && (
                                            <div>
                                                <h4 className="text-white font-semibold text-lg mb-3">
                                                    Biografia
                                                </h4>
                                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line bg-white/5 p-4 rounded-xl">
                                                    {!bioExpanded && actorDetails.biography.length > 400
                                                        ? `${actorDetails.biography.slice(0, 400)}...`
                                                        : actorDetails.biography}
                                                </p>
                                                {actorDetails.biography.length > 400 && (
                                                    <button
                                                        onClick={() => setBioExpanded(!bioExpanded)}
                                                        className="text-[#1DB954] hover:text-[#5ae87a] text-sm font-medium mt-3 ml-2 transition-colors"
                                                    >
                                                        {bioExpanded ? 'Ler menos' : 'Ler mais'}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {actorDetails.known_for && actorDetails.known_for.length > 0 && (
                                            <div>
                                                <h4 className="text-white font-semibold text-lg mb-4">
                                                    Conhecido por
                                                </h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    {actorDetails.known_for.slice(0, 4).map((movie, i) => (
                                                        <div key={i} className="group cursor-pointer" title={movie.title}>
                                                            <div className="aspect-2/3 rounded-xl overflow-hidden bg-[#2a2a2a] group-hover:ring-2 group-hover:ring-[#1DB954] transition-all duration-200 shadow-md">
                                                                {movie.poster_path ? (
                                                                    <img
                                                                        src={`${TMDB_IMAGE_BASE}/w342${movie.poster_path}`}
                                                                        alt={movie.title}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs p-2 text-center bg-white/5">
                                                                        {movie.title}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-300 text-xs mt-2 truncate group-hover:text-white transition-colors px-1 text-center font-medium">
                                                                {movie.title}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}