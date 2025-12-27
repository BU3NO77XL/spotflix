'use client';

import { Movie } from '@/types/movie';
import BackdropCarousel from '@/components/ui/BackdropCarousel';
import MovieCard from './MovieCard';

interface StreamingBackdropCarouselProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
    backdropUrl?: string | null;
}

export default function StreamingBackdropCarousel({ title, movies, onMovieClick, backdropUrl }: StreamingBackdropCarouselProps) {
    if (!movies?.length) return null;

    return (
        <BackdropCarousel 
            title={title} 
            backdropUrl={backdropUrl}
            showBackdrop={!!backdropUrl}
        >
            {movies.map((movie) => (
                <div key={movie.id} className="shrink-0">
                    <MovieCard
                        movie={movie}
                        onClick={onMovieClick}
                        index={0}
                    />
                </div>
            ))}
        </BackdropCarousel>
    );
}