'use client';

import { Movie } from '@/types/movie';
import BaseCarousel from '@/components/ui/BaseCarousel';
import MovieCard from './MovieCard';

interface ThematicCarouselProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

export default function ThematicCarousel({ title, movies, onMovieClick }: ThematicCarouselProps) {
    if (!movies?.length) return null;

    return (
        <BaseCarousel title={title}>
            {movies.map((movie, index) => (
                <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={onMovieClick}
                    index={index}
                />
            ))}
        </BaseCarousel>
    );
}