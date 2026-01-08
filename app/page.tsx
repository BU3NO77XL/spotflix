'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/dataClient';
import { Movie } from '@/types/movie';
import HeroSection from '@/components/streaming/HeroSection';
import Carousel from '@/components/streaming/Carousel';
import BackdropCarousel from '@/components/streaming/BackdropCarousel';
import Top10Carousel from '@/components/streaming/Top10Carousel';
import ThematicCarousel from '@/components/streaming/ThematicCarousel';
import MiniCarousel from '@/components/streaming/MiniCarousels';
import AutoPlaySlider from '@/components/streaming/AutoPlaySlider';
import MovieModal from '@/components/streaming/MovieModal';
import { TMDBService } from '@/components/streaming/TMDBIntegration';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [continueWatching, setContinueWatching] = useState<Movie[]>([]);

  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [carouselBackdrops, setCarouselBackdrops] = useState<Record<string, string | null>>({});

  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => base44.entities.Movie.list(),
  });

  // Fetch TMDB data progressively on component mount if database is empty
  useEffect(() => {
    const loadTMDBData = async () => {
      if (movies.length === 0 && !isLoading) {
        setTmdbLoading(true);
        try {
          // Load essential content first (trending today para hero + trending semanal + top rated)
          const [trendingToday, trending, topRated] = await Promise.all([
            TMDBService.fetchTrendingToday(), // Para o hero
            TMDBService.fetchTrending(),      // Para carrossel
            TMDBService.fetchTopRatedMovies()
          ]);

          const essentialMovies = [...trendingToday, ...trending, ...topRated];

          if (essentialMovies.length > 0) {
            await base44.entities.Movie.bulkCreate(essentialMovies);
            queryClient.invalidateQueries({ queryKey: ['movies'] });
          }

          setTmdbLoading(false);

          // Load remaining content in background (non-blocking)
          setTimeout(async () => {
            try {
              const [upcoming, top10, recommended, action, family, scifi] = await Promise.all([
                TMDBService.fetchUpcoming(),
                TMDBService.fetchTop10(),
                TMDBService.fetchRecommended(),
                TMDBService.fetchActionMovies(),
                TMDBService.fetchFamilyMovies(),
                TMDBService.fetchSciFiMovies()
              ]);

              const additionalMovies = [...upcoming, ...top10, ...recommended, ...action, ...family, ...scifi];

              if (additionalMovies.length > 0) {
                await base44.entities.Movie.bulkCreate(additionalMovies);
                queryClient.invalidateQueries({ queryKey: ['movies'] });
              }

              // Fetch backdrop images for carousels
              const [topRatedBackdrop, upcomingBackdrop] = await Promise.all([
                TMDBService.getCarouselBackdrop('top_rated'),
                TMDBService.getCarouselBackdrop('coming_soon')
              ]);

              setCarouselBackdrops({
                top_rated: topRatedBackdrop,
                coming_soon: upcomingBackdrop
              });
            } catch (error) {
              console.error('Error loading additional TMDB data:', error);
            }
          }, 100);
        } catch (error) {
          console.error('Error loading TMDB data:', error);
          toast.error('Failed to load content from TMDB');
          setTmdbLoading(false);
        }
      }
    };

    loadTMDBData();
  }, [movies.length, isLoading, queryClient]);

  const addToListMutation = useMutation({
    mutationFn: (data: { movie_id: string; list_type: 'favorites' | 'watch_later' }) =>
      base44.entities.UserList.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userList'] });
      toast.success(
        variables.list_type === 'favorites'
          ? 'Added to Favorites!'
          : 'Added to Watch Later!'
      );
    },
  });

  const featuredMovies = movies.filter((m: Movie) => m.is_featured);
  const trendingTodayMovies = movies.filter((m: Movie) => m.category === 'trending_today');
  const trendingMovies = movies.filter((m: Movie) => m.category === 'trending');
  const topRatedMovies = movies.filter((m: Movie) => m.category === 'top_rated');
  const comingSoonMovies = movies.filter((m: Movie) => m.category === 'coming_soon');
  const recommendedMovies = movies.filter((m: Movie) => m.category === 'recommended');
  const top10Movies = movies.filter((m: Movie) => m.category === 'top_10');
  const actionMovies = movies.filter((m: Movie) => m.category === 'action');
  const familyMovies = movies.filter((m: Movie) => m.category === 'family');
  const sciFiMovies = movies.filter((m: Movie) => m.category === 'scifi');

  const handleWatch = (movie: Movie) => {
    // Redirecionar imediatamente para melhor UX
    router.push(`/watch?id=${movie.id}`);
    // Fechar modal em paralelo (não bloqueia o redirecionamento)
    setTimeout(() => setModalOpen(false), 100);
  };

  const handleMoreInfo = (movie: Movie) => {
    setSelectedMovie(movie);
    setModalOpen(true);
  };

  const handleAddToList = (movie: Movie, listType: 'favorites' | 'watch_later') => {
    addToListMutation.mutate({
      movie_id: movie.id,
      list_type: listType,
    });

    if (listType === 'watch_later') {
      setContinueWatching(prev => {
        const exists = prev.find(m => m.id === movie.id);
        if (!exists) {
          return [...prev, movie];
        }
        return prev;
      });
    }
  };

  if (isLoading || tmdbLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">
            {tmdbLoading ? 'Loading content from TMDB...' : 'Loading SpotFlix...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Hero - Prioriza filmes em alta do dia */}
      <HeroSection
        featuredMovies={
          trendingTodayMovies.length > 0
            ? trendingTodayMovies
            : featuredMovies.length > 0
              ? featuredMovies
              : movies.slice(0, 3)
        }
        onWatch={handleWatch}
        onMoreInfo={handleMoreInfo}
      />

      {/* Carousels */}
      <div className="-mt-20 sm:-mt-24 lg:-mt-28 relative z-10 pb-16 space-y-2">
        {continueWatching.length > 0 && (
          <Carousel
            title="Continue Assistindo"
            movies={continueWatching}
            onMovieClick={handleMoreInfo}
          />
        )}

        {trendingMovies.length > 0 && (
          <Carousel
            title="Em Alta Hoje"
            movies={trendingMovies}
            onMovieClick={handleMoreInfo}
          />
        )}

        {top10Movies.length > 0 && (
          <Top10Carousel
            movies={top10Movies}
            onMovieClick={handleMoreInfo}
          />
        )}



        {comingSoonMovies.length > 0 && (
          <BackdropCarousel
            title="Em Breve nos Cinemas"
            movies={comingSoonMovies}
            onMovieClick={handleMoreInfo}
            backdropUrl={carouselBackdrops.coming_soon}
          />
        )}

        {/* Mini Carousels - Thematic */}
        {/*{actionMovies.length > 0 && (
          <MiniCarousel
            title="Action & Adventure"
            movies={actionMovies}
            onMovieClick={handleMoreInfo}
            variant="landscape"
            accentColor="#E74C3C"
          />
        )}*/}

        {familyMovies.length > 0 && (
          <Carousel
            title="Favoritos da Família"
            movies={familyMovies}
            onMovieClick={handleMoreInfo}
          />
        )}

        {sciFiMovies.length > 0 && (
          <Carousel
            title="Universo de Ficção Científica"
            movies={sciFiMovies}
            onMovieClick={handleMoreInfo}
          />
        )}

        {recommendedMovies.length > 0 && (
          <Carousel
            title="Recomendados Para Você"
            movies={recommendedMovies}
            onMovieClick={handleMoreInfo}
          />
        )}

        {topRatedMovies.length > 0 && (
          <AutoPlaySlider
            title="Melhores Avaliados"
            movies={topRatedMovies}
            onMovieClick={handleMoreInfo}
          />
        )}

        {/* Show all movies if no categories */}
        {trendingMovies.length === 0 && topRatedMovies.length === 0 && movies.length > 0 && (
          <Carousel
            title="Todos os Filmes e Séries"
            movies={movies}
            onMovieClick={handleMoreInfo}
          />
        )}
      </div>

      {/* Movie Modal */}
      <MovieModal
        movie={selectedMovie}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onWatch={handleWatch}
        onAddToList={handleAddToList}
      />
    </div>
  );
}
