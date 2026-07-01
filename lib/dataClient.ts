import { Movie, UserListItem } from '@/types/movie';

export const base44 = {
    entities: {
        Movie: {
            async list(): Promise<Movie[]> { return []; },
            async filter(): Promise<Movie[]> { return []; },
            async create(): Promise<Movie> { throw new Error('Cache removido'); },
            async bulkCreate(): Promise<Movie[]> { return []; },
            async delete(): Promise<void> {},
        },
        UserList: {
            async list(): Promise<UserListItem[]> { return []; },
            async create(): Promise<UserListItem> { throw new Error('Cache removido'); },
            async delete(): Promise<void> {},
        },
    },
};
