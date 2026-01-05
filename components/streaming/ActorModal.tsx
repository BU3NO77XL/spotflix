'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TMDBService } from './TMDBIntegration';

interface ActorModalProps {
    actorId: number | null;
    isOpen: boolean;
    onClose: () => void;
}

interface ActorDetails {
    name: string;
    biography: string;
    birthday: string;
    place_of_birth: string;
    profile_path: string;
    known_for: { title: string; poster_path: string; id: number }[];
}

export default function ActorModal({ actorId, isOpen, onClose }: ActorModalProps) {
    const [actor, setActor] = useState<ActorDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [bioExpanded, setBioExpanded] = useState(false);

    const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
    const BIO_LIMIT = 300;

    useEffect(() => {
        if (actorId && isOpen) {
            setLoading(true);
            setBioExpanded(false);
            TMDBService.fetchActorDetails(actorId).then((data) => {
                setActor(data);
                setLoading(false);
            });
        }
    }, [actorId, isOpen]);

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

    const formatDate = (dateStr: string) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const calculateAge = (birthday: string) => {
        if (!birthday) return null;
        const birth = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

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
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-4 sm:inset-8 lg:inset-y-16 lg:inset-x-32 z-60 overflow-y-auto
                            rounded-xl bg-[#1f1f1f] shadow-2xl max-w-3xl mx-auto
                            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            </div>
                        ) : actor ? (
                            <div className="relative">
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 
                                        text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Header */}
                                <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
                                    {/* Profile Image */}
                                    <div className="shrink-0 mx-auto sm:mx-0">
                                        <div className="w-40 h-52 sm:w-48 sm:h-64 rounded-lg overflow-hidden bg-[#2a2a2a]">
                                            {actor.profile_path ? (
                                                <img
                                                    src={`${TMDB_IMAGE_BASE}/w300${actor.profile_path}`}
                                                    alt={actor.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    Sem foto
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 text-center sm:text-left">
                                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                            {actor.name}
                                        </h2>

                                        <div className="space-y-2 text-sm text-gray-400 mb-4">
                                            {actor.birthday && (
                                                <div className="flex items-center gap-2 justify-center sm:justify-start">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {formatDate(actor.birthday)}
                                                        {calculateAge(actor.birthday) && ` (${calculateAge(actor.birthday)} anos)`}
                                                    </span>
                                                </div>
                                            )}
                                            {actor.place_of_birth && (
                                                <div className="flex items-center gap-2 justify-center sm:justify-start">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{actor.place_of_birth}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Biography */}
                                        {actor.biography && (
                                            <div>
                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                    {!bioExpanded && actor.biography.length > BIO_LIMIT
                                                        ? `${actor.biography.slice(0, BIO_LIMIT)}...`
                                                        : actor.biography}
                                                </p>
                                                {actor.biography.length > BIO_LIMIT && (
                                                    <button
                                                        onClick={() => setBioExpanded(!bioExpanded)}
                                                        className="text-[#46d369] hover:text-[#5ae87a] text-sm font-medium mt-2"
                                                    >
                                                        {bioExpanded ? 'Ler menos' : 'Ler mais'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Known For */}
                                {actor.known_for && actor.known_for.length > 0 && (
                                    <div className="px-6 sm:px-8 pb-8">
                                        <h3 className="text-white font-semibold mb-4">Conhecido por</h3>
                                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                            {actor.known_for.map((movie, i) => (
                                                <div key={i} className="shrink-0 w-24 sm:w-28">
                                                    <div className="aspect-2/3 rounded-lg overflow-hidden bg-[#2a2a2a] mb-2">
                                                        {movie.poster_path ? (
                                                            <img
                                                                src={`${TMDB_IMAGE_BASE}/w185${movie.poster_path}`}
                                                                alt={movie.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs p-2 text-center">
                                                                {movie.title}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-white text-xs truncate">{movie.title}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-400">
                                Não foi possível carregar as informações.
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}