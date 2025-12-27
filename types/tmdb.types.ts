// TMDB API Response Types
export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  last_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: TMDBGenre[];
  media_type?: 'movie' | 'tv' | 'person';
  adult?: boolean;
  video?: boolean;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
  homepage?: string;
  imdb_id?: string;
  budget?: number;
  revenue?: number;
  spoken_languages?: Array<{
    iso_639_1: string;
    name: string;
  }>;
  production_countries?: Array<{
    iso_3166_1: string;
    name: string;
  }>;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path?: string;
    origin_country: string;
  }>;
  credits?: TMDBCredits;
  videos?: TMDBVideos;
  keywords?: TMDBKeywords;
  images?: TMDBImages;
  content_ratings?: TMDBContentRatings;
  release_dates?: TMDBReleaseDates;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  credit_id: string;
  order: number;
  adult: boolean;
  gender: number;
  known_for_department: string;
  original_name: string;
  popularity: number;
  profile_path?: string | null;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  credit_id: string;
  adult: boolean;
  gender: number;
  known_for_department: string;
  original_name: string;
  popularity: number;
  profile_path?: string | null;
}

export interface TMDBVideos {
  results: TMDBVideo[];
}

export interface TMDBVideo {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  official: boolean;
  published_at: string;
  site: string;
  size: number;
  type: string;
}

export interface TMDBKeywords {
  keywords?: TMDBKeyword[];
  results?: TMDBKeyword[];
}

export interface TMDBKeyword {
  id: number;
  name: string;
}

export interface TMDBImages {
  backdrops: TMDBImage[];
  logos: TMDBImage[];
  posters: TMDBImage[];
}

export interface TMDBImage {
  aspect_ratio: number;
  file_path: string;
  height: number;
  iso_639_1?: string | null;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface TMDBContentRatings {
  results: Array<{
    iso_3166_1: string;
    rating: string;
  }>;
}

export interface TMDBReleaseDates {
  results: Array<{
    iso_3166_1: string;
    release_dates: Array<{
      certification: string;
      iso_639_1: string;
      note: string;
      release_date: string;
      type: number;
    }>;
  }>;
}

export interface TMDBConfiguration {
  images: {
    base_url: string;
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
  };
  change_keys: string[];
}