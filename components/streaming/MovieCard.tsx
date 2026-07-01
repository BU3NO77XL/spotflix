'use client';

import { useEffect, useState } from 'react';
import { Play, ChevronDown, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Movie } from '@/types/movie';
import NetflixBadge from './NetflixBadge';
import NewSeasonBadge from '@/components/ui/NewSeasonBadge';
import { checkIsOnNetflix } from '@/lib/netflixCache';
import { checkHasNewSeason } from '@/lib/newSeasonCache';

interface MovieCardProps {
    movie: Movie;
    onClick: (movie: Movie) => void;
    index?: number;
}

export default function MovieCard({ movie, onClick, index = 0 }: MovieCardProps) {
    const router = useRouter();
    const [isOnNetflix, setIsOnNetflix] = useState(false);
    const [hasNewSeason, setHasNewSeason] = useState(false);

    useEffect(() => {
        if (!movie.tmdb_id || movie.type !== 'series') return;
        let cancelled = false;
        checkHasNewSeason(movie.tmdb_id).then(result => {
            if (!cancelled) setHasNewSeason(result);
        });
        return () => { cancelled = true; };
    }, [movie.tmdb_id, movie.type]);

    useEffect(() => {
        if (!movie.tmdb_id) return;
        let cancelled = false;
        checkIsOnNetflix(movie.tmdb_id, movie.type).then(result => {
            if (!cancelled) setIsOnNetflix(result);
        });
        return () => { cancelled = true; };
    }, [movie.tmdb_id, movie.type]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            onClick={() => onClick(movie)}
            className="group relative shrink-0 w-[140px] sm:w-[150px] lg:w-[160px] cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(movie);
                }
            }}
            aria-label={`View details for ${movie.title}`}
        >
            {/* Poster Container */}
            <div className="relative aspect-2/3 rounded-sm sm:rounded-md overflow-hidden 
                    bg-[#1f1f1f] transition-all duration-300 
                    group-hover:z-10 
                    shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                {/* Image */}
                <img
                    src={movie.poster_url || undefined}
                    alt={`${movie.title} poster`}
                    className="w-full h-full object-cover transition-transform duration-700"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Netflix Badge */}
                {isOnNetflix && (
                    <div className="absolute top-2 left-2 z-10">
                        <NetflixBadge />
                    </div>
                )}

                {/* New Season Badge */}
                {hasNewSeason && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center z-10">
                        <NewSeasonBadge />
                    </div>
                )}

                {/* Hover Content - Netflix Style */}
                <div className={`absolute inset-0 p-2.5 sm:p-3 opacity-0 group-hover:opacity-100 
                      transition-all duration-300 flex flex-col justify-end z-20 ${hasNewSeason ? 'pb-5 sm:pb-6' : ''}`}>
                    
                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between mb-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!localStorage.getItem('userBasicInfo')) {
                                        window.dispatchEvent(new Event('requireLogin'));
                                        return;
                                    }
                                    const params = new URLSearchParams({ id: String(movie.tmdb_id), type: movie.type, ref: String(movie.tmdb_id) });
                                    if (movie.season_number) params.set('season', String(movie.season_number));
                                    if (movie.episode_number) params.set('episode', String(movie.episode_number));
                                    router.push(`/watch?${params}`);
                                }}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                                title="Assistir"
                            >
                                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black fill-current ml-0.5" />
                            </button>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick(movie);
                            }}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2a2a2a]/90 hover:bg-[#444] border border-white/40 text-white flex items-center justify-center transition-all hover:scale-110"
                            title="Mais informações"
                        >
                            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </button>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-200 font-medium translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75 flex-wrap">
                        {movie.score && (
                            <div className="flex items-center gap-1 text-yellow-400 font-bold">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span>{(movie.score / 2).toFixed(1)}</span>
                            </div>
                        )}
                        {movie.rating && (
                            <span className="px-1 py-0.2 border border-gray-400 rounded text-[10px] leading-tight font-semibold text-gray-300">
                                {movie.rating}
                            </span>
                        )}
                        <span className="border border-white/40 px-1 py-0.2 rounded text-[9px] font-bold text-gray-300">HD</span>
                    </div>

                    {/* Genres Row */}
                    {movie.genre && movie.genre.length > 0 && (
                        <div className="mt-1 text-[10px] sm:text-[11px] text-gray-300 truncate translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                            {movie.genre.slice(0, 2).join(' • ')}
                        </div>
                    )}
                </div>

                {/* Netflix Style Progress Bar for History items */}
                {(() => {
                    const sn = movie.season_number;
                    const en = movie.episode_number;
                    if (!sn || !en) return null;
                    const totalEp = movie.total_episodes || 0;
                    const totalSeasons = movie.total_seasons || 0;
                    const seasonEp = movie.season_episodes || 0;
                    const avgEp = totalEp && totalSeasons ? Math.ceil(totalEp / totalSeasons) : 0;
                    const lastSeason = sn >= totalSeasons;
                    const lastEp = seasonEp > 0 ? en >= seasonEp : (avgEp > 0 ? en >= avgEp : false);
                    const isComplete = lastSeason && lastEp;
                    const cumulativeEp = totalEp > 0 && avgEp > 0 ? (sn - 1) * avgEp + en : 0;
                    const pct = isComplete ? 100 : (totalEp > 0 && cumulativeEp > 0
                        ? Math.min(100, Math.max(10, Math.round((cumulativeEp / totalEp) * 100)))
                        : 60);
                    return (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 z-20 overflow-hidden">
                            <div className="h-full bg-[#E50914] transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                    );
                })()}
            </div>

            {/* Info permanente abaixo do poster (ano, registro e progresso de episódios) */}
            {(movie.year > 0 || (movie.season_number && movie.episode_number)) && (
                <div className="mt-1.5 px-0.5 flex items-center justify-between text-xs font-medium flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                        {movie.year > 0 && (
                            <span className="text-gray-400">{movie.year}</span>
                        )}
                        {movie.season_number && movie.episode_number && (
                            <span className="text-[#46d369] font-bold tracking-wide">
                                S{movie.season_number}:E{movie.episode_number}
                            </span>
                        )}
                    </div>
                    {(() => {
                        if (!movie.season_number || !movie.episode_number) return null;
                        const sn = movie.season_number;
                        const en = movie.episode_number;
                        const totalEp = movie.total_episodes || 0;
                        const totalSeasons = movie.total_seasons || 0;
                        const seasonEp = movie.season_episodes || 0;
                        const avgEp = totalEp && totalSeasons ? Math.ceil(totalEp / totalSeasons) : 0;
                        const lastSeason = sn >= totalSeasons;
                        const lastEp = seasonEp > 0 ? en >= seasonEp : (avgEp > 0 ? en >= avgEp : false);
                        const isComplete = lastSeason && lastEp;
                        const cumulativeEp = totalEp > 0 && avgEp > 0 ? (sn - 1) * avgEp + en : 0;
                        if (isComplete) {
                            return <span className="bg-[#46d369]/20 text-[#46d369] text-[10px] px-1.5 py-0.5 rounded font-bold">Completo</span>;
                        }
                        if (totalEp > 0 && cumulativeEp > 0) {
                            return <span className="text-gray-400 text-[10px]">Ep. {cumulativeEp}/{totalEp}</span>;
                        }
                        if (totalSeasons > 0) {
                            return <span className="text-gray-400 text-[10px]">T{sn}/{totalSeasons}</span>;
                        }
                        return null;
                    })()}
                </div>
            )}

            {/* Title (always visible) - DISABLED */}
            {/* <div className="mt-2 lg:mt-3">
                <h3 className="text-white text-xs sm:text-sm font-medium truncate group-hover:text-[#1DB954] 
                     transition-colors duration-200">
                    {movie.title}
                </h3>
                <p className="text-gray-500 text-xs truncate mt-0.5">
                    {movie.genre?.slice(0, 2).join(' • ')}
                </p>
            </div> */}
        </motion.div>
    );
}