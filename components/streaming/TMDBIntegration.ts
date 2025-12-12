import { Movie, CastMember } from '@/types/movie';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Warn if API key is missing
if (!TMDB_API_KEY) {
    console.warn('⚠️ TMDB API key not found. Please set NEXT_PUBLIC_TMDB_API_KEY in your .env.local file.');
}

export const TMDBService = {
    // Search movies and TV shows
    async search(query: string): Promise<Omit<Movie, 'id'>[]> {
        if (!query.trim()) return [];
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
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

    // Fetch trending content
    async fetchTrending(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`
            );

            // Verificar se a resposta é válida
            if (!response.ok) {
                console.warn(`Error fetching trending content: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'trending');
        } catch (error) {
            console.error('Error fetching trending:', error);
            return [];
        }
    },

    // Fetch top rated movies
    async fetchTopRatedMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=1`
            );

            // Verificar se a resposta é válida
            if (!response.ok) {
                console.warn(`Error fetching top rated movies: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'top_rated', 'movie');
        } catch (error) {
            console.error('Error fetching top rated movies:', error);
            return [];
        }
    },

    // Fetch upcoming movies (coming soon to theaters)
    async fetchUpcoming(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&page=1`
            );

            // Verificar se a resposta é válida
            if (!response.ok) {
                console.warn(`Error fetching upcoming movies: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'coming_soon', 'movie');
        } catch (error) {
            console.error('Error fetching upcoming:', error);
            return [];
        }
    },

    // Fetch popular for Top 10
    async fetchTop10(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=1`
            );

            // Verificar se a resposta é válida
            if (!response.ok) {
                console.warn(`Error fetching top 10 movies: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 10) || [], 'top_10', 'movie');
        } catch (error) {
            console.error('Error fetching top 10:', error);
            return [];
        }
    },

    // Fetch recommended content
    async fetchRecommended(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=2`
            );

            // Verificar se a resposta é válida
            if (!response.ok) {
                console.warn(`Error fetching recommended movies: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'recommended');
        } catch (error) {
            console.error('Error fetching recommended:', error);
            return [];
        }
    },

    // Fetch action movies
    async fetchActionMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=28&sort_by=popularity.desc`
            );

            // Verificar se a resposta é válida
            if (!response.ok) {
                console.warn(`Error fetching action movies: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'action', 'movie');
        } catch (error) {
            console.error('Error fetching action:', error);
            return [];
        }
    },

    // Fetch family movies
    async fetchFamilyMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=10751&sort_by=popularity.desc`
            );

            // Verificar se a resposta é válida
            if (!response.ok) {
                console.warn(`Error fetching family movies: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'family', 'movie');
        } catch (error) {
            console.error('Error fetching family:', error);
            return [];
        }
    },

    // Fetch sci-fi movies
    async fetchSciFiMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=878&sort_by=popularity.desc`
            );

            // Verificar se a resposta é válida
            if (!response.ok) {
                console.warn(`Error fetching sci-fi movies: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'scifi', 'movie');
        } catch (error) {
            console.error('Error fetching sci-fi:', error);
            return [];
        }
    },

    // Fetch critically acclaimed
    async fetchCriticsMovies(): Promise<Omit<Movie, 'id'>[]> {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=2`
            );

            // Verificar se a resposta é válida
            if (!response.ok) {
                console.warn(`Error fetching critics picks movies: ${response.status}`);
                return [];
            }

            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'critics', 'movie');
        } catch (error) {
            console.error('Error fetching critics picks:', error);
            return [];
        }
    },

    // Fetch similar movies
    async fetchSimilar(movieId: number, isSeries: boolean = false): Promise<Omit<Movie, 'id'>[]> {
        try {
            const endpoint = isSeries
                ? `${TMDB_BASE_URL}/tv/${movieId}/recommendations?api_key=${TMDB_API_KEY}`
                : `${TMDB_BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}`;

            const response = await fetch(endpoint);

            // Verificar se a resposta é válida
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Movie/TV show with ID ${movieId} not found for similar content`);
                    return [];
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return this.transformTMDBData(data.results?.slice(0, 12) || [], 'recommended');
        } catch (error) {
            console.error('Error fetching similar:', error);
            return [];
        }
    },

    // Fetch movie videos (trailers)
    async fetchMovieVideos(tmdbId: number, isSeries: boolean = false): Promise<{ key: string; name: string; type: string; site: string }[]> {
        try {
            const endpoint = isSeries
                ? `${TMDB_BASE_URL}/tv/${tmdbId}/videos?api_key=${TMDB_API_KEY}`
                : `${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}`;

            const response = await fetch(endpoint);

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
            return data.results?.filter((v: { site: string; type: string }) =>
                v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
            ).slice(0, 3) || [];
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
                fetch(`${TMDB_BASE_URL}/person/${actorId}?api_key=${TMDB_API_KEY}`),
                fetch(`${TMDB_BASE_URL}/person/${actorId}/movie_credits?api_key=${TMDB_API_KEY}`),
                fetch(`${TMDB_BASE_URL}/person/${actorId}/external_ids?api_key=${TMDB_API_KEY}`)
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
    async fetchWatchProviders(tmdbId: number, region: string = 'BR'): Promise<{
        flatrate?: { provider_name: string; logo_path: string }[];
        rent?: { provider_name: string; logo_path: string }[];
        buy?: { provider_name: string; logo_path: string }[];
    } | null> {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
            );

            // Verificar se a resposta é válida
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Movie with ID ${tmdbId} not found for watch providers`);
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
            const endpoint = isSeries
                ? `${TMDB_BASE_URL}/tv/${tmdbId}/keywords?api_key=${TMDB_API_KEY}`
                : `${TMDB_BASE_URL}/movie/${tmdbId}/keywords?api_key=${TMDB_API_KEY}`;

            const response = await fetch(endpoint);

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
            const response = await fetch(
                `${TMDB_BASE_URL}/collection/${collectionId}?api_key=${TMDB_API_KEY}`
            );

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
                fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`),
                fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`),
                fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/release_dates?api_key=${TMDB_API_KEY}`)
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
                fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`),
                fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/credits?api_key=${TMDB_API_KEY}`),
                fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/content_ratings?api_key=${TMDB_API_KEY}`)
            ]);

            // Verificar se as respostas são válidas
            if (!seriesResponse.ok || !creditsResponse.ok || !contentRatingsResponse.ok) {
                if (seriesResponse.status === 404 || creditsResponse.status === 404 || contentRatingsResponse.status === 404) {
                    console.warn(`TV Series with ID ${tmdbId} not found for details`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${seriesResponse.status || creditsResponse.status || contentRatingsResponse.status}`);
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
            const response = await fetch(
                `${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`
            );

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

    // Get backdrop URL for carousel
    async getCarouselBackdrop(category: string): Promise<string | null> {
        try {
            let endpoint = '';
            if (category === 'top_rated') {
                endpoint = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=1`;
            } else if (category === 'coming_soon') {
                endpoint = `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&page=1`;
            } else {
                return null;
            }

            const response = await fetch(endpoint);

            // Verificar se a resposta é válida
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Category ${category} not found for carousel backdrop`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const firstMovie = data.results?.[0];

            if (!firstMovie) {
                return null;
            }

            const backdropUrl = firstMovie?.backdrop_path
                ? `${TMDB_IMAGE_BASE}/original${firstMovie.backdrop_path}`
                : null;

            return backdropUrl;
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

            return {
                title,
                type: isMovie ? 'movie' : 'series',
                year,
                rating: this.getContentRating(item.adult),
                duration,
                genre: [],
                synopsis: item.overview || 'No synopsis available.',
                cast: [],
                director: 'Unknown',
                poster_url: item.poster_path
                    ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}`
                    : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&h=750&fit=crop',
                backdrop_url: item.backdrop_path
                    ? `${TMDB_IMAGE_BASE}/original${item.backdrop_path}`
                    : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
                score: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 8.0,
                is_featured: category === 'trending' && index < 3,
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
                `${TMDB_BASE_URL}/person/${creatorId}/tv_credits?api_key=${TMDB_API_KEY}`
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

            // Transformar para o formato Movie
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
            const response = await fetch(
                `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`
            );

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
}
