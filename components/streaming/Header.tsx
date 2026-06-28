'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, User, Menu, X, Play, Star, Film, Tv, Settings, CreditCard, LogOut, Home, Flame, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import NetflixAvatar from '../NetflixAvatar';
import { TMDBService } from './TMDBIntegration';
import { Movie } from '@/types/movie';
import MovieModal from './MovieModal';
import SearchOverlay from './SearchOverlay';
import InstallButton from './InstallButton';

const HEADER_ITEMS = [
    { label: 'Início', href: '/' },
    { label: 'Séries', href: '/?filter=series' },
    { label: 'Filmes', href: '/?filter=movie' },
    { label: 'Novidades', href: '/' },
    { label: 'Minha Lista', href: '/my-list' },
    { label: 'Idiomas', href: '/' },
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
    const [userData, setUserData] = useState<{ name: string; email: string; avatarUrl?: string | null } | null>(null);

    useEffect(() => {
      const stored = localStorage.getItem('userBasicInfo');
      if (stored) {
        try {
          setUserData(JSON.parse(stored));
        } catch {}
      }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const updateFilter = () => {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const filter = params.get('filter');
                setActiveFilter(filter || '');
            }
        };

        updateFilter();

        const handlePopState = () => {
            requestAnimationFrame(updateFilter);
        };

        window.addEventListener('popstate', handlePopState);

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

    const closeModal = useCallback(() => {
        setSelectedMovie(null);
    }, []);

    const renderIcon = (label: string) => {
        switch (label) {
            case 'Início':
                return <Home className="w-5 h-5 text-gray-400" />;
            case 'Séries':
                return <Tv className="w-5 h-5 text-gray-400" />;
            case 'Filmes':
                return <Film className="w-5 h-5 text-gray-400" />;
            case 'Novidades':
                return <Flame className="w-5 h-5 text-gray-400" />;
            case 'Minha Lista':
                return <Star className="w-5 h-5 text-gray-400" />;
            case 'Idiomas':
                return <Globe className="w-5 h-5 text-gray-400" />;
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
                    "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
                    mobileMenuOpen || scrolled
                        ? "bg-[#141414]"
                        : "bg-transparent"
                )}
            >
                {/* Header Gradient matching rdesign */}
                <div 
                    className={cn(
                        "absolute inset-0 transition-opacity duration-300",
                        scrolled ? "opacity-0" : "opacity-100"
                    )}
                    style={{
                        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.7) 12.5%, rgba(0, 0, 0, 0) 100%)',
                        height: '68px'
                    }}
                />

                <div className="w-full px-4 md:px-[38px] relative z-10">
                    <div className="flex items-center justify-between h-[68px]">
                        <div className="flex items-center gap-[45px]">
                            {/* Logo matching rdesign dimensions */}
                            <Link href="/" className="shrink-0 flex items-center gap-1">
                                <h1 className="text-2xl font-black tracking-tighter uppercase text-white flex items-center gap-1">
                                    <div className="w-[28px] h-[28px] md:w-[25px] md:h-[25px] rounded-sm bg-[#1DB954] flex items-center justify-center">
                                        <Play className="w-[16px] h-[16px] md:w-[14px] md:h-[14px] text-white fill-white" />
                                    </div>
                                    <span className="text-[22px] md:text-[22px] tracking-tight font-bold">WEBFLIX</span>
                                </h1>
                            </Link>

                            {/* Desktop Navigation */}
                            <nav className="hidden md:flex items-center gap-[20px] pt-[4px]">
                                {HEADER_ITEMS?.map((link) => {
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
                                                "text-[14px] transition-colors duration-200 whitespace-nowrap",
                                                isActive
                                                    ? "text-white font-medium"
                                                    : "text-[#e5e5e5] hover:text-[#b3b3b3] font-normal"
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-5">
                            <div className="hidden lg:flex items-center">
                                <InstallButton />
                            </div>

                            <button
                                onClick={() => setSearchOpen(true)}
                                className="p-1 text-white hover:opacity-80 transition-opacity"
                                aria-label="Open search"
                            >
                                <Search className="w-6 h-6 md:w-5 md:h-5" />
                            </button>

                            {/* User Dropdown */}
                            <div className="relative flex items-center gap-2">
                                {userData ? (
                                    <>
                                    <button
                                        onClick={() => {
                                            setUserDropdownOpen(!userDropdownOpen);
                                            setMobileMenuOpen(false);
                                            setSearchOpen(false);
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <NetflixAvatar name={userData?.name || 'User'} size={36} />
                                        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white mt-1" />
                                    </button>

                                    {userDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-30"
                                                onClick={() => setUserDropdownOpen(false)}
                                            />
                                            <div className="absolute right-0 top-[40px] w-56 bg-black/90 border border-white/10 rounded shadow-2xl z-40 overflow-hidden backdrop-blur-md">
                                                <div className="p-4 border-b border-white/10">
                                                    <p className="text-white font-semibold">Minha Conta</p>
                                                    <p className="text-gray-400 text-sm">{userData?.email || 'usuario@email.com'}</p>
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
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="bg-white text-black font-semibold px-5 py-1.5 rounded-md text-sm hover:bg-white/90 transition-colors"
                                    >
                                        Fazer login
                                    </Link>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                className="md:hidden p-2 text-white"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            >
                                {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                            </button>
                        </div>
                    </div>
                </div>

            </header>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="fixed top-[68px] left-0 right-0 z-60"
                        >
                            <div className="bg-[#141414] border-b border-white/10 shadow-xl">
                                <nav className="w-full px-4 md:px-[38px]">
                                    <div className="flex flex-col py-4">
                                        {HEADER_ITEMS.map((link) => (
                                            <Link
                                                key={link.label}
                                                href={link.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="flex items-center gap-4 px-4 py-4 rounded text-white hover:bg-white/5 transition-colors font-medium text-lg"
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

            <SearchOverlay
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
            />

            <MovieModal
                movie={selectedMovie}
                isOpen={!!selectedMovie}
                onClose={closeModal}
                onWatch={(movie) => {
                    router.push(`/watch?id=${movie.id}&ref=${movie.tmdb_id}&type=${movie.type}`);
                    setTimeout(() => closeModal(), 500);
                }}
                onAddToList={() => { }}
            />
        </>
    );
}
