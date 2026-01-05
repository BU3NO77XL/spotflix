'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const BIO_LIMIT = 250;

    const handleScrollArrows = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

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
    }, [cast]);
    const selectedActor = cast[selectedIndex];

    useEffect(() => {
        if (isPaused || cast.length <= 1) return;
        const interval = setInterval(() => {
            setSelectedIndex((prev) => (prev + 1) % cast.length);
        }, AUTO_PLAY_INTERVAL);
        return () => clearInterval(interval);
    }, [isPaused, cast.length]);

    const handleUserInteraction = useCallback((index: number) => {
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        setIsPaused(true);
        setSelectedIndex(index);
        setBioExpanded(false);
        pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), PAUSE_AFTER_INTERACTION);
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
        const container = scrollRef.current;
        const child = container?.children[selectedIndex] as HTMLElement;
        if (container && child) {
            const containerRect = container.getBoundingClientRect();
            const childRect = child.getBoundingClientRect();
            const scrollLeft = child.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (childRect.width / 2);
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);

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

    const profileUrl = selectedActor?.profile_path
        ? `${TMDB_IMAGE_BASE}/w500${selectedActor.profile_path}`
        : null;

    return (
        <div className="space-y-6">
            <h2 className="text-white text-xl font-semibold">Elenco Principal</h2>

            {/* Thumbnails - Above slider */}
            <div className="relative">
                {/* Left Arrow */}
                {showLeftArrow && (
                    <button
                        onClick={() => scrollCarousel('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 transition-all duration-200 border border-white/20"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                )}

                {/* Right Arrow */}
                {showRightArrow && (
                    <button
                        onClick={() => scrollCarousel('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/70 transition-all duration-200 border border-white/20"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                )}

                <div
                    ref={scrollRef}
                    onScroll={handleScrollArrows}
                    className="flex gap-4 overflow-x-auto px-3 py-4 -mx-3 scrollbar-hide"
                >
                    {cast.map((actor, index) => {
                        const thumbUrl = actor.profile_path
                            ? `${TMDB_IMAGE_BASE}/w185${actor.profile_path}`
                            : null;

                        return (
                            <button
                                key={index}
                                onClick={() => handleUserInteraction(index)}
                                className={`shrink-0 rounded-lg transition-all duration-300 ${index === selectedIndex
                                        ? 'ring-2 ring-[#1DB954] ring-offset-2 ring-offset-[#121212] scale-105'
                                        : 'hover:scale-102'
                                    }`}
                            >
                                <div className="w-24 h-32 sm:w-28 sm:h-36 md:w-32 md:h-44 lg:w-36 lg:h-48 rounded-lg overflow-hidden">
                                    {thumbUrl ? (
                                        <img src={thumbUrl} alt={actor.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                                            <User className="w-10 h-10 text-gray-600" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-[#1f1f1f] rounded-lg">
                {/* Top row - Photo + Info */}
                <div className="flex flex-row">
                    {/* Actor Photo */}
                    <div className="w-28 sm:w-32 md:w-36 lg:w-40 shrink-0 self-start">
                        <div className="relative aspect-3/4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full h-full"
                                >
                                    {profileUrl ? (
                                        <img
                                            src={profileUrl}
                                            alt={selectedActor.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full min-h-[150px] flex items-center justify-center bg-[#1f1f1f]">
                                            <User className="w-12 h-12 text-gray-700" />
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Progress bar */}
                            {!isPaused && cast.length > 1 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                                    <motion.div
                                        key={selectedIndex}
                                        className="h-full bg-white"
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: 'linear' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Social Media - Mobile only */}
                        <div className="lg:hidden p-2 pt-2">
                            <p className="text-gray-500 text-[10px] mb-1.5">Redes sociais</p>
                            {actorDetails?.social_ids && (actorDetails.social_ids.instagram_id || actorDetails.social_ids.twitter_id || actorDetails.social_ids.facebook_id || actorDetails.social_ids.tiktok_id) ? (
                                <div className="flex gap-2">
                                    {actorDetails.social_ids.instagram_id && (
                                        <a href={`https://instagram.com/${actorDetails.social_ids.instagram_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                        </a>
                                    )}
                                    {actorDetails.social_ids.twitter_id && (
                                        <a href={`https://twitter.com/${actorDetails.social_ids.twitter_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                        </a>
                                    )}
                                    {actorDetails.social_ids.facebook_id && (
                                        <a href={`https://facebook.com/${actorDetails.social_ids.facebook_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                        </a>
                                    )}
                                    {actorDetails.social_ids.tiktok_id && (
                                        <a href={`https://tiktok.com/@${actorDetails.social_ids.tiktok_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-600 text-[10px]">Não encontrado</p>
                            )}
                        </div>
                    </div>

                    {/* Actor Info - Name + Bio */}
                    <div className="flex-1 p-3 lg:p-4 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col lg:flex-row lg:gap-6"
                            >
                                {/* Name + Bio */}
                                <div className="lg:w-[50%] lg:shrink-0 min-w-0">
                                    <div className="flex items-center gap-3 mb-0.5">
                                        <h3 className="text-white font-bold text-base lg:text-lg">
                                            {selectedActor.name}
                                        </h3>
                                        {/* Social Media - Desktop only */}
                                        {actorDetails?.social_ids && (actorDetails.social_ids.instagram_id || actorDetails.social_ids.twitter_id || actorDetails.social_ids.facebook_id || actorDetails.social_ids.tiktok_id) && (
                                            <div className="hidden lg:flex gap-2">
                                                {actorDetails.social_ids.instagram_id && (
                                                    <a href={`https://instagram.com/${actorDetails.social_ids.instagram_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                                    </a>
                                                )}
                                                {actorDetails.social_ids.twitter_id && (
                                                    <a href={`https://twitter.com/${actorDetails.social_ids.twitter_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                                    </a>
                                                )}
                                                {actorDetails.social_ids.facebook_id && (
                                                    <a href={`https://facebook.com/${actorDetails.social_ids.facebook_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                                    </a>
                                                )}
                                                {actorDetails.social_ids.tiktok_id && (
                                                    <a href={`https://tiktok.com/@${actorDetails.social_ids.tiktok_id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {selectedActor.character && (
                                        <p className="text-gray-400 text-xs mb-2">
                                            como <span className="text-gray-300 font-medium">{selectedActor.character}</span>
                                        </p>
                                    )}

                                    <div className="space-y-2">
                                        {loading ? (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-xs">Carregando...</span>
                                            </div>
                                        ) : actorDetails ? (
                                            <>
                                                {/* Meta info */}
                                                <div className="flex flex-wrap gap-3 text-[11px] text-gray-400">
                                                    {actorDetails.birthday && calculateAge(actorDetails.birthday) && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {calculateAge(actorDetails.birthday)} anos
                                                        </span>
                                                    )}
                                                    {actorDetails.place_of_birth && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 shrink-0" />
                                                            {actorDetails.place_of_birth}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Biography */}
                                                {actorDetails.biography && (
                                                    <div>
                                                        <p className="text-gray-300 text-[11px] leading-relaxed whitespace-pre-line">
                                                            {!bioExpanded && actorDetails.biography.length > BIO_LIMIT
                                                                ? `${actorDetails.biography.slice(0, BIO_LIMIT)}...`
                                                                : actorDetails.biography}
                                                        </p>
                                                        {actorDetails.biography.length > BIO_LIMIT && (
                                                            <button
                                                                onClick={() => setBioExpanded(!bioExpanded)}
                                                                className="text-[#46d369] hover:text-[#5ae87a] text-[11px] font-medium mt-1"
                                                            >
                                                                {bioExpanded ? 'Ler menos' : 'Ler mais'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-gray-500 text-xs">Informações não disponíveis</p>
                                        )}
                                    </div>
                                </div>

                                {/* Known For - Desktop only (inline) */}
                                {actorDetails && actorDetails.known_for && actorDetails.known_for.length > 0 && (
                                    <div className="hidden lg:block lg:flex-1">
                                        <p className="text-gray-500 text-[11px] mb-2">Conhecido por</p>
                                        <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
                                            {actorDetails.known_for.slice(0, 4).map((movie, i) => (
                                                <div key={i} className="shrink-0 group cursor-pointer" title={movie.title}>
                                                    <div className="w-24 aspect-2/3 rounded overflow-hidden bg-[#2a2a2a] 
                                                        group-hover:ring-1 group-hover:ring-white/50 transition-all duration-200">
                                                        {movie.poster_path ? (
                                                            <img
                                                                src={`${TMDB_IMAGE_BASE}/w185${movie.poster_path}`}
                                                                alt={movie.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-[8px] p-1 text-center">
                                                                {movie.title}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Known For - Mobile only (below photo) */}
                {actorDetails && actorDetails.known_for && actorDetails.known_for.length > 0 && (
                    <div className="lg:hidden p-3 pt-0">
                        <p className="text-gray-500 text-[11px] mb-2">Conhecido por</p>
                        <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
                            {actorDetails.known_for.slice(0, 4).map((movie, i) => (
                                <div key={i} className="shrink-0 group cursor-pointer" title={movie.title}>
                                    <div className="w-16 sm:w-18 aspect-2/3 rounded overflow-hidden bg-[#2a2a2a] 
                                        group-hover:ring-1 group-hover:ring-white/50 transition-all duration-200">
                                        {movie.poster_path ? (
                                            <img
                                                src={`${TMDB_IMAGE_BASE}/w185${movie.poster_path}`}
                                                alt={movie.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-[8px] p-1 text-center">
                                                {movie.title}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}