'use client';

import { Movie } from '@/types/movie';
import BaseCarousel from '@/components/ui/BaseCarousel';
import Top10Card from '@/components/ui/Top10Card';

interface Top10CarouselProps {
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

export default function Top10Carousel({ movies, onMovieClick }: Top10CarouselProps) {
    if (!movies?.length) return null;

    const top10Movies = movies.slice(0, 10);

    return (
        <BaseCarousel title="Top 10 Today">
            {top10Movies.map((movie, index) => (
                <Top10Card
                    key={movie.id}
                    movie={movie}
                    rank={index + 1}
                    onClick={onMovieClick}
                    index={index}
                />
            ))}
        </BaseCarousel>
    );
}
