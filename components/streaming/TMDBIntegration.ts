import { Movie, CastMember } from '@/types/movie';
import { TMDB_ID_TO_GENRE_NAME } from '@/lib/genre-map';

const isServer = typeof window === 'undefined';
const TMDB_API_KEY = isServer ? (process.env.TMDB_API_KEY || '') : '';
const TMDB_BASE_URL = isServer ? 'https://api.themoviedb.org/3' : '/api/content';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Warn if API key is missing (apenas no servidor)
if (isServer) {
    if (!TMDB_API_KEY) {
        console.error('❌ TMDB API key not found. Please set TMDB_API_KEY in your .env file.');
    } else {
        // console.log('✅ TMDB API key loaded:', TMDB_API_KEY.substring(0, 8) + '...');
    }
}

// Helper: monta URL de fetch garantindo que a api_key é incluída no servidor
function tmdbUrl(path: string, extraParams: Record<string, string> = {}): string {
    const base = `${TMDB_BASE_URL}${path}`;
    const params = new URLSearchParams(extraParams);
    if (isServer && TMDB_API_KEY) {
        params.set('api_key', TMDB_API_KEY);
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
}

export const TMDBService = {
    // Retorna pagina rotativa (1-5) para carrosséis, mudando a cada 3 dias
    getCarouselPage(): number {
        const EPOCH = new Date('2025-01-01').getTime();
        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
        const elapsed = Date.now() - EPOCH;
        const period = Math.floor(elapsed / THREE_DAYS);
        return (period % 5) + 1;
    },

    // Search movies and TV shows
    async search(query: string): Promise<Omit<Movie, 'id'>[]> {
        if (!query.trim()) return [];
        try {
            const response = await fetch(
                tmdbUrl('/search/multi', { query: encodeURIComponent(query), include_adult: 'false', language: 'pt-BR' }),
                { next: { revalidate: 600 } }
            );

            if (!response.ok) {
                console.warn(`Error searching: ${response.status}`);
                return [];
            }

            const data = await response.json();
            // Filtrar apenas filmes e séries (excluir pessoas)
            const filtered = data.results?.filter((item: { media_type: string }) =>
                item.media_type === 'movie' || item.media_type === 'tv'
            ).slice(0, 10) || [];
            return this.transformTMDBData(filtered, 'trending');
        } catch (error) {
            console.error('Error searching:', error);
            return [];
        }
    },

    // Fetch trending content (weekly)
    async fetchTrending(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                tmdbUrl('/trending/all/week', { language: 'pt-BR' }),
                { next: { revalidate: 3600 } }
            );
            if (!response.ok) { console.warn(`Error fetching trending content: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'trending');
        } catch (error) { console.error('Error fetching trending:', error); return []; }
    },

    // Fetch trending content for today (daily) - para o hero
    async fetchTrendingToday(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                tmdbUrl('/trending/all/day', { language: 'pt-BR' }),
                { next: { revalidate: 1800 } }
            );
            if (!response.ok) { console.warn(`Error fetching daily trending content: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 20) || [], 'trending_today');
        } catch (error) { console.error('Error fetching daily trending:', error); return []; }
    },

    // Fetch top rated movies
    async fetchTopRatedMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const page = String(this.getCarouselPage());
            const response = await fetch(tmdbUrl('/movie/top_rated', { page, language: 'pt-BR' }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching top rated movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'top_rated', 'movie');
        } catch (error) { console.error('Error fetching top rated movies:', error); return []; }
    },

    // Fetch upcoming movies (coming soon to theaters)
    async fetchUpcoming(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const page = String(this.getCarouselPage());
            const response = await fetch(tmdbUrl('/movie/upcoming', { page, language: 'pt-BR' }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching upcoming movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'coming_soon', 'movie');
        } catch (error) { console.error('Error fetching upcoming:', error); return []; }
    },

    // Fetch top 10 from trending/all/week (conteudo mais variado)
    async fetchTop10(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                tmdbUrl('/trending/all/week', { language: 'pt-BR' }),
                { next: { revalidate: 3600 } }
            );
            if (!response.ok) { console.warn(`Error fetching top 10: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 20) || [], 'top_10');
        } catch (error) { console.error('Error fetching top 10:', error); return []; }
    },

    // Fetch recommended content
    async fetchRecommended(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const page = String(this.getCarouselPage());
            const response = await fetch(tmdbUrl('/movie/popular', { page, language: 'pt-BR' }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching recommended movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'recommended');
        } catch (error) { console.error('Error fetching recommended:', error); return []; }
    },

    // Fetch action movies (qualidade: votos >= 200, nota >= 6)
    async fetchActionMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(tmdbUrl('/discover/movie', {
                with_genres: '28',
                sort_by: 'vote_average.desc',
                'vote_count.gte': '200',
                'vote_average.gte': '6',
                language: 'pt-BR'
            }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching action movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'action', 'movie');
        } catch (error) { console.error('Error fetching action:', error); return []; }
    },

    // Fetch family movies
    async fetchFamilyMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(tmdbUrl('/discover/movie', {
                with_genres: '10751',
                sort_by: 'vote_average.desc',
                'vote_count.gte': '200',
                'vote_average.gte': '6',
                language: 'pt-BR'
            }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching family movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'family', 'movie');
        } catch (error) { console.error('Error fetching family:', error); return []; }
    },

    // Fetch sci-fi movies
    async fetchSciFiMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(tmdbUrl('/discover/movie', {
                with_genres: '878',
                sort_by: 'vote_average.desc',
                'vote_count.gte': '200',
                'vote_average.gte': '6',
                language: 'pt-BR'
            }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching sci-fi movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'scifi', 'movie');
        } catch (error) { console.error('Error fetching sci-fi:', error); return []; }
    },

    // Fetch comedy movies
    async fetchComedyMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(tmdbUrl('/discover/movie', {
                with_genres: '35',
                sort_by: 'vote_average.desc',
                'vote_count.gte': '200',
                'vote_average.gte': '6',
                language: 'pt-BR'
            }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching comedy movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'comedy', 'movie');
        } catch (error) { console.error('Error fetching comedy:', error); return []; }
    },

    // Fetch romance movies
    async fetchRomanceMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(tmdbUrl('/discover/movie', {
                with_genres: '10749',
                sort_by: 'vote_average.desc',
                'vote_count.gte': '200',
                'vote_average.gte': '6',
                language: 'pt-BR'
            }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching romance movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'romance', 'movie');
        } catch (error) { console.error('Error fetching romance:', error); return []; }
    },

    // Fetch horror movies
    async fetchHorrorMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(tmdbUrl('/discover/movie', {
                with_genres: '27',
                sort_by: 'vote_average.desc',
                'vote_count.gte': '200',
                'vote_average.gte': '6',
                language: 'pt-BR'
            }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching horror movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'horror', 'movie');
        } catch (error) { console.error('Error fetching horror:', error); return []; }
    },

    // Fetch animation movies
    async fetchAnimationMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(tmdbUrl('/discover/movie', {
                with_genres: '16',
                sort_by: 'vote_average.desc',
                'vote_count.gte': '200',
                'vote_average.gte': '6',
                language: 'pt-BR'
            }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching animation movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'animation', 'movie');
        } catch (error) { console.error('Error fetching animation:', error); return []; }
    },

    // Fetch popular series
    async fetchPopularSeries(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const page = String(this.getCarouselPage());
            const response = await fetch(tmdbUrl('/tv/popular', { page, language: 'pt-BR' }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching popular series: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'series_popular', 'series');
        } catch (error) { console.error('Error fetching popular series:', error); return []; }
    },

    // Fetch top rated series
    async fetchTopRatedSeries(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const page = String(this.getCarouselPage());
            const response = await fetch(tmdbUrl('/tv/top_rated', { page, language: 'pt-BR' }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching top rated series: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'series_top_rated', 'series');
        } catch (error) { console.error('Error fetching top rated series:', error); return []; }
    },

    // Fetch trending series
    async fetchTrendingSeries(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                tmdbUrl('/trending/tv/week', { language: 'pt-BR' }),
                { next: { revalidate: 3600 } }
            );
            if (!response.ok) { console.warn(`Error fetching trending series: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 24) || [], 'series_trending', 'series');
        } catch (error) { console.error('Error fetching trending series:', error); return []; }
    },

    // Fetch movies and series by genre IDs (Para Você - mistura filmes + séries)
    async fetchByGenreIds(genreIds: number[]): Promise<Omit<Movie, 'id'>[]> {
        if (!genreIds.length) return [];
        try {
            const results = await Promise.all(
                genreIds.flatMap((id) => [
                    fetch(
                        tmdbUrl('/discover/movie', {
                            with_genres: String(id),
                            sort_by: 'vote_average.desc',
                            'vote_count.gte': '200',
                            'vote_average.gte': '6',
                            language: 'pt-BR'
                        }),
                        { next: { revalidate: 3600 } }
                    ).then(async (r) => {
                        if (!r.ok) return [];
                        const d = await r.json();
                        return this.transformTMDBData(d.results?.slice(0, 16) || [], 'personalized', 'movie');
                    }).catch(() => [] as Omit<Movie, 'id'>[]),
                    fetch(
                        tmdbUrl('/discover/tv', {
                            with_genres: String(id),
                            sort_by: 'vote_average.desc',
                            'vote_count.gte': '200',
                            'vote_average.gte': '6',
                            language: 'pt-BR'
                        }),
                        { next: { revalidate: 3600 } }
                    ).then(async (r) => {
                        if (!r.ok) return [];
                        const d = await r.json();
                        return this.transformTMDBData(d.results?.slice(0, 16) || [], 'personalized', 'series');
                    }).catch(() => [] as Omit<Movie, 'id'>[])
                ])
            );
            const seen = new Set<string>();
            const merged = results.flat().filter((m) => {
                if (seen.has(m.title)) return false;
                seen.add(m.title);
                return true;
            });
            // Embaralha para misturar os gêneros
            for (let i = merged.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [merged[i], merged[j]] = [merged[j], merged[i]];
            }
            return merged;
        } catch (error) { console.error('Error fetching by genre:', error); return []; }
    },

    // Fetch critically acclaimed
    async fetchCriticsMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(tmdbUrl('/movie/top_rated', { page: '2', language: 'pt-BR' }), { next: { revalidate: 3600 } });
            if (!response.ok) { console.warn(`Error fetching critics picks movies: ${response.status}`); return []; }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'critics', 'movie');
        } catch (error) { console.error('Error fetching critics picks:', error); return []; }
    },

    // Fetch similar movies
    async fetchSimilar(movieId: number, isSeries: boolean = false): Promise<Omit<Movie, 'id'>[]> {
        try {
            const path = isSeries ? `/tv/${movieId}/recommendations` : `/movie/${movieId}/recommendations`;
            const response = await fetch(tmdbUrl(path, { language: 'pt-BR' }));
            if (!response.ok) {
                if (response.status === 404) { console.warn(`Movie/TV show with ID ${movieId} not found for similar content`); return []; }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'recommended');
        } catch (error) { console.error('Error fetching similar:', error); return []; }
    },

    // Fetch movie videos (trailers) - Prioriza trailers oficiais em HD
    async fetchMovieVideos(tmdbId: number, isSeries: boolean = false): Promise<{ key: string; name: string; type: string; site: string; official: boolean; size: number }[]> {
        try {
            const path = isSeries ? `/tv/${tmdbId}/videos` : `/movie/${tmdbId}/videos`;
            const response = await fetch(tmdbUrl(path));

            // Verificar se a resposta é válida
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Movie/TV show with ID ${tmdbId} not found for videos`);
                    return [];
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Filtrar apenas trailers do YouTube
            const youtubeVideos = data.results?.filter((v: { site: string; type: string }) =>
                v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
            ) || [];

            // Ordenar por prioridade: oficial > HD/4K > Trailer (não Teaser)
            const sortedVideos = youtubeVideos.sort((a: { official: boolean; size: number; type: string; name: string }, b: { official: boolean; size: number; type: string; name: string }) => {
                // 1. Priorizar vídeos oficiais (TMDB marca como official: true)
                if (a.official !== b.official) {
                    return a.official ? -1 : 1;
                }

                // 2. Priorizar maior resolução (size: 2160=4K, 1080=HD, 720, 480, 360)
                if (a.size !== b.size) {
                    return (b.size || 0) - (a.size || 0);
                }

                // 3. Priorizar Trailer sobre Teaser
                if (a.type !== b.type) {
                    return a.type === 'Trailer' ? -1 : 1;
                }

                // 4. Priorizar nomes com "Official" ou "Oficial"
                const aHasOfficial = /official|oficial/i.test(a.name);
                const bHasOfficial = /official|oficial/i.test(b.name);
                if (aHasOfficial !== bHasOfficial) {
                    return aHasOfficial ? -1 : 1;
                }

                return 0;
            });

            return sortedVideos.slice(0, 3).map((v: { key: string; name: string; type: string; site: string; official: boolean; size: number }) => ({
                key: v.key,
                name: v.name,
                type: v.type,
                site: v.site,
                official: v.official || false,
                size: v.size || 0
            }));
        } catch (error) {
            console.error('Error fetching videos:', error);
            return [];
        }
    },

    // Fetch actor details
    async fetchActorDetails(actorId: number): Promise<{
        name: string;
        biography: string;
        birthday: string;
        place_of_birth: string;
        profile_path: string;
        known_for: { title: string; poster_path: string; id: number }[];
        social_ids: { instagram_id?: string; twitter_id?: string; facebook_id?: string; tiktok_id?: string; youtube_id?: string };
    } | null> {
        try {
            const [personResponse, creditsResponse, externalIdsResponse] = await Promise.all([
                fetch(tmdbUrl(`/person/${actorId}`, { language: 'pt-BR' })),
                fetch(tmdbUrl(`/person/${actorId}/movie_credits`)),
                fetch(tmdbUrl(`/person/${actorId}/external_ids`))
            ]);

            // Verificar se as respostas são válidas
            if (!personResponse.ok || !creditsResponse.ok || !externalIdsResponse.ok) {
                if (personResponse.status === 404 || creditsResponse.status === 404 || externalIdsResponse.status === 404) {
                    console.warn(`Actor with ID ${actorId} not found for details`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${personResponse.status || creditsResponse.status || externalIdsResponse.status}`);
            }

            const person = await personResponse.json();
            const credits = await creditsResponse.json();
            const externalIds = await externalIdsResponse.json();

            return {
                name: person.name,
                biography: person.biography || 'Biografia não disponível.',
                birthday: person.birthday,
                place_of_birth: person.place_of_birth,
                profile_path: person.profile_path,
                known_for: credits.cast?.sort((a: { popularity: number }, b: { popularity: number }) =>
                    b.popularity - a.popularity
                ).slice(0, 8).map((m: { title: string; poster_path: string; id: number }) => ({
                    title: m.title,
                    poster_path: m.poster_path,
                    id: m.id
                })) || [],
                social_ids: {
                    instagram_id: externalIds.instagram_id || undefined,
                    twitter_id: externalIds.twitter_id || undefined,
                    facebook_id: externalIds.facebook_id || undefined,
                    tiktok_id: externalIds.tiktok_id || undefined,
                    youtube_id: externalIds.youtube_id || undefined
                }
            };
        } catch (error) {
            // Silenciar erros de rede (conexão fechada, timeout, etc.)
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.warn('Network error fetching actor details - connection may be unstable');
            } else {
                console.error('Error fetching actor details:', error);
            }
            return null;
        }
    },

    // Fetch watch providers (where to stream)
    async fetchWatchProviders(tmdbId: number, isSeries: boolean = false, region: string = 'BR'): Promise<{
        flatrate?: { provider_name: string; logo_path: string }[];
        rent?: { provider_name: string; logo_path: string }[];
        buy?: { provider_name: string; logo_path: string }[];
    } | null> {
        try {
            const path = isSeries ? `/tv/${tmdbId}/watch/providers` : `/movie/${tmdbId}/watch/providers`;
            const response = await fetch(tmdbUrl(path, { language: 'pt-BR' }));

            // Verificar se a resposta é válida
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`${isSeries ? 'Series' : 'Movie'} with ID ${tmdbId} not found for watch providers`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.results?.[region] || null;
        } catch (error) {
            console.error('Error fetching watch providers:', error);
            return null;
        }
    },

    // Fetch movie keywords/tags
    async fetchMovieKeywords(tmdbId: number, isSeries: boolean = false): Promise<{ id: number; name: string }[]> {
        try {
            const path = isSeries ? `/tv/${tmdbId}/keywords` : `/movie/${tmdbId}/keywords`;
            const response = await fetch(tmdbUrl(path, { language: 'pt-BR' }));

            // Verificar se a resposta é válida
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Movie/Tv show with ID ${tmdbId} not found for keywords`);
                    return [];
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.keywords?.slice(0, 8) || [];
        } catch (error) {
            console.error('Error fetching keywords:', error);
            return [];
        }
    },

    // Fetch collection/franchise details
    async fetchCollection(collectionId: number): Promise<{
        id: number;
        name: string;
        overview: string;
        poster_path: string;
        backdrop_path: string;
        parts: { id: number; title: string; poster_path: string; release_date: string }[];
    } | null> {
        try {
            const response = await fetch(tmdbUrl(`/collection/${collectionId}`, { language: 'pt-BR' }));

            // Verificar se a resposta é válida
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Collection with ID ${collectionId} not found`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const today = new Date();
            return {
                id: data.id,
                name: data.name,
                overview: data.overview,
                poster_path: data.poster_path,
                backdrop_path: data.backdrop_path,
                parts: data.parts
                    ?.filter((p: { poster_path: string; release_date: string }) => {
                        // Filtra filmes sem poster ou que ainda não foram lançados
                        if (!p.poster_path || p.poster_path === '') return false;
                        if (!p.release_date) return false;
                        const releaseDate = new Date(p.release_date);
                        return releaseDate <= today;
                    })
                    .map((p: { id: number; title: string; poster_path: string; release_date: string }) => ({
                        id: p.id,
                        title: p.title,
                        poster_path: p.poster_path,
                        release_date: p.release_date
                    }))
                    .sort((a: { release_date: string }, b: { release_date: string }) =>
                        new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
                    ) || []
            };
        } catch (error) {
            console.error('Error fetching collection:', error);
            return null;
        }
    },

    // Helper para normalizar classificações dos EUA para o padrão BR
    normalizeAgeRating(rating: string): string {
        if (rating === '18') return '18';
        const map: Record<string, string> = {
            'G': 'L', 'TV-G': 'L', 'TV-Y': 'L',
            'PG': '10', 'TV-PG': '10', 'TV-Y7': '10',
            'PG-13': '12',
            'TV-14': '14',
            'R': '16',
            'NC-17': '18', 'TV-MA': '18',
            'NR': '12', 'UR': '12' // Fallback para não classificados
        };
        return map[rating] || rating;
    },

    // Fetch movie details with credits and age rating
    async fetchMovieDetails(tmdbId: number): Promise<{ overview?: string; budget?: number; revenue?: number; director?: string; cast: CastMember[]; genres?: string[]; runtime?: number; release_date?: string; tagline?: string; ageRating?: string; belongs_to_collection?: { id: number; name: string; poster_path: string; backdrop_path: string } | null } | null> {
        try {
            const [movieResponse, creditsResponse, releaseDatesResponse] = await Promise.all([
                fetch(tmdbUrl(`/movie/${tmdbId}`, { language: 'pt-BR' })),
                fetch(tmdbUrl(`/movie/${tmdbId}/credits`, { language: 'pt-BR' })),
                fetch(tmdbUrl(`/movie/${tmdbId}/release_dates`))
            ]);

            // Verificar se as respostas são válidas
            if (!movieResponse.ok || !creditsResponse.ok || !releaseDatesResponse.ok) {
                if (movieResponse.status === 404 || creditsResponse.status === 404 || releaseDatesResponse.status === 404) {
                    console.warn(`Movie with ID ${tmdbId} not found for details`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${movieResponse.status || creditsResponse.status || releaseDatesResponse.status}`);
            }

            const movie = await movieResponse.json();
            const credits = await creditsResponse.json();
            const releaseDates = await releaseDatesResponse.json();

            // Buscar classificação indicativa (prioridade: BR > US)
            let ageRating: string | undefined;
            const brRelease = releaseDates.results?.find((r: { iso_3166_1: string }) => r.iso_3166_1 === 'BR');
            const usRelease = releaseDates.results?.find((r: { iso_3166_1: string }) => r.iso_3166_1 === 'US');

            const brCertification = brRelease?.release_dates?.find((rd: { certification: string }) => rd.certification)?.certification;
            const usCertification = usRelease?.release_dates?.find((rd: { certification: string }) => rd.certification)?.certification;

            ageRating = this.normalizeAgeRating(brCertification || usCertification || '');

            return {
                ...movie,
                genres: movie.genres?.map((g: { id: number; name: string }) => g.name) || [],
                runtime: movie.runtime,
                tagline: movie.tagline,
                revenue: movie.revenue,
                ageRating,
                belongs_to_collection: movie.belongs_to_collection || null,
                cast: credits.cast?.slice(0, 10).map((c: { id: number; name: string; character: string; profile_path: string }) => ({
                    id: c.id,
                    name: c.name,
                    character: c.character,
                    profile_path: c.profile_path
                })) || [],
                director: credits.crew?.find((c: { job: string; name: string }) => c.job === 'Director')?.name || 'Unknown'
            };
        } catch (error) {
            console.error('Error fetching movie details:', error);
            return null;
        }
    },

    // Fetch TV series details with credits and age rating
    async fetchSeriesDetails(tmdbId: number): Promise<{ overview?: string; director?: string; cast: CastMember[]; genres?: string[]; tagline?: string; ageRating?: string; seasons?: { id: number; season_number: number; episode_count: number; name: string; air_date: string; poster_path: string }[]; number_of_seasons?: number; number_of_episodes?: number; first_air_date?: string; last_air_date?: string } | null> {
        try {
            const [seriesResponse, creditsResponse, contentRatingsResponse] = await Promise.all([
                fetch(tmdbUrl(`/tv/${tmdbId}`, { language: 'pt-BR' })),
                fetch(tmdbUrl(`/tv/${tmdbId}/credits`, { language: 'pt-BR' })),
                fetch(tmdbUrl(`/tv/${tmdbId}/content_ratings`))
            ]);

            // Verificar se as respostas são válidas
            if (!seriesResponse.ok || !creditsResponse.ok || !contentRatingsResponse.ok) {
                if (seriesResponse.status === 404 || creditsResponse.status === 404 || contentRatingsResponse.status === 404) {
                    console.warn(`TV Series with ID ${tmdbId} not found for details`);
                    return null;
                }
                console.error(`TMDB API Error: ${seriesResponse.status || creditsResponse.status || contentRatingsResponse.status}`);
                return null; // Retorna null em vez de lançar erro
            }

            const series = await seriesResponse.json();
            const credits = await creditsResponse.json();
            const contentRatings = await contentRatingsResponse.json();

            // Buscar classificação indicativa (prioridade: BR > US)
            let ageRating: string | undefined;
            const brRating = contentRatings.results?.find((r: { iso_3166_1: string }) => r.iso_3166_1 === 'BR');
            const usRating = contentRatings.results?.find((r: { iso_3166_1: string }) => r.iso_3166_1 === 'US');

            ageRating = this.normalizeAgeRating(brRating?.rating || usRating?.rating || '');

            return {
                ...series,
                genres: series.genres?.map((g: { id: number; name: string }) => g.name) || [],
                tagline: series.tagline,
                ageRating,
                number_of_seasons: series.number_of_seasons,
                number_of_episodes: series.number_of_episodes,
                first_air_date: series.first_air_date,
                last_air_date: series.last_air_date,
                seasons: series.seasons?.map((s: { id: number; season_number: number; episode_count: number; name: string; air_date: string; poster_path: string }) => ({
                    id: s.id,
                    season_number: s.season_number,
                    episode_count: s.episode_count,
                    name: s.name,
                    air_date: s.air_date,
                    poster_path: s.poster_path
                })) || [],
                cast: credits.cast?.slice(0, 10).map((c: { id: number; name: string; character: string; profile_path: string }) => ({
                    id: c.id,
                    name: c.name,
                    character: c.character,
                    profile_path: c.profile_path
                })) || [],
                // Para séries, usar "created_by" em vez de "Director"
                director: series.created_by?.length > 0
                    ? series.created_by.map((c: { name: string }) => c.name).join(', ')
                    : undefined,
                created_by: series.created_by?.length > 0
                    ? series.created_by.map((c: { name: string }) => c.name).join(', ')
                    : undefined
            };
        } catch (error) {
            console.error('Error fetching series details:', error);
            return null;
        }
    },

    // Fetch season details with episodes
    async fetchSeasonDetails(seriesId: number, seasonNumber: number): Promise<{ episodes: { id: number; episode_number: number; name: string; overview: string; air_date: string; runtime: number; still_path: string; vote_average: number }[] } | null> {
        try {
            const response = await fetch(tmdbUrl(`/tv/${seriesId}/season/${seasonNumber}`, { language: 'pt-BR' }));

            // Verificar se a resposta é válida
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Season ${seasonNumber} for series ${seriesId} not found`);
                    return { episodes: [] };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return {
                episodes: data.episodes?.map((e: { id: number; episode_number: number; name: string; overview: string; air_date: string; runtime: number; still_path: string; vote_average: number }) => ({
                    id: e.id,
                    episode_number: e.episode_number,
                    name: e.name,
                    overview: e.overview,
                    air_date: e.air_date,
                    runtime: e.runtime,
                    still_path: e.still_path,
                    vote_average: e.vote_average
                })) || []
            };
        } catch (error) {
            console.error('Error fetching season details:', error);
            return { episodes: [] };
        }
    },

    // Fetch movie images (backdrops) with language priority (pt-BR > pt > en > others)
    async fetchMovieImages(tmdbId: number, isSeries: boolean = false, languages?: string): Promise<string[]> {
        try {
            const path = isSeries ? `/tv/${tmdbId}/images` : `/movie/${tmdbId}/images`;
            const params: Record<string, string> = {};
            if (languages) {
                params.include_image_language = languages;
                params.language = 'pt-BR';
            } else {
                params.include_image_language = 'xx';
            }
            const response = await fetch(tmdbUrl(path, params));

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            let backdrops = data.backdrops || [];

            if (languages) {
                const priority = languages.split(',');
                backdrops = backdrops.sort((a: any, b: any) => {
                    const aIdx = priority.indexOf(a.iso_639_1);
                    const bIdx = priority.indexOf(b.iso_639_1);
                    const aScore = aIdx >= 0 ? aIdx : priority.length + (a.iso_639_1 === null || a.iso_639_1 === 'xx' ? 0 : 1);
                    const bScore = bIdx >= 0 ? bIdx : priority.length + (b.iso_639_1 === null || b.iso_639_1 === 'xx' ? 0 : 1);
                    return aScore - bScore;
                });
            }

            return backdrops.slice(0, 10).map((img: any) => `${TMDB_IMAGE_BASE}/original${img.file_path}`);
        } catch (error) {
            console.error('Error fetching images:', error);
            return [];
        }
    },

    // Fetch movie/TV logos with language priority (pt > en > neutral > others)
    async fetchMovieLogos(tmdbId: number, isSeries: boolean = false): Promise<{
        file_path: string;
        file_type: string;
        width: number;
        height: number;
        iso_639_1: string | null;
    }[]> {
        try {
            const path = isSeries ? `/tv/${tmdbId}/images` : `/movie/${tmdbId}/images`;
            const response = await fetch(tmdbUrl(path));

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            const logos = data.logos || [];

            // Filtrar e ordenar logos por prioridade de idioma
            return logos
                .filter((logo: any) => logo.file_path) // Garantir que tem file_path
                .sort((a: any, b: any) => {
                    // Função para calcular prioridade do idioma
                    const getLanguagePriority = (lang: string | null) => {
                        if (lang === 'pt') return 1; // Português - maior prioridade
                        if (lang === 'en') return 2; // Inglês - segunda prioridade
                        if (!lang || lang === 'xx') return 3; // Neutro - terceira prioridade
                        return 4; // Outros idiomas - menor prioridade
                    };

                    const aPriority = getLanguagePriority(a.iso_639_1);
                    const bPriority = getLanguagePriority(b.iso_639_1);

                    // Priorizar por idioma primeiro
                    if (aPriority !== bPriority) {
                        return aPriority - bPriority;
                    }

                    // Se mesmo idioma, priorizar SVGs sobre PNGs
                    const aIsSvg = a.file_type === '.svg';
                    const bIsSvg = b.file_type === '.svg';

                    if (aIsSvg !== bIsSvg) {
                        return aIsSvg ? -1 : 1;
                    }

                    // Se mesmo formato, priorizar maior resolução
                    return (b.width * b.height) - (a.width * a.height);
                })
                .slice(0, 3) // Pegar os 3 melhores logos
                .map((logo: any) => ({
                    file_path: logo.file_path,
                    file_type: logo.file_type || '.png',
                    width: logo.width || 0,
                    height: logo.height || 0,
                    iso_639_1: logo.iso_639_1
                }));
        } catch (error) {
            console.error('Error fetching logos:', error);
            return [];
        }
    },

    // Get backdrop URL for carousel
    async getCarouselBackdrop(category: string): Promise<string | null> {
        try {
            let path = '';
            if (category === 'top_rated') {
                path = '/movie/top_rated';
            } else if (category === 'coming_soon') {
                path = '/movie/upcoming';
            } else {
                return null;
            }
            const response = await fetch(tmdbUrl(path, { page: '1', language: 'pt-BR' }));

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Category ${category} not found for carousel backdrop`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const results = data.results || [];

            for (const movie of results) {
                if (movie.backdrop_path) {
                    return `${TMDB_IMAGE_BASE}/original${movie.backdrop_path}`;
                }
            }

            return null;
        } catch (error) {
            console.error('Error fetching carousel backdrop:', error);
            return null;
        }
    },

    // Transform TMDB data to our format
    transformTMDBData(items: TMDBItem[], category: Movie['category'], forceType: 'movie' | 'series' | null = null): Omit<Movie, 'id'>[] {
        // Filtrar itens sem poster
        const filteredItems = items.filter(item => item.poster_path && item.poster_path !== '');

        return filteredItems.map((item, index) => {
            const isMovie = forceType === 'movie' || item.media_type === 'movie' || !item.media_type;
            const title = item.title || item.name || 'Untitled';
            const releaseDate = item.release_date || item.first_air_date || '';
            const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();

            // Para séries, calcular duração com base no número real de temporadas
            let duration = '2h 0m';
            if (!isMovie) {
                // Para séries, usar número de temporadas se disponível
                if (item.number_of_seasons !== undefined && item.number_of_seasons > 0) {
                    const seasons = item.number_of_seasons;
                    duration = `${seasons} Temporada${seasons > 1 ? 's' : ''}`;
                } else {
                    duration = this.getRandomSeasons();
                }
            } else {
                duration = this.getRandomDuration();
            }

            const genreNames = (item.genre_ids || [])
                .map((id) => TMDB_ID_TO_GENRE_NAME[id])
                .filter(Boolean) as string[];

            return {
                title,
                type: isMovie ? 'movie' : 'series',
                year,
                rating: this.getContentRating(item.adult),
                duration,
                genre: genreNames,
                synopsis: item.overview || 'No synopsis available.',
                cast: [],
                director: 'Unknown',
                poster_url: item.poster_path
                    ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}`
                    : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&h=750&fit=crop',
                backdrop_url: item.backdrop_path
                    ? `${TMDB_IMAGE_BASE}/w1280${item.backdrop_path}`
                    : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
                score: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 8.0,
                is_featured: (category === 'trending' && index < 3) || (category === 'trending_today' && index < 6),
                category: category,
                tmdb_id: item.id
            };
        });
    },

    getContentRating(isAdult?: boolean): string {
        if (isAdult) return 'R';
        const ratings = ['PG', 'PG-13', 'R', 'TV-MA', 'TV-14'];
        return ratings[Math.floor(Math.random() * ratings.length)];
    },

    getRandomDuration(): string {
        const hours = Math.floor(Math.random() * 2) + 1;
        const minutes = Math.floor(Math.random() * 60);
        return `${hours}h ${minutes}m`;
    },

    getRandomSeasons(): string {
        const seasons = Math.floor(Math.random() * 5) + 1;
        return `${seasons} Temporada${seasons > 1 ? 's' : ''}`;
    },

    // Fetch series by creator - busca séries onde a pessoa é realmente criador
    async fetchSeriesByCreator(creatorId: number, excludeSeriesId?: number): Promise<Omit<Movie, 'id'>[]> {
        try {
            // Buscar créditos de TV da pessoa
            const response = await fetch(
                tmdbUrl(`/person/${creatorId}/tv_credits`, { language: 'pt-BR' })
            );

            if (!response.ok) {
                console.warn(`Error fetching person TV credits: ${response.status}`);
                return [];
            }

            const data = await response.json();

            // Filtrar apenas séries onde a pessoa é criador (crew com job "Creator" apenas)
            const creatorShows = data.crew?.filter((show: { job: string; id: number }) =>
                show.job === 'Creator' &&
                show.id !== excludeSeriesId
            ) || [];

            // Remover duplicatas e séries sem poster (mesma série pode aparecer múltiplas vezes)
            const uniqueShows = creatorShows
                .filter((show: { poster_path: string }) => show.poster_path && show.poster_path !== '')
                .reduce((acc: { id: number; name: string; poster_path: string; backdrop_path: string; first_air_date: string; vote_average: number; overview: string }[], show: { id: number; name: string; poster_path: string; backdrop_path: string; first_air_date: string; vote_average: number; overview: string }) => {
                    if (!acc.find(s => s.id === show.id)) {
                        acc.push(show);
                    }
                    return acc;
                }, []);

            // Ordenar por popularidade/data e pegar os primeiros 12
            const sortedShows = uniqueShows
                .sort((a: { vote_average: number }, b: { vote_average: number }) => b.vote_average - a.vote_average)
                .slice(0, 12);


            return sortedShows.map((show: { id: number; name: string; poster_path: string; backdrop_path: string; first_air_date: string; vote_average: number; overview: string }) => ({
                title: show.name || 'Untitled',
                type: 'series' as const,
                year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : new Date().getFullYear(),
                rating: 'NR',
                duration: '1 Temporada',
                genre: [],
                synopsis: show.overview || '',
                cast: [],
                director: 'Unknown',
                poster_url: show.poster_path
                    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                    : '',
                backdrop_url: show.backdrop_path
                    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
                    : '',
                score: show.vote_average ? parseFloat(show.vote_average.toFixed(1)) : 0,
                is_featured: false,
                category: 'recommended' as const,
                tmdb_id: show.id
            }));
        } catch (error) {
            console.error('Error fetching series by creator:', error);
            return [];
        }
    },

    // Fetch full series details including networks and creators
    async fetchSeriesFullDetails(tmdbId: number): Promise<{
        networks?: { id: number; name: string; logo_path: string }[];
        created_by?: { id: number; name: string; profile_path: string }[];
    } | null> {
        try {
            const response = await fetch(tmdbUrl(`/tv/${tmdbId}`, { language: 'pt-BR' }));

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`TV Series with ID ${tmdbId} not found`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                networks: data.networks?.map((n: { id: number; name: string; logo_path: string }) => ({
                    id: n.id,
                    name: n.name,
                    logo_path: n.logo_path
                })) || [],
                created_by: data.created_by?.map((c: { id: number; name: string; profile_path: string }) => ({
                    id: c.id,
                    name: c.name,
                    profile_path: c.profile_path
                })) || []
            };
        } catch (error) {
            console.error('Error fetching series full details:', error);
            return null;
        }
    }
};

interface TMDBItem {
    id: number;
    title?: string;
    name?: string;
    media_type?: string;
    release_date?: string;
    first_air_date?: string;
    adult?: boolean;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
    vote_average?: number;
    number_of_seasons?: number;
    genre_ids?: number[];
}
