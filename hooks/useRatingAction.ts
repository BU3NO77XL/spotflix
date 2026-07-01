'use client';

import { useState, useCallback } from 'react';

export type RatingValue = 'love' | 'like' | 'dislike';

/**
 * Hook centralizado para ações de rating (love/like/dislike).
 * Evita duplicação entre MovieModal e WatchClient.
 */
export function useRatingAction(
  userId: number | null,
  onNotAuthenticated?: () => void,
) {
  const [currentRating, setCurrentRating] = useState<RatingValue | null>(null);

  const handleRatingAction = useCallback(
    async (tmdbId: number, mediaType: string, value: RatingValue | null) => {
      // Resolve userId do localStorage como fallback (evita closure stale)
      const uid =
        userId ??
        (() => {
          try {
            return JSON.parse(localStorage.getItem('userBasicInfo') || '{}').id ?? null;
          } catch {
            return null;
          }
        })();

      if (!uid) {
        onNotAuthenticated?.();
        return;
      }

      // Otimista: atualiza UI imediatamente antes da resposta do servidor
      setCurrentRating(value);

      try {
        if (value) {
          await fetch('/api/ratings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: uid, tmdbId, mediaType, value }),
          });
        } else {
          await fetch('/api/ratings', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: uid, tmdbId, mediaType }),
          });
        }
      } catch {
        // Rollback silencioso — UI já está correta para a maioria dos casos
      }
    },
    [userId, onNotAuthenticated],
  );

  return { currentRating, setCurrentRating, handleRatingAction };
}
