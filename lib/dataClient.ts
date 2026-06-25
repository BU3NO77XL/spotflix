import { Movie, UserListItem } from '@/types/movie';

// Simple localStorage-based storage for movies and user lists
const STORAGE_KEYS = {
    MOVIES: 'raveflix_movies',
    USER_LIST: 'raveflix_user_list',
};

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// Movie Entity
export const MovieEntity = {
    async list(): Promise<Movie[]> {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(STORAGE_KEYS.MOVIES);
        return data ? JSON.parse(data) : [];
    },

    async filter(criteria: Partial<Movie>): Promise<Movie[]> {
        const movies = await this.list();
        return movies.filter(movie => {
            return Object.entries(criteria).every(([key, value]) =>
                movie[key as keyof Movie] === value
            );
        });
    },

    async create(movie: Omit<Movie, 'id'>): Promise<Movie> {
        const movies = await this.list();
        const newMovie = { ...movie, id: generateId() } as Movie;
        movies.push(newMovie);
        localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
        return newMovie;
    },

    async bulkCreate(newMovies: Omit<Movie, 'id'>[]): Promise<Movie[]> {
        const movies = await this.list();
        const created = newMovies.map(movie => ({ ...movie, id: generateId() } as Movie));
        localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify([...movies, ...created]));
        return created;
    },

    async delete(id: string): Promise<void> {
        const movies = await this.list();
        const filtered = movies.filter(m => m.id !== id);
        localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(filtered));
    },
};

// UserList Entity
export const UserListEntity = {
    async list(): Promise<UserListItem[]> {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(STORAGE_KEYS.USER_LIST);
        return data ? JSON.parse(data) : [];
    },

    async create(item: Omit<UserListItem, 'id'>): Promise<UserListItem> {
        const list = await this.list();
        const newItem = { ...item, id: generateId() } as UserListItem;
        list.push(newItem);
        localStorage.setItem(STORAGE_KEYS.USER_LIST, JSON.stringify(list));
        return newItem;
    },

    async delete(id: string): Promise<void> {
        const list = await this.list();
        const filtered = list.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEYS.USER_LIST, JSON.stringify(filtered));
    },
};

// Unified API (compatible with original base44 usage)
export const base44 = {
    entities: {
        Movie: MovieEntity,
        UserList: UserListEntity,
    },
};
