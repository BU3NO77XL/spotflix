'use client';

import MovieCard from './MovieCard';
import { Movie } from '@/types/movie';
import BaseCarousel from '@/components/ui/BaseCarousel';

interface CarouselProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

export default function Carousel({ title, movies, onMovieClick }: CarouselProps) {
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
