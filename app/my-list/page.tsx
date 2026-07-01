'use client';

import { useState, useEffect, useMemo } from 'react';

const emptyItems = { items: [] as { id: number; tmdb_id: number; title: string; media_type: string; poster_url?: string | null; backdrop_url?: string | null }[] };
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Movie } from '@/types/movie';
import { Tv, Film, Play, Star, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MyListHero from '@/components/streaming/MyListHero';
import { toast } from 'sonner';
import MovieModal from '@/components/streaming/MovieModal';
import LoginRequiredModal from '@/components/streaming/LoginRequiredModal';
import NetflixBadge from '@/components/streaming/NetflixBadge';
import NewSeasonBadge from '@/components/ui/NewSeasonBadge';
import { checkIsOnNetflix } from '@/lib/netflixCache';
import { checkHasNewSeason } from '@/lib/newSeasonCache';

export default function MyList() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'series' | 'movies'>('movies');
    const [userId, setUserId] = useState<number | null>(() => {
        try {
            if (typeof window === 'undefined') return null;
            const stored = localStorage.getItem('userBasicInfo');
            return stored ? JSON.parse(stored).id : null;
        } catch { return null; }
    });
    const [userName, setUserName] = useState(() => {
        try {
            if (typeof window === 'undefined') return '';
            const stored = localStorage.getItem('userBasicInfo');
            return stored ? JSON.parse(stored).name || '' : '';
        } catch { return ''; }
    });
    const [descIndex, setDescIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [netflixIds, setNetflixIds] = useState<Set<number>>(new Set());
    const [newSeasonIds, setNewSeasonIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        setDescIndex(Math.floor(Math.random() * 5));
    }, []);
    const [ratings, setRatings] = useState<Record<string, 'love' | 'like' | 'dislike'>>({});

    useEffect(() => {
        if (!userId) {
            router.replace('/');
            setTimeout(() => window.dispatchEvent(new Event('requireLogin')), 100);
        }
    }, [userId, router]);

    useEffect(() => {
        const handleRequireLogin = () => setLoginModalOpen(true);
        window.addEventListener('requireLogin', handleRequireLogin);
        return () => window.removeEventListener('requireLogin', handleRequireLogin);
    }, []);

    useEffect(() => {
        if (!userId) return;
        fetch(`/api/ratings?userId=${userId}`)
            .then(r => r.json())
            .then(data => setRatings(data.ratings || {}))
            .catch(() => {});
    }, [userId]);

    const { data: movies = [] } = useQuery({
        queryKey: ['movies'],
        queryFn: () => Promise.resolve<Movie[]>([]),
    });

    const { data: watchlistData = emptyItems } = useQuery({
        queryKey: ['watchlist', userId],
        queryFn: () => fetch(`/api/watchlist?userId=${userId}`).then(r => r.json()),
        enabled: !!userId,
    });

    const addToWatchlistMutation = useMutation({
        mutationFn: ({ tmdbId, mediaType, title, posterUrl, backdropUrl }: { tmdbId: number; mediaType: string; title: string; posterUrl?: string; backdropUrl?: string }) =>
            fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, tmdbId, mediaType, title, posterUrl, backdropUrl }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
            toast.success('Adicionado à lista');
        },
    });

    const removeFromWatchlistMutation = useMutation({
        mutationFn: ({ tmdbId, mediaType }: { tmdbId: number; mediaType: string }) =>
            fetch('/api/watchlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, tmdbId, mediaType }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
            toast.success('Removido da lista');
        },
    });

    const allItems: (Movie & { listItemId: string })[] = useMemo(() => [
        ...watchlistData.items.map((item: { id: number; tmdb_id: number; title: string; media_type: string; poster_url?: string | null; backdrop_url?: string | null }) => {
            const movie = movies.find((m: Movie) => Number(m.tmdb_id) === item.tmdb_id);
            if (movie) return { ...movie, listItemId: `api_${item.id}` };
            const normalizedType = item.media_type === 'tv' ? 'series' : item.media_type;
            return {
                id: `api_${item.id}`,
                tmdb_id: item.tmdb_id,
                title: item.title,
                type: (normalizedType === 'series' ? 'series' : 'movie') as 'movie' | 'series',
                year: new Date().getFullYear(),
                poster_url: item.poster_url || '',
                backdrop_url: item.backdrop_url || '',
                genre: [] as string[],
                listItemId: `api_${item.id}`,
            } as Movie & { listItemId: string };
        }) as (Movie & { listItemId: string })[],
    ], [movies, watchlistData.items]);

    const seriesList = useMemo(() => allItems.filter(m => m.type === 'series'), [allItems]);
    const movieList = useMemo(() => allItems.filter(m => m.type === 'movie'), [allItems]);

    useEffect(() => {
            try {
                console.log('[MY-LIST] seriesList (count:', seriesList.length + ')', seriesList.map(m => ({ id: m.id, tmdb_id: m.tmdb_id, title: m.title, listItemId: m.listItemId })));
            } catch (e) { /* ignore logging errors */ }
        }, [seriesList, activeTab]);

    useEffect(() => {
        if (seriesList.length === 0 && activeTab === 'series') {
            setActiveTab('movies');
        }
    }, [seriesList.length, activeTab]);

    const baseList = activeTab === 'series' ? seriesList : movieList;
    const currentList = useMemo(() => searchQuery
        ? baseList.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : baseList, [searchQuery, baseList]);
    const watchlistTmdbIds = new Set(watchlistData.items.map((item: { tmdb_id: number }) => item.tmdb_id));

    useEffect(() => {
        const items = currentList.map(m => ({ tmdbId: Number(m.tmdb_id), type: m.type }));
        if (items.length === 0) return;
        let cancelled = false;
        Promise.all(items.map(({ tmdbId, type }) =>
            checkIsOnNetflix(tmdbId, type).then(r => r ? tmdbId : null)
        )).then(results => {
            if (cancelled) return;
            const next = new Set(results.filter(Boolean) as number[]);
            if (next.size !== netflixIds.size || ![...next].every(id => netflixIds.has(id))) {
                setNetflixIds(next);
            }
        });
        return () => { cancelled = true; };
    }, [currentList, activeTab]);

    useEffect(() => {
        const seriesItems = currentList.filter(m => m.type === 'series').map(m => Number(m.tmdb_id));
        if (seriesItems.length === 0) return;
        let cancelled = false;
        Promise.all(seriesItems.map(tmdbId =>
            checkHasNewSeason(tmdbId).then(r => r ? tmdbId : null)
        )).then(results => {
            if (cancelled) return;
            const next = new Set(results.filter(Boolean) as number[]);
            if (next.size !== newSeasonIds.size || ![...next].every(id => newSeasonIds.has(id))) {
                setNewSeasonIds(next);
            }
        });
        return () => { cancelled = true; };
    }, [currentList, activeTab]);

    const handleWatch = (movie: Movie) => {
        if (!userId) {
            setLoginModalOpen(true);
            return;
        }
        try {
            const url = `/watch?id=${movie.tmdb_id}&type=${movie.type}&ref=${movie.tmdb_id}`;
            console.log('[MY-LIST] handleWatch navigating to', url, 'movie:', { id: movie.id, tmdb_id: movie.tmdb_id, title: movie.title, type: movie.type });
            router.push(url);
        } catch (e) {
            console.error('[MY-LIST] handleWatch error', e);
        }
        setTimeout(() => setModalOpen(false), 500);
    };

    const handleRemove = (listItemId: string, e: React.MouseEvent, item: Movie) => {
        e.stopPropagation();
        if (item.tmdb_id && item.type) {
            removeFromWatchlistMutation.mutate({ tmdbId: Number(item.tmdb_id), mediaType: item.type });
        }
    };

    return (
        <div className="min-h-screen bg-[#121212]">
            <MyListHero
                title={`Olá, ${userName || 'usuário'}!`}
                description={(() => {
                    const s = seriesList.length;
                    const m = movieList.length;
                    const seriesText = s === 1 ? '1 série' : `${s} séries`;
                    const movieText = m === 1 ? '1 filme' : `${m} filmes`;
                    const total = s + m;
                    const variants = [
                        `Aqui está sua lista personalizada — ${seriesText} e ${movieText} esperando por você. Bora maratonar? 🍿`,
                        `Você tem ${total > 1 ? `${total} títulos` : '1 título'} guardados: ${seriesText} e ${movieText}. Quando quiser assistir, é só clicar.`,
                        `Separamos tudo bonitinho: ${seriesText} e ${movieText} prontinhos pra você assistir. Aproveite!`,
                        `Sua estante pessoal tem ${seriesText} e ${movieText}. Relaxa, pega a pipoca e escolhe o que mais te der vontade.`,
                        `${seriesText} e ${movieText} — esse é o resumo da sua lista. Adicione mais sempre que encontrar algo interessante!`,
                    ];
                    return variants[descIndex];
                })()}
                backdrops={(() => {
                    const b = currentList.map((m) => m.backdrop_url).filter(Boolean) as string[];
                    if (b.length) return b;
                    return movies.map((m) => m.backdrop_url).filter(Boolean).slice(0, 8) as string[];
                })()}
            />

            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 pt-6 sm:pt-8 lg:pt-12 pb-8">
                {/* Tabs + Search */}
                <div className="flex items-center justify-between mb-6 -mt-12 sm:-mt-16 lg:-mt-20 relative z-30">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-1 inline-flex">
                        {seriesList.length > 0 && (
                            <button
                                onClick={() => setActiveTab('series')}
                                className={`rounded-lg px-6 py-2.5 font-medium transition-all flex items-center whitespace-nowrap ${activeTab === 'series'
                                    ? 'bg-[#1DB954] text-black'
                                    : 'text-gray-300 hover:text-white'
                                    }`}
                            >
                                <Tv className="w-4 h-4 mr-2" />
                                Séries ({seriesList.length})
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('movies')}
                            className={`rounded-lg px-6 py-2.5 font-medium transition-all flex items-center whitespace-nowrap ${activeTab === 'movies'
                                ? 'bg-[#1DB954] text-black'
                                : 'text-gray-300 hover:text-white'
                                }`}
                        >
                            <Film className="w-4 h-4 mr-2" />
                            Filmes ({movieList.length})
                        </button>
                    </div>

                    {baseList.length > 0 && (
                        <div className="relative ml-auto max-w-xs">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={`Buscar ${activeTab === 'series' ? 'série' : 'filme'}...`}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-[9px] pl-10 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                            </svg>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <AnimatePresence mode="popLayout">
                    {currentList.length > 0 ? (
                        <div className="relative rounded-lg overflow-hidden">
                            {/* Backdrop blur background */}
                            {(() => {
                                const backdrops = currentList.map(m => m.backdrop_url).filter(Boolean) as string[];
                                const bg = backdrops.slice(0, 3);
                                return bg.length > 0 ? (
                                    <div className="absolute inset-0 -z-10">
                                        <div className="absolute inset-0 flex">
                                            {bg.map((url, i) => (
                                                <div key={i} className="flex-1 relative overflow-hidden">
                                                    <img
                                                        src={url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-[#121212]/60" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="absolute inset-0 backdrop-blur-xl" />
                                        <div className="absolute inset-0 bg-[#121212]/40" />
                                    </div>
                                ) : null;
                            })()}
                            <div className="relative p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
                                {currentList.map((movie) => (
                                    <motion.div
                                        key={movie.listItemId}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        layout
                                        className="group relative cursor-pointer"
                                        onClick={() => {
                                            setSelectedMovie(movie);
                                            setModalOpen(true);
                                        }}
                                    >
                                        <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-[#1f1f1f] 
                                shadow-lg transition-all duration-500 
                                group-hover:shadow-2xl group-hover:scale-105">
                                            <img
                                                src={movie.poster_url}
                                                alt={movie.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />

                                            {/* Netflix Badge */}
                                            {netflixIds.has(Number(movie.tmdb_id)) && (
                                                <div className="absolute top-3 left-3 z-10">
                                                    <NetflixBadge />
                                                </div>
                                            )}

                                            {/* New Season Badge */}
                                            {movie.type === 'series' && newSeasonIds.has(Number(movie.tmdb_id)) && (
                                                <div className="absolute bottom-0 left-0 right-0 flex justify-center z-10">
                                                    <NewSeasonBadge />
                                                </div>
                                            )}

                                            {/* Play Button */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 
                                  group-hover:opacity-100 transition-opacity duration-300">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleWatch(movie);
                                                    }}
                                                    className="w-10 h-10 rounded-full bg-white hover:bg-gray-200 
                                 flex items-center justify-center transition-all duration-200"
                                                >
                                                    <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                                                </button>
                                            </div>

                                            {/* Netflix-style bottom buttons */}
                                            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 
                                  transition-opacity duration-300">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemove(movie.listItemId, e, movie);
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-[#2a2a2a]/80 hover:bg-[#444444] border border-white/60 
                                              flex items-center justify-center transition-all hover:scale-110"
                                                    >
                                                        {movie.listItemId.startsWith('api_') ? (
                                                            <Check className="w-4 h-4 text-white" />
                                                        ) : (
                                                            <Plus className="w-4 h-4 text-white" />
                                                        )}
                                                    </button>
                                                    {movie.tmdb_id && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const id = Number(movie.tmdb_id);
                                                                const current = ratings[String(id)];
                                                                const uid = userId;
                                                                if (!uid) return;
                                                                if (current) {
                                                                    setRatings(prev => { const n = { ...prev }; delete n[String(id)]; return n; });
                                                                    await fetch('/api/ratings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid, tmdbId: id, mediaType: movie.type }) });
                                                                } else {
                                                                    setRatings(prev => ({ ...prev, [String(id)]: 'like' }));
                                                                    await fetch('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid, tmdbId: id, mediaType: movie.type, value: 'like' }) });
                                                                }
                                                            }}
                                                            className={`w-8 h-8 rounded-full bg-[#2a2a2a]/80 hover:bg-[#444444] border border-white/60 
                                                  flex items-center justify-center transition-all hover:scale-110 ${ratings[String(movie.tmdb_id)] ? 'text-white' : 'text-white'}`}
                                                        >
                                                            {ratings[String(movie.tmdb_id)] ? (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M10.696 8.7732C10.8947 8.45534 11 8.08804 11 7.7132V4H11.8377C12.7152 4 13.4285 4.55292 13.6073 5.31126C13.8233 6.22758 14 7.22716 14 8C14 8.58478 13.8976 9.1919 13.7536 9.75039L13.4315 11H14.7219H17.5C18.3284 11 19 11.6716 19 12.5C19 12.5929 18.9917 12.6831 18.976 12.7699L18.8955 13.2149L19.1764 13.5692C19.3794 13.8252 19.5 14.1471 19.5 14.5C19.5 14.8529 19.3794 15.1748 19.1764 15.4308L18.8955 15.7851L18.976 16.2301C18.9917 16.317 19 16.4071 19 16.5C19 16.9901 18.766 17.4253 18.3994 17.7006L18 18.0006L18 18.5001C17.9999 19.3285 17.3284 20 16.5 20H14H13H12.6228C11.6554 20 10.6944 19.844 9.77673 19.5382L8.28366 19.0405C7.22457 18.6874 6.11617 18.5051 5 18.5001V13.7543L7.03558 13.1727C7.74927 12.9688 8.36203 12.5076 8.75542 11.8781L10.696 8.7732Z" />
                                                                </svg>
                                                            ) : (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path fillRule="evenodd" clipRule="evenodd" d="M10.696 8.7732C10.8947 8.45534 11 8.08804 11 7.7132V4H11.8377C12.7152 4 13.4285 4.55292 13.6073 5.31126C13.8233 6.22758 14 7.22716 14 8C14 8.58478 13.8976 9.1919 13.7536 9.75039L13.4315 11H14.7219H17.5C18.3284 11 19 11.6716 19 12.5C19 12.5929 18.9917 12.6831 18.976 12.7699L18.8955 13.2149L19.1764 13.5692C19.3794 13.8252 19.5 14.1471 19.5 14.5C19.5 14.8529 19.3794 15.1748 19.1764 15.4308L18.8955 15.7851L18.976 16.2301C18.9917 16.317 19 16.4071 19 16.5C19 16.9901 18.766 17.4253 18.3994 17.7006L18 18.0006L18 18.5001C17.9999 19.3285 17.3284 20 16.5 20H14H13H12.6228C11.6554 20 10.6944 19.844 9.77673 19.5382L8.28366 19.0405C7.22457 18.6874 6.11617 18.5051 5 18.5001V13.7543L7.03558 13.1727C7.74927 12.9688 8.36203 12.5076 8.75542 11.8781L10.696 8.7732ZM10.5 2C9.67157 2 9 2.67157 9 3.5V7.7132L7.05942 10.8181C6.92829 11.0279 6.72404 11.1817 6.48614 11.2497L4.45056 11.8313C3.59195 12.0766 3 12.8613 3 13.7543V18.5468C3 19.6255 3.87447 20.5 4.95319 20.5C5.87021 20.5 6.78124 20.6478 7.65121 20.9378L9.14427 21.4355C10.2659 21.8094 11.4405 22 12.6228 22H13H14H16.5C18.2692 22 19.7319 20.6873 19.967 18.9827C20.6039 18.3496 21 17.4709 21 16.5C21 16.4369 20.9983 16.3742 20.995 16.3118C21.3153 15.783 21.5 15.1622 21.5 14.5C21.5 13.8378 21.3153 13.217 20.995 12.6883C20.9983 12.6258 21 12.5631 21 12.5C21 10.567 19.433 9 17.5 9H15.9338C15.9752 8.6755 16 8.33974 16 8C16 6.98865 15.7788 5.80611 15.5539 4.85235C15.1401 3.09702 13.5428 2 11.8377 2H10.5Z" fill="currentColor" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div className="mt-3">
                                            <h3 className="text-white font-medium truncate group-hover:text-[#1DB954] transition-colors">
                                                {movie.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm truncate">
                                                {movie.genre?.slice(0, 2).join(' • ')}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            {searchQuery ? (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Nada encontrado</h3>
                                    <p className="text-gray-400 max-w-md mb-6">
                                        Nenhum{activeTab === 'series' ? 'a' : ''} {activeTab === 'series' ? 'série' : 'filme'} com "<strong className="text-white/80">{searchQuery}</strong>" na sua lista.
                                    </p>
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg px-8 py-3 transition-all"
                                    >
                                        Limpar busca
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        {activeTab === 'series' ? (
                                            <Tv className="w-10 h-10 text-gray-500" />
                                        ) : (
                                            <Film className="w-10 h-10 text-gray-500" />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        {activeTab === 'series' ? 'Nenhuma série salva' : 'Nenhum filme salvo'}
                                    </h3>
                                    <p className="text-gray-400 max-w-md mb-6">
                                        {activeTab === 'series'
                                            ? 'Adicione séries à sua lista para não perder nenhum episódio.'
                                            : 'Adicione filmes à sua lista para assistir quando quiser.'}
                                    </p>
                                    <button
                                        onClick={() => router.push('/')}
                                        className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-lg px-8 py-3"
                                    >
                                        Browse Content
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Movie Modal */}
            <MovieModal
                movie={selectedMovie}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onWatch={handleWatch}
                onAddToList={(movie) => {
                    if (movie.tmdb_id && movie.type && movie.title) {
                        addToWatchlistMutation.mutate({
                            tmdbId: Number(movie.tmdb_id),
                            mediaType: movie.type,
                            title: movie.title,
                            posterUrl: movie.poster_url || '',
                            backdropUrl: movie.backdrop_url || '',
                        });
                    }
                }}
                isInWatchlist={selectedMovie?.tmdb_id ? watchlistTmdbIds.has(Number(selectedMovie.tmdb_id)) : false}
                onRemoveFromList={(movie) => {
                    if (movie.tmdb_id && movie.type) removeFromWatchlistMutation.mutate({ tmdbId: Number(movie.tmdb_id), mediaType: movie.type });
                }}
            />

            {/* Login Modal */}
            <LoginRequiredModal
                isOpen={loginModalOpen}
                onClose={() => {
                    setLoginModalOpen(false);
                    if (!userId) {
                        router.push('/');
                    }
                }}
            />
        </div>
    );
}
