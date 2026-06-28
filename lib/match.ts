export type RatingValue = 'love' | 'like' | 'dislike';

export function calcMatch(
  tmdbScore: number | undefined,
  genres: string[],
  currentRating: RatingValue | null,
  favoriteGenres: string[],
): number {
  if (currentRating === 'love') return 97;
  if (currentRating === 'like') return 85;
  if (currentRating === 'dislike') return 15;

  const base = tmdbScore != null ? Math.round(tmdbScore * 10) : 70;
  let bonus = 0;
  if (favoriteGenres.length > 0 && genres.length > 0) {
    const matches = genres.filter(g => favoriteGenres.includes(g)).length;
    bonus = Math.round((matches / Math.max(genres.length, 1)) * 20);
  }
  return Math.min(99, Math.max(1, base + bonus));
}
