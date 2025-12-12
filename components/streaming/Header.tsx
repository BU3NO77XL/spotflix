'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, User, Menu, X, Play, Star, Film, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TMDBService } from './TMDBIntegration';
import { Movie } from '@/types/movie';
import MovieModal from './MovieModal';

const HEADER_ITEMS = [
    { label: 'Lar', href: '/' },
    { label: 'Série', href: '/?filter=series' },
    { label: 'Filmes', href: '/?filter=movie' },
    { label: 'Minha lista', href: '/my-list' },
];

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [activeFilter, setActiveFilter] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Monitorar mudanças de rota para atualizar o filtro ativo
    useEffect(() => {
        const updateFilter = () => {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const filter = params.get('filter');
                setActiveFilter(filter || '');
            }
        };

        // Atualizar filtro imediatamente
        updateFilter();

        // Adicionar listener para mudanças de URL
        const handlePopState = () => {
            // Usar requestAnimationFrame para evitar atualizações durante renderização
            requestAnimationFrame(updateFilter);
        };
        
        window.addEventListener('popstate', handlePopState);
        
        // Monkey patch pushState e replaceState para detectar mudanças programáticas
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function() {
            // @ts-ignore
            originalPushState.apply(this, arguments);
            requestAnimationFrame(updateFilter);
        };
        
        history.replaceState = function() {
            // @ts-ignore
            originalReplaceState.apply(this, arguments);
            requestAnimationFrame(updateFilter);
        };

        return () => {
            window.removeEventListener('popstate', handlePopState);
            history.pushState = originalPushState;
            history.replaceState = originalReplaceState;
        };
    }, []);

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await TMDBService.search(searchQuery);
                setSearchResults(results.map((r, i) => ({ ...r, id: `search-${i}` })) as Movie[]);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleResultClick = useCallback((movie: Movie) => {
        setSelectedMovie(movie);
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedMovie(null);
    }, []);

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                    scrolled
                        ? "bg-[#0a0a0a]/90 backdrop-blur-md"
                        : "bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/40 to-transparent"
                )}
            >
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link href="/" className="shrink-0 flex items-center gap-2">
                            <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg bg-[#1DB954] flex items-center justify-center">
                                <Play className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white fill-white" />
                            </div>
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight">
                                <span className="text-white">
                                    Spot
                                </span>
                                <span className="text-[#1DB954]">Flix</span>
                            </h1>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                            {HEADER_ITEMS?.map((link) => {
                                // Determinar se o link está ativo
                                const isActive = 
                                    (link.href === '/' && pathname === '/' && !activeFilter) ||
                                    (link.href.includes('?filter=series') && activeFilter === 'series') ||
                                    (link.href.includes('?filter=movie') && activeFilter === 'movie') ||
                                    (link.href === '/my-list' && pathname === '/my-list');
                                
                                return (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className={cn(
                                            "px-3 lg:px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
                                            isActive 
                                                ? "text-white bg-white/10" // Estilo ativo (sem hover)
                                                : "text-gray-300 hover:scale-105" // Estilo normal com efeito de escala no hover
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right Section */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-full"
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            {/* User Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className="p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-full"
                                >
                                    <User className="w-5 h-5" />
                                </button>

                                {userDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setUserDropdownOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-40 overflow-hidden">
                                            <div className="p-4 border-b border-white/10">
                                                <p className="text-white font-semibold">Minha Conta</p>
                                                <p className="text-gray-400 text-sm">usuario@email.com</p>
                                            </div>
                                            <div className="py-2">
                                                <button className="w-full px-4 py-2.5 text-left text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                                    Perfil
                                                </button>
                                                <button className="w-full px-4 py-2.5 text-left text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                                    Configurações
                                                </button>
                                                <button className="w-full px-4 py-2.5 text-left text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                                    Planos
                                                </button>
                                            </div>
                                            <div className="border-t border-white/10 py-2">
                                                <button className="w-full px-4 py-2.5 text-left text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors">
                                                    Sair
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black font-semibold text-sm rounded-full transition-colors">
                                Entrar
                            </button>

                            {/* Mobile Menu Button */}
                            <button
                                className="md:hidden p-2 text-gray-300 hover:text-white"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

            </header>

            {/* Search Overlay */}
            <AnimatePresence>
                {searchOpen && (
                    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 sm:pt-24 px-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSearchOpen(false)}
                        />

                        {/* Search Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
                        >
                            {/* Input Area */}
                            <div className="flex items-center px-4 py-4 border-b border-white/5 gap-3">
                                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="O que você quer assistir?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                                    className="flex-1 bg-transparent text-lg text-white placeholder:text-gray-500 outline-none border-none focus:ring-0 p-0"
                                />
                                <button
                                    onClick={() => {
                                        setSearchOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
                                >
                                    <span className="text-xs font-medium px-1.5 py-0.5 border border-white/10 rounded hidden sm:inline-block mr-2">ESC</span>
                                    <X className="w-5 h-5 inline-block" />
                                </button>
                            </div>

                            {/* Results Area */}
                            <div className="flex-1 overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-8 flex items-center justify-center gap-3 text-gray-400">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                                        <span>Buscando...</span>
                                    </div>
                                ) : searchQuery ? (
                                    searchResults.length > 0 ? (
                                        <div className="py-2">
                                            {searchResults.map((movie) => (
                                                <button
                                                    key={movie.id}
                                                    onClick={() => handleResultClick(movie)}
                                                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors text-left group"
                                                >
                                                    <div className="w-12 h-16 rounded overflow-hidden bg-[#2a2a2a] shrink-0 shadow-lg group-hover:shadow-xl transition-all">
                                                        {movie.poster_url ? (
                                                            <img
                                                                src={movie.poster_url}
                                                                alt={movie.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Film className="w-5 h-5 text-gray-600" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-gray-200 group-hover:text-white font-medium truncate transition-colors">
                                                            {movie.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                                                            <span className="capitalize">{movie.type === 'series' ? 'Série' : 'Filme'}</span>
                                                            {movie.year && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{movie.year}</span>
                                                                </>
                                                            )}
                                                            {movie.score && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1 text-yellow-500/80">
                                                                        <Star className="w-3 h-3 fill-current" />
                                                                        {movie.score}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <p className="text-gray-500">
                                                Nenhum resultado para "{searchQuery}"
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="p-12 text-center">
                                        <Film className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                        <p className="text-gray-600 text-sm">
                                            Digite para buscar filmes e séries
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Movie Modal */}
            <MovieModal
                movie={selectedMovie}
                isOpen={!!selectedMovie}
                onClose={closeModal}
                onWatch={(movie) => {
                    closeModal();
                    router.push(`/watch?ref=${movie.tmdb_id}&type=${movie.type}`);
                }}
                onAddToList={() => { }}
            />
        </>
    );
}
