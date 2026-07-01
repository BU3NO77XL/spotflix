'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Film, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TMDBService } from './TMDBIntegration';
import { Movie } from '@/types/movie';
import { useWatchNavigation } from '@/hooks/useWatchNavigation';
import LoginRequiredModal from './LoginRequiredModal';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'all' | 'series' | 'movie';

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [userId, setUserId] = useState<number | null>(() => {
        try { if (typeof window === 'undefined') return null; const s = localStorage.getItem('userBasicInfo'); return s ? JSON.parse(s).id : null; } catch { return null; }
    });
    const { navigateToWatch } = useWatchNavigation();

    useEffect(() => {
        try { const s = localStorage.getItem('userBasicInfo'); setUserId(s ? JSON.parse(s).id : null); } catch { setUserId(null); }
    }, []);

    // Cache removido — resultados da pesquisa vêm diretamente da TMDB
    const localMovies: Movie[] = [];

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setQuery('');
            setResults([]);
            setActiveTab('all');
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Search logic with debounce
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await TMDBService.search(query);
                // Tentar fazer match com filmes locais para ter IDs locais
                const enhancedResults = data.map((searchResult, i) => {
                    const localMatch = localMovies.find(local =>
                        local.tmdb_id === searchResult.tmdb_id
                    );

                    if (localMatch) {
                        return { ...localMatch, id: String(localMatch.id), type: searchResult.type };
                    }
                    return { ...searchResult, id: `search-${i}` };
                }) as Movie[];

                setResults(enhancedResults);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    // Filter results based on active tab
    const filteredResults = results.filter(item => {
        if (activeTab === 'all') return true;
        return item.type === activeTab;
    });

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-100 bg-[#121212]/75 backdrop-blur-md flex flex-col overflow-hidden"
                >
                    {/* Top Bar with Close Button */}
                    <div className="flex justify-end p-6 lg:p-10 shrink-0">
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-300 group"
                        >
                            <X className="w-8 h-8 lg:w-10 lg:h-10 stroke-1 group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                    </div>

                    {/* Main Content Container */}
                    <div className="flex-1 overflow-hidden px-4 sm:px-6 lg:px-20 pb-10">
                        <div className="max-w-4xl mx-auto h-full flex flex-col">

                            {/* Search Input Section */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                                className="w-full relative mb-10 shrink-0"
                            >
                                <div className="relative group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 lg:w-6 lg:h-6 text-gray-500 group-focus-within:text-[#1DB954] transition-colors duration-300" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Pesquisar..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
                                        className="w-full bg-white/3 border border-white/5 rounded-2xl text-xl lg:text-2xl font-light text-white placeholder:text-gray-600 py-4 lg:py-5 pl-14 lg:pl-16 pr-5 outline-none transition-all duration-300 focus:bg-white/5 focus:border-white/10 placeholder:font-light"
                                    />
                                    {query && (
                                        <button
                                            onClick={() => setQuery('')}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>

                            {/* Tabs / Filters */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                                className="flex items-center gap-8 mb-8 shrink-0"
                            >
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={cn(
                                        "text-base lg:text-lg font-light transition-all duration-300 relative pb-1 tracking-wide",
                                        activeTab === 'all' ? "text-[#1DB954]" : "text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    Todos
                                    {activeTab === 'all' && (
                                        <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#1DB954]" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('series')}
                                    className={cn(
                                        "text-base lg:text-lg font-light transition-all duration-300 relative pb-1 tracking-wide",
                                        activeTab === 'series' ? "text-[#1DB954]" : "text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    Séries
                                    {activeTab === 'series' && (
                                        <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#1DB954]" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('movie')}
                                    className={cn(
                                        "text-base lg:text-lg font-light transition-all duration-300 relative pb-1 tracking-wide",
                                        activeTab === 'movie' ? "text-[#1DB954]" : "text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    Filmes
                                    {activeTab === 'movie' && (
                                        <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#1DB954]" />
                                    )}
                                </button>
                            </motion.div>

                            {/* Results List Area */}
                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                {isSearching ? (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : query ? (
                                    filteredResults.length > 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col space-y-2 lg:space-y-4"
                                        >
                                            {filteredResults.map((movie, index) => (
                                                    <div
                                                        key={movie.id || index}
                                                        onClick={() => {
                                                            console.log('[SEARCH_NAV] Clicou no resultado:', { id: movie.id, tmdb_id: movie.tmdb_id, title: movie.title, type: movie.type, year: movie.year, poster: movie.poster_url });
                                                            handleClose();
                                                            if (!userId) {
                                                                setLoginModalOpen(true);
                                                                return;
                                                            }
                                                            navigateToWatch(movie);
                                                        }}
                                                        className="group flex items-center gap-4 lg:gap-6 py-3 lg:py-4 px-3 lg:px-4 hover:bg-white/4 transition-all duration-300 cursor-pointer"
                                                    >
                                                        {/* Poster thumbnail */}
                                                        <div className="w-14 h-20 lg:w-20 lg:h-28 shrink-0 relative overflow-hidden bg-white/5 ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                                                            {movie.poster_url ? (
                                                                <img
                                                                    src={movie.poster_url}
                                                                    alt={movie.title}
                                                                    className="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 transition-all duration-500"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Film className="w-6 h-6 text-gray-700 stroke-1" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Info Section */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <h3 className="text-lg lg:text-2xl font-light text-white truncate group-hover:text-[#1DB954] transition-colors">
                                                                    {movie.title}
                                                                </h3>
                                                                <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all stroke-1 shrink-0" />
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1.5 text-xs lg:text-sm text-gray-500 font-light">
                                                                <span className="text-[#46d369] font-medium">
                                                                    {(movie.score ?? 0) > 0 ? `${((movie.score || 0) * 10).toFixed(0)}% Relevância` : 'Novo'}
                                                                </span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                                                <span>{movie.year}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                                                <span className="uppercase text-[10px] tracking-wider border border-gray-700 px-1 rounded-sm">HD</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-20"
                                        >
                                            <p className="text-xl text-white font-light mb-2">
                                                Nenhum resultado para "{query}"
                                            </p>
                                            <p className="text-gray-600 font-extralight">
                                                Tente buscar por outro termo.
                                            </p>
                                        </motion.div>
                                    )
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-20 opacity-30"
                                    >
                                        <Search className="w-16 h-16 text-gray-600 mb-6 stroke-1" />
                                        <p className="text-gray-500 font-light tracking-wide">
                                            Filmes, Séries e mais
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <LoginRequiredModal
            isOpen={loginModalOpen}
            onClose={() => setLoginModalOpen(false)}
        />
    </>);
}
