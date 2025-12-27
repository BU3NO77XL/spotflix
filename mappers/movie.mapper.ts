import { Movie, CastMember } from '@/types/movie';

// TMDB API Response Types
interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  genre_ids?: number[];
  media_type?: 'movie' | 'tv';
  runtime?: number;
  number_of_seasons?: number;
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path?: string;
    }>;
  };
  genres?: Array<{
    id: number;
    name: string;
  }>;
  content_ratings?: {
    results: Array<{
      iso_3166_1: string;
      rating: string;
    }>;
  };
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{
        certification: string;
      }>;
    }>;
  };
}

export class MovieMapper {
  private static readonly IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  private static readonly BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

  static mapTMDBToMovie(tmdbItem: TMDBMovie, category?: string): Omit<Movie, 'id'> {
    const isTV = tmdbItem.media_type === 'tv' || tmdbItem.name !== undefined;
    const title = tmdbItem.title || tmdbItem.name || 'Unknown Title';
    const releaseDate = tmdbItem.release_date || tmdbItem.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();

    return {
      title,
      type: isTV ? 'series' : 'movie',
      year,
      synopsis: tmdbItem.overview || 'No description available.',
      poster_url: tmdbItem.poster_path 
        ? `${this.IMAGE_BASE_URL}${tmdbItem.poster_path}` 
        : '/assets/placeholder-poster.jpg',
      backdrop_url: tmdbItem.backdrop_path 
        ? `${this.BACKDROP_BASE_URL}${tmdbItem.backdrop_path}` 
        : undefined,
      score: tmdbItem.vote_average ? Math.round(tmdbItem.vote_average * 10) / 10 : undefined,
      tmdb_id: tmdbItem.id,
      category: category as any,
      is_featured: category === 'trending',
      cast: tmdbItem.credits?.cast?.slice(0, 10).map(actor => actor.name) || [],
      genre: tmdbItem.genres?.map(g => g.name) || [],
      rating: this.extractAgeRating(tmdbItem),
      duration: this.formatDuration(tmdbItem, isTV)
    };
  }

  static mapTMDBCast(tmdbCast: TMDBMovie['credits']): CastMember[] {
    if (!tmdbCast?.cast) return [];
    
    return tmdbCast.cast.slice(0, 20).map(actor => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      profile_path: actor.profile_path 
        ? `${this.IMAGE_BASE_URL}${actor.profile_path}` 
        : undefined
    }));
  }

  private static extractAgeRating(tmdbItem: TMDBMovie): string {
    // For movies, check release_dates
    if (tmdbItem.release_dates?.results) {
      const usRating = tmdbItem.release_dates.results
        .find(r => r.iso_3166_1 === 'US')
        ?.release_dates?.[0]?.certification;
      if (usRating) return usRating;
    }

    // For TV shows, check content_ratings
    if (tmdbItem.content_ratings?.results) {
      const usRating = tmdbItem.content_ratings.results
        .find(r => r.iso_3166_1 === 'US')?.rating;
      if (usRating) return usRating;
    }

    return 'NR'; // Not Rated
  }

  private static formatDuration(tmdbItem: TMDBMovie, isTV: boolean): string {
    if (isTV && tmdbItem.number_of_seasons) {
      return `${tmdbItem.number_of_seasons} Season${tmdbItem.number_of_seasons !== 1 ? 's' : ''}`;
    }
    
    if (tmdbItem.runtime) {
      const hours = Math.floor(tmdbItem.runtime / 60);
      const minutes = tmdbItem.runtime % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    return 'Unknown';
  }

  static mapMultipleMovies(tmdbResults: TMDBMovie[], category?: string): Omit<Movie, 'id'>[] {
    return tmdbResults.map(item => this.mapTMDBToMovie(item, category));
  }
}