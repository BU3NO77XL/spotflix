'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Movie } from '@/types/movie';

/**
 * Hook centralizado para navegar para /watch sem round-trip ao servidor.
 * 
 * ESTRATÉGIA:
 * - Se já estiver em /watch: usa localOverride (troca instantânea via state, zero latência)
 * - Se vier de fora (home, my-list): pré-popula cache + router.push (latência reduzida)
 * 
 * O localOverride elimina completamente o round-trip ao servidor em produção.
 */
export function useWatchNavigation(setLocalOverride?: (override: any) => void) {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();

    const navigateToWatch = useCallback((movie: Movie) => {
        try {
            console.log('[useWatchNavigation] navigateToWatch called with', { id: movie?.id, tmdb_id: movie?.tmdb_id, title: movie?.title, type: movie?.type });
        } catch (e) { /**/ }
        if (!movie?.tmdb_id) return;

        const type = movie.type || 'movie';
        const key = ['movie', 'tmdb', String(movie.tmdb_id), type];

        // 1. Pré-popular cache com dados que já temos (título, poster, etc.)
        queryClient.setQueryData(key, movie);

        // 2. Invalidar imediatamente para buscar dados completos em background
        //    (score real, duration, ageRating, backdrop_url)
        queryClient.invalidateQueries({ queryKey: key });

        // 3. Decidir estratégia de navegação baseado no contexto
        const isAlreadyOnWatchPage = pathname === '/watch';

        if (isAlreadyOnWatchPage && setLocalOverride) {
            // FAST PATH: já estamos em /watch, trocar via state local (zero servidor)
            setLocalOverride({
                tmdbId: String(movie.tmdb_id),
                mediaType: type,
                title: movie.title,
                poster_url: movie.poster_url,
                backdrop_url: movie.backdrop_url,
                year: movie.year
            });

            // Atualizar URL sem recarregar (para histórico do browser funcionar)
            const url = `/watch?ref=${movie.tmdb_id}&type=${type}`;
            try { console.log('[useWatchNavigation] FAST_PATH replaceState ->', url); } catch (e) { /**/ }
            window.history.replaceState(null, '', url);
        } else {
            // SLOW PATH: vindo de outra página, usar router.push (com cache já populado)
            const url = movie.id && !movie.id.startsWith('search-') && !movie.id.startsWith('tmdb-') && !movie.id.startsWith('similar-') && !movie.id.startsWith('creator-')
                ? `/watch?id=${movie.id}&ref=${movie.tmdb_id}&type=${type}`
                : `/watch?ref=${movie.tmdb_id}&type=${type}`;

            try { console.log('[useWatchNavigation] SLOW_PATH router.push ->', url); } catch (e) { /**/ }
            router.push(url);
        }
    }, [router, pathname, queryClient, setLocalOverride]);

    return { navigateToWatch };
}
