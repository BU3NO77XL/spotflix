'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Movie } from '@/types/movie';

/**
 * Hook centralizado para navegar para /watch sem round-trip ao servidor.
 * - Pré-popula o cache React Query com os dados que já temos
 * - Invalida para forçar revalidação em background (score, duration, etc.)
 * - Usa router.push apenas para atualizar a URL no histórico do browser
 */
export function useWatchNavigation() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const navigateToWatch = useCallback((movie: Movie) => {
        if (!movie?.tmdb_id) return;

        const type = movie.type || 'movie';
        const key = ['movie', 'tmdb', String(movie.tmdb_id), type];

        // 1. Pré-popular cache com dados que já temos (título, poster, etc.)
        queryClient.setQueryData(key, movie);

        // 2. Invalidar imediatamente para buscar dados completos em background
        //    (score real, duration, ageRating, backdrop_url)
        queryClient.invalidateQueries({ queryKey: key });

        // 3. Navegar — com cache pré-populado, isLoading=false instantaneamente
        const url = movie.id && !movie.id.startsWith('search-') && !movie.id.startsWith('tmdb-') && !movie.id.startsWith('similar-') && !movie.id.startsWith('creator-')
            ? `/watch?id=${movie.id}&ref=${movie.tmdb_id}&type=${type}`
            : `/watch?ref=${movie.tmdb_id}&type=${type}`;

        router.push(url);
    }, [router, queryClient]);

    return { navigateToWatch };
}
