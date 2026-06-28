export const GENRE_NAME_TO_TMDB_ID: Record<string, number> = {
  'Ação': 28,
  'Aventura': 12,
  'Animação': 16,
  'Comédia': 35,
  'Crime': 80,
  'Documentário': 99,
  'Drama': 18,
  'Fantasia': 14,
  'Ficção Científica': 878,
  'Romance': 10749,
  'Terror': 27,
  'Suspense': 53,
};

export const TMDB_ID_TO_GENRE_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(GENRE_NAME_TO_TMDB_ID).map(([name, id]) => [id, name])
);
