export interface Movie {
    id: string;
    title: string;
    type: 'movie' | 'series';
    year: number;
    rating?: string;
    duration?: string;
    genre?: string[];
    synopsis?: string;
    cast?: string[];
    director?: string;
    poster_url: string;
    backdrop_url?: string;
    trailer_url?: string;
    score?: number;
    is_featured?: boolean;
    category?: 'trending' | 'trending_today' | 'top_rated' | 'coming_soon' | 'recommended' | 'top_10' | 'action' | 'family' | 'scifi' | 'critics';
    tmdb_id?: number;
    listItemId?: string;
    rank?: number;
}

export interface UserListItem {
    id: string;
    movie_id: string;
    list_type: 'favorites' | 'watch_later';
}

export interface CastMember {
    id?: number;
    name: string;
    character?: string;
    profile_path?: string;
}
