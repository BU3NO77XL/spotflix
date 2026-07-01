'use client';

import { Movie } from '@/types/movie';
import BaseCarousel from '@/components/ui/BaseCarousel';
import MiniCard from '@/components/ui/MiniCard';

interface MiniCarouselProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
    variant?: 'landscape' | 'portrait';
    accentColor?: string;
}

export default function MiniCarousel({ 
    title, 
    movies, 
    onMovieClick, 
    variant = 'portrait',
    accentColor = '#1DB954'
}: MiniCarouselProps) {
    if (!movies?.length) return null;

    return (
        <BaseCarousel 
            title={title}
            gap="sm"
            padding="md"
        >
            {movies.map((movie, index) => (
                <MiniCard
                    key={`${movie.tmdb_id ?? movie.id}-${index}`}
                    movie={movie}
                    onClick={onMovieClick}
                    index={index}
                    variant={variant}
                    accentColor={accentColor}
                />
            ))}
        </BaseCarousel>
    );
}