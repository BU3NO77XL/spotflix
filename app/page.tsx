'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/dataClient';
import { Movie } from '@/types/movie';
import HeroSection from '@/components/streaming/HeroSection';
import Carousel from '@/components/streaming/Carousel';
import BackdropCarousel from '@/components/streaming/BackdropCarousel';
import Top10Carousel from '@/components/streaming/Top10Carousel';
import PageSkeleton from '@/components/ui/PageSkeleton';
import ThematicCarousel from '@/components/streaming/ThematicCarousel';
import MiniCarousel from '@/components/streaming/MiniCarousels';
import AutoPlaySlider from '@/components/streaming/AutoPlaySlider';
import MovieModal from '@/components/streaming/MovieModal';
import { TMDBService } from '@/components/streaming/TMDBIntegration';
import { GENRE_NAME_TO_TMDB_ID } from '@/lib/genre-map';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [continueWatching, setContinueWatching] = useState<Movie[]>([]);

  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbDataLoaded, setTmdbDataLoaded] = useState(false);
  const [carouselBackdrops, setCarouselBackdrops] = useState<Record<string, string | null>>({});
  const [userName, setUserName] = useState('');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [genreNames, setGenreNames] = useState<string[]>([]);
  const [recommendationsTimestamp, setRecommendationsTimestamp] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Busca perfil + preferências do banco via API
  useEffect(() => {
    const stored = localStorage.getItem('userBasicInfo');
    if (!stored) return;
    try {
      const local = JSON.parse(stored);
      setUserName(local.name || '');

      if (local.id) {
        setUserId(local.id);
        fetch(`/api/auth/profile?userId=${local.id}`)
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data?.user) {
              setUserName(data.user.name || '');
              const prefs = data.user.preferences;
              if (prefs?.genres?.length) {
                setGenreNames(prefs.genres);
              }
              if (prefs?.recommendationsUpdatedAt) {
                setRecommendationsTimestamp(prefs.recommendationsUpdatedAt);
              }
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => base44.entities.Movie.list(),
  });

  // Fetch TMDB data progressively on component mount if database is empty or genres are missing
  useEffect(() => {
    const loadTMDBData = async () => {
      if (tmdbDataLoaded) return;
      const needsGenreRefresh = movies.length > 0 && movies.some((m: Movie) => !m.genre || m.genre.length === 0);
      if ((movies.length === 0 || needsGenreRefresh) && !isLoading) {
        setTmdbLoading(true);

        // Se for refresh, limpa os filmes antigos primeiro para evitar duplicatas
        if (needsGenreRefresh) {
          const allMovies = await base44.entities.Movie.list();
          const kept = allMovies.filter((m: Movie) => m.category === 'personalized');
          localStorage.setItem('webflix_movies', JSON.stringify(kept));
        }

        try {
          const [trendingToday, trending, topRated] = await Promise.all([
            TMDBService.fetchTrendingToday(),
            TMDBService.fetchTrending(),
            TMDBService.fetchTopRatedMovies()
          ]);

          const essentialMovies = [...trendingToday, ...trending, ...topRated];

          if (essentialMovies.length > 0) {
            await base44.entities.Movie.bulkCreate(essentialMovies);
            queryClient.invalidateQueries({ queryKey: ['movies'] });
          }

          setTmdbLoading(false);

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
        setTmdbDataLoaded(true);
      }
    };

    loadTMDBData();
  }, [movies.length, isLoading, queryClient, tmdbDataLoaded]);

  // Carrega filmes personalizados baseado nas preferências do banco
  useEffect(() => {
    const loadPersonalized = async () => {
      if (preferencesLoaded || genreNames.length === 0 || !userId) return;
      const genreIds = genreNames
        .map((g: string) => GENRE_NAME_TO_TMDB_ID[g])
        .filter((id: number | undefined): id is number => !!id);
      if (genreIds.length === 0) return;

      // Verifica cache de 48h pelo timestamp do banco
      const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
      const lastUpdate = recommendationsTimestamp ? new Date(recommendationsTimestamp).getTime() : 0;
      const cacheValid = recommendationsTimestamp && (Date.now() - lastUpdate) < FORTY_EIGHT_HOURS;

      const existingMovies = await base44.entities.Movie.list();
      const hasPersonalized = existingMovies.some((m) => m.category === 'personalized');

      if (cacheValid && hasPersonalized) {
        setPreferencesLoaded(true);
        return;
      }

      // Cache expirado ou sem filmes → remove os antigos e busca novos
      const filteredMovies = existingMovies.filter((m) => m.category !== 'personalized');
      localStorage.setItem('webflix_movies', JSON.stringify(filteredMovies));

      const personalized = await TMDBService.fetchByGenreIds(genreIds);
      if (personalized.length > 0) {
        await base44.entities.Movie.bulkCreate(personalized);
        // Atualiza timestamp no banco
        await fetch('/api/auth/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['movies'] });
      }
      setPreferencesLoaded(true);
    };
    loadPersonalized();
  }, [queryClient, preferencesLoaded, genreNames, recommendationsTimestamp, userId]);

  // Watchlist do usuário vinda da API
  const { data: watchlistData = { items: [] } } = useQuery({
    queryKey: ['watchlist', userId],
    queryFn: () => fetch(`/api/watchlist?userId=${userId}`).then(r => r.json()),
    enabled: !!userId,
  });

  const watchlistTmdbIds = new Set(watchlistData.items.map((i: any) => i.tmdbId));
  const selectedMovieInList = selectedMovie ? watchlistTmdbIds.has(Number(selectedMovie.tmdb_id)) : false;

  const addToListMutation = useMutation({
    mutationFn: (movie: Movie) =>
      fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tmdbId: movie.tmdb_id,
          mediaType: movie.type,
          title: movie.title,
          posterUrl: movie.poster_url,
          backdropUrl: movie.backdrop_url,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
      toast.success('Adicionado à sua lista!');
    },
  });

  const removeFromListMutation = useMutation({
    mutationFn: (movie: Movie) =>
      fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tmdbId: movie.tmdb_id,
          mediaType: movie.type,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
      toast.success('Removido da sua lista!');
    },
  });

  const featuredMovies = movies.filter((m: Movie) => m.is_featured);
  const trendingTodayMovies = movies.filter((m: Movie) => m.category === 'trending_today');

  // Embaralha uma vez quando os filmes carregam, varia o backdrop inicial a cada visita
  const shuffledHeroMovies = useMemo(() => {
    const pool = trendingTodayMovies.length > 0
      ? trendingTodayMovies
      : featuredMovies.length > 0
        ? featuredMovies
        : movies.slice(0, 10);
    return [...pool]
      .filter(m => !m.synopsis || m.synopsis.length <= 250)
      .sort(() => Math.random() - 0.5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies.length]); // só re-embaralha quando a lista de filmes muda
  const trendingMovies = movies.filter((m: Movie) => m.category === 'trending');
  const topRatedMovies = movies.filter((m: Movie) => m.category === 'top_rated');
  const comingSoonMovies = movies.filter((m: Movie) => m.category === 'coming_soon');
  const recommendedMovies = movies.filter((m: Movie) => m.category === 'recommended');
  const top10Movies = movies.filter((m: Movie) => m.category === 'top_10');
  const actionMovies = movies.filter((m: Movie) => m.category === 'action');
  const familyMovies = movies.filter((m: Movie) => m.category === 'family');
  const sciFiMovies = movies.filter((m: Movie) => m.category === 'scifi');
  const personalizedMovies = movies.filter((m: Movie) => m.category === 'personalized');

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

  const handleAddToList = (movie: Movie) => {
    addToListMutation.mutate(movie);
    setContinueWatching(prev => {
      const exists = prev.find(m => m.id === movie.id);
      if (!exists) {
        return [...prev, movie];
      }
      return prev;
    });
  };

  const handleRemoveFromList = (movie: Movie) => {
    removeFromListMutation.mutate(movie);
  };

  if (isLoading || tmdbLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Hero - Prioriza filmes em alta do dia */}
      <HeroSection
        featuredMovies={shuffledHeroMovies.length > 0 ? shuffledHeroMovies : movies.filter((m: Movie) => !m.synopsis || m.synopsis.length <= 250).slice(0, 3)}
        onWatch={handleWatch}
        onMoreInfo={handleMoreInfo}
      />

      {/* Carousels */}
      <div className="-mt-[211px] relative z-20 pb-12 space-y-5">
        {continueWatching.length > 0 && (
          <Carousel
            title="Continue Assistindo"
            movies={continueWatching}
            onMovieClick={handleMoreInfo}
          />
        )}

        {userId && personalizedMovies.length > 0 && (
          <Carousel
            title="Para Você"
            movies={personalizedMovies}
            onMovieClick={handleMoreInfo}
          />
        )}

        {trendingMovies.length > 0 && (
          <Carousel
            title="Em Alta"
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
            title="Em Breve"
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
            title="Família"
            movies={familyMovies}
            onMovieClick={handleMoreInfo}
          />
        )}

        {sciFiMovies.length > 0 && (
          <Carousel
            title="Ficção Científica"
            movies={sciFiMovies}
            onMovieClick={handleMoreInfo}
          />
        )}

        {recommendedMovies.length > 0 && (
          <Carousel
            title="Recomendados"
            movies={recommendedMovies}
            onMovieClick={handleMoreInfo}
          />
        )}

        {/* {topRatedMovies.length > 0 && (
          <AutoPlaySlider
            title="Melhores Avaliados"
            movies={topRatedMovies}
            onMovieClick={handleMoreInfo}
          />
        )} */}

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
        isInWatchlist={selectedMovieInList}
        onRemoveFromList={handleRemoveFromList}
      />
    </div>
  );
}
