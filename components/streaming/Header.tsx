'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, User, Menu, X, Play, Star, Film, Tv, Settings, CreditCard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import NetflixAvatar from '../NetflixAvatar';
import { TMDBService } from './TMDBIntegration';
import { Movie } from '@/types/movie';
import MovieModal from './MovieModal';
import SearchOverlay from './SearchOverlay';

const HEADER_ITEMS = [
    { label: 'Lar', href: '/' },
    { label: 'Série', href: '/?filter=series' },
    { label: 'Filmes', href: '/?filter=movie' },
    { label: 'Minha lista', href: '/my-list' },
];

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();

    if (pathname === '/login') return null;
    const [scrolled, setScrolled] = useState(false);
    const [activeFilter, setActiveFilter] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [demoName, setDemoName] = useState("User");

    // Efeito para gerar nome aleatório apenas no cliente (evita erro de hidratação)
    useEffect(() => {
        const names = ["Daniel", "Maria", "João", "Ana", "Lucas", "Beatriz", "Pedro", "Sofia", "Carlos", "Julia"];
        const randomName = names[Math.floor(Math.random() * names.length)] + Math.random().toString();
        setDemoName(randomName);
    }, []);

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

        history.pushState = function () {
            // @ts-ignore
            originalPushState.apply(this, arguments);
            requestAnimationFrame(updateFilter);
        };

        history.replaceState = function () {
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

    // Retorna ícone correspondente ao rótulo (minimalista, cinza)
    const renderIcon = (label: string) => {
        switch (label) {
            case 'Lar':
                return <Play className="w-5 h-5 text-gray-400" />;
            case 'Série':
                return <Tv className="w-5 h-5 text-gray-400" />;
            case 'Filmes':
                return <Film className="w-5 h-5 text-gray-400" />;
            case 'Minha lista':
                return <Star className="w-5 h-5 text-gray-400" />;
            default:
                return <Play className="w-5 h-5 text-gray-400" />;
        }
    };

    const renderUserIcon = (label: string) => {
        switch (label) {
            case 'Perfil':
                return <User className="w-4 h-4 text-gray-400" />;
            case 'Configurações':
                return <Settings className="w-4 h-4 text-gray-400" />;
            case 'Planos':
                return <CreditCard className="w-4 h-4 text-gray-400" />;
            case 'Sair':
                return <LogOut className="w-4 h-4 text-red-400" />;
            default:
                return <User className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                    mobileMenuOpen
                        ? "bg-[#0a0a0a]"
                        : scrolled
                            ? "bg-[#0a0a0a]/80 backdrop-blur-md"
                            : "bg-transparent"
                )}
                style={{ WebkitBackdropFilter: scrolled ? 'blur(8px)' : undefined, backdropFilter: scrolled ? 'blur(8px)' : undefined }}
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
                                onClick={() => {
                                    setSearchOpen(true);
                                    setMobileMenuOpen(false);
                                    setUserDropdownOpen(false);
                                }}
                                className="p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-full"
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            {/* User Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setUserDropdownOpen(!userDropdownOpen);
                                        setMobileMenuOpen(false);
                                        setSearchOpen(false);
                                    }}
                                    className={cn(
                                        "transition-colors duration-200",
                                        "flex items-center justify-center",
                                        true ? "rounded-md" : "p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"
                                    )}
                                >
                                    {/* SIMULAÇÃO: Usuário logado (true) com Nome Aleatório para Teste */}
                                    {true ? (
                                        <NetflixAvatar name={demoName} size={32} />
                                    ) : (
                                        <User className="w-5 h-5" />
                                    )}
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
                                                <button className="w-full px-4 py-2.5 text-left text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3" onClick={() => setUserDropdownOpen(false)}>
                                                    <span aria-hidden>{renderUserIcon('Perfil')}</span>
                                                    <span>Perfil</span>
                                                </button>
                                                <button className="w-full px-4 py-2.5 text-left text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3" onClick={() => setUserDropdownOpen(false)}>
                                                    <span aria-hidden>{renderUserIcon('Configurações')}</span>
                                                    <span>Configurações</span>
                                                </button>
                                                <button className="w-full px-4 py-2.5 text-left text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3" onClick={() => setUserDropdownOpen(false)}>
                                                    <span aria-hidden>{renderUserIcon('Planos')}</span>
                                                    <span>Planos</span>
                                                </button>
                                            </div>
                                            <div className="border-t border-white/10 py-2">
                                                <button
                                                    className="w-full px-4 py-2.5 text-left text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors flex items-center gap-3"
                                                    onClick={() => {
                                                        setUserDropdownOpen(false);
                                                        router.push('/login');
                                                    }}
                                                >
                                                    <span aria-hidden>{renderUserIcon('Sair')}</span>
                                                    <span>Sair</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => router.push('/login')}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black font-semibold text-sm rounded-full transition-colors"
                            >
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

            {/* Mobile Menu Dropdown (desce do header) */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="fixed top-16 lg:top-20 left-0 right-0 z-60"
                        >
                            <div className="bg-[#0a0a0a] border-b border-white/10 shadow-sm">
                                <nav className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12">
                                    <div className="flex flex-col py-2">
                                        {HEADER_ITEMS.map((link) => (
                                            <Link
                                                key={link.label}
                                                href={link.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/5 transition-colors font-medium"
                                            >
                                                <span aria-hidden>{renderIcon(link.label)}</span>
                                                <span>{link.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </nav>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Search Overlay (New) */}
            <SearchOverlay
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
            />

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
