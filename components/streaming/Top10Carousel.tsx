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
        <BaseCarousel 
            title="Top 10 Hoje"
            gap="sm"
            scrollContainerClassName="pt-2 pb-6 md:pt-3 md:pb-7 lg:pt-4 lg:pb-10 -ml-8 sm:-ml-12 lg:-ml-[48px] gap-0"
            arrowBottomClass="bottom-0"
        >
            {top10Movies.map((movie, index) => (
                <Top10Card
                    key={`${movie.tmdb_id ?? movie.id}-${index}`}
                    movie={movie}
                    rank={index + 1}
                    onClick={(m) => onMovieClick({ ...m, rank: index + 1 })}
                    index={index}
                />
            ))}
            <div className="w-4 sm:w-6 lg:w-6 flex-shrink-0" />
        </BaseCarousel>
    );
}
