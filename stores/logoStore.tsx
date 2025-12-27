'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Logo {
    file_path: string;
    file_type: string;
    width: number;
    height: number;
    iso_639_1: string | null;
}

interface PreloadedLogoData {
    logos: Logo[];
    logoImageLoaded: boolean;
}

interface LogoStoreContextType {
    // Armazena logos por tmdb_id
    preloadedLogos: Record<number, PreloadedLogoData>;
    // Armazena logos e inicia preload da imagem
    setLogosForMovie: (tmdbId: number, logos: Logo[]) => void;
    // Obtém logos pré-carregados
    getLogosForMovie: (tmdbId: number) => PreloadedLogoData | null;
    // Limpa logos antigos
    clearOldLogos: () => void;
}

const LogoStoreContext = createContext<LogoStoreContextType | null>(null);

export function LogoStoreProvider({ children }: { children: ReactNode }) {
    const [preloadedLogos, setPreloadedLogos] = useState<Record<number, PreloadedLogoData>>({});

    const setLogosForMovie = useCallback((tmdbId: number, logos: Logo[]) => {
        // Primeiro, salva os logos sem marcar como carregado
        setPreloadedLogos(prev => ({
            ...prev,
            [tmdbId]: { logos, logoImageLoaded: false }
        }));

        // Se não há logos, marca como pronto imediatamente
        if (logos.length === 0) {
            setPreloadedLogos(prev => ({
                ...prev,
                [tmdbId]: { logos, logoImageLoaded: true }
            }));
            return;
        }

        // Pré-carrega a imagem do primeiro logo
        const logoUrl = `https://image.tmdb.org/t/p/original${logos[0]?.file_path}`;
        const img = new Image();

        img.onload = () => {
            setPreloadedLogos(prev => ({
                ...prev,
                [tmdbId]: { logos, logoImageLoaded: true }
            }));
        };

        img.onerror = () => {
            // Se falhar, marca como pronto mas sem logos
            setPreloadedLogos(prev => ({
                ...prev,
                [tmdbId]: { logos: [], logoImageLoaded: true }
            }));
        };

        img.src = logoUrl;
    }, []);

    const getLogosForMovie = useCallback((tmdbId: number): PreloadedLogoData | null => {
        return preloadedLogos[tmdbId] || null;
    }, [preloadedLogos]);

    const clearOldLogos = useCallback(() => {
        // Mantém apenas os 10 logos mais recentes para economizar memória
        setPreloadedLogos(prev => {
            const entries = Object.entries(prev);
            if (entries.length <= 10) return prev;

            const toKeep = entries.slice(-10);
            return Object.fromEntries(toKeep);
        });
    }, []);

    return (
        <LogoStoreContext.Provider value={{ preloadedLogos, setLogosForMovie, getLogosForMovie, clearOldLogos }}>
            {children}
        </LogoStoreContext.Provider>
    );
}

export function useLogoStore() {
    const context = useContext(LogoStoreContext);
    if (!context) {
        throw new Error('useLogoStore must be used within LogoStoreProvider');
    }
    return context;
}
