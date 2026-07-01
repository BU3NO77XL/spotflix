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
import LoginRequiredModal from '@/components/streaming/LoginRequiredModal';
import { TMDBService } from '@/components/streaming/TMDBIntegration';
import { GENRE_NAME_TO_TMDB_ID } from '@/lib/genre-map';
import { toast } from 'sonner';

interface WatchHistoryItem {
  id: number;
  tmdb_id: number;
  media_type: string;
  season_number: number;
  episode_number: number;
  total_seasons: number;
  total_episodes: number;
  season_episodes: number;
  title: string;
  poster_url: string;
  backdrop_url: string;
  progress_percent: number;
  watched_at: string;
}

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [continueWatching, setContinueWatching] = useState<Movie[]>([]);

  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbDataLoaded, setTmdbDataLoaded] = useState(false);
  const [carouselBackdrops, setCarouselBackdrops] = useState<Record<string, string | null>>({});
  const [userName, setUserName] = useState('');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [genreNames, setGenreNames] = useState<string[]>([]);
  const [recommendationsTimestamp, setRecommendationsTimestamp] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem('userBasicInfo');
      return stored ? JSON.parse(stored).id : null;
    } catch { return null; }
  });

  // Busca perfil + preferências do banco via API
  useEffect(() => {
    let localId: number | null = null;
    try {
      const stored = localStorage.getItem('userBasicInfo');
      if (!stored) return;
      const local = JSON.parse(stored);
      setUserName(local.name || '');
      localId = local.id;
    } catch { /* silent */ }

    if (localId) {
        fetch(`/api/auth/profile?userId=${localId}`)
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
  }, []);

  useEffect(() => {
    const handleRequireLogin = () => setLoginModalOpen(true);
    window.addEventListener('requireLogin', handleRequireLogin);
    return () => window.removeEventListener('requireLogin', handleRequireLogin);
  }, []);

  // Check for requireLogin param from middleware redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('requireLogin') === 'true') {
        setTimeout(() => window.dispatchEvent(new Event('requireLogin')), 100);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const { data: movies = [], isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => base44.entities.Movie.list(),
  });

  // Fetch TMDB data progressively on component mount
  useEffect(() => {
    const loadTMDBData = async () => {
      if (tmdbDataLoaded) return;

      const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
      const lastRefresh = parseInt(localStorage.getItem('lastCarouselRefresh') || '0');
      const needsRefresh = movies.length > 0 && (Date.now() - lastRefresh) > THREE_DAYS;
      const needsGenreRefresh = movies.length > 0 && movies.some((m: Movie) => !m.genre || m.genre.length === 0);

      if ((movies.length === 0 || needsGenreRefresh || needsRefresh) && !isLoading) {
        setTmdbLoading(true);

        // Se for refresh (3 dias), limpa tudo exceto personalized e atualiza timestamp
        if (needsRefresh) {
          const allMovies = await base44.entities.Movie.list();
          const kept = allMovies.filter((m: Movie) => m.category === 'personalized');
          localStorage.setItem('webflix_movies', JSON.stringify(kept));
          localStorage.setItem('lastCarouselRefresh', String(Date.now()));
        } else if (needsGenreRefresh) {
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
              // Lote 1: conteúdo principal (4 endpoints)
              const [upcoming, top10, recommended, popularSeries] = await Promise.all([
                TMDBService.fetchUpcoming(),
                TMDBService.fetchTop10(),
                TMDBService.fetchRecommended(),
                TMDBService.fetchPopularSeries()
              ]);
              if ([...upcoming, ...top10, ...recommended, ...popularSeries].length > 0) {
                await base44.entities.Movie.bulkCreate([...upcoming, ...top10, ...recommended, ...popularSeries]);
                queryClient.invalidateQueries({ queryKey: ['movies'] });
              }

              // Lote 2: gêneros (4 endpoints)
              await new Promise(r => setTimeout(r, 500));
              const [action, family, scifi, comedy] = await Promise.all([
                TMDBService.fetchActionMovies(),
                TMDBService.fetchFamilyMovies(),
                TMDBService.fetchSciFiMovies(),
                TMDBService.fetchComedyMovies()
              ]);
              if ([...action, ...family, ...scifi, ...comedy].length > 0) {
                await base44.entities.Movie.bulkCreate([...action, ...family, ...scifi, ...comedy]);
                queryClient.invalidateQueries({ queryKey: ['movies'] });
              }

              // Lote 3: mais gêneros + séries (4 endpoints)
              await new Promise(r => setTimeout(r, 500));
              const [romance, horror, animation, topRatedSeries] = await Promise.all([
                TMDBService.fetchRomanceMovies(),
                TMDBService.fetchHorrorMovies(),
                TMDBService.fetchAnimationMovies(),
                TMDBService.fetchTopRatedSeries()
              ]);
              if ([...romance, ...horror, ...animation, ...topRatedSeries].length > 0) {
                await base44.entities.Movie.bulkCreate([...romance, ...horror, ...animation, ...topRatedSeries]);
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
  const { data: rawWatchlist } = useQuery({
    queryKey: ['watchlist', userId],
    queryFn: () => fetch(`/api/watchlist?userId=${userId}`).then(r => r.json()),
    enabled: !!userId,
  });
  const watchlistData = rawWatchlist ?? { items: [] };

  // Histórico de exibição para "Continue Assistindo"
  const { data: rawWatchHistory } = useQuery({
    queryKey: ['watchHistory', userId],
    queryFn: () => fetch(`/api/watch-history?userId=${userId}`).then(r => r.json()),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const historyItems: WatchHistoryItem[] = rawWatchHistory?.items || [];
    if (historyItems.length === 0) {
      setContinueWatching([]);
      return;
    }
    const allMovies: Movie[] = movies || [];
    let cancelled = false;

    const initialMapped: Movie[] = historyItems.map((h: any) => {
      const match = allMovies.find(m => Number(m.tmdb_id) === Number(h.tmdb_id));
      return {
        id: match?.id || String(h.tmdb_id),
        tmdb_id: h.tmdb_id,
        title: match?.title || h.title,
        type: (h.media_type || match?.type || 'movie') as 'movie' | 'series',
        year: match?.year || 0,
        poster_url: match?.poster_url || h.poster_url || '',
        backdrop_url: match?.backdrop_url || h.backdrop_url || '',
        genre: match?.genre || [],
        score: match?.score,
        rating: match?.rating,
        season_number: h.media_type === 'series' ? h.season_number : undefined,
        episode_number: h.media_type === 'series' ? h.episode_number : undefined,
        total_seasons: h.media_type === 'series' ? h.total_seasons : undefined,
        total_episodes: h.media_type === 'series' ? h.total_episodes : undefined,
        season_episodes: h.media_type === 'series' ? h.season_episodes : undefined,
      };
    });
    setContinueWatching(initialMapped);

    const fetchMissingDetails = async () => {
      const updated = await Promise.all(initialMapped.map(async (movie) => {
        if (movie.score != null && movie.rating != null && movie.year > 0 && movie.poster_url) {
          return movie;
        }
        try {
          const details = movie.type === 'series'
            ? await TMDBService.fetchSeriesDetails(Number(movie.tmdb_id))
            : await TMDBService.fetchMovieDetails(Number(movie.tmdb_id));
          if (!details) return movie;
          const voteAvg = (details as any).vote_average ?? (details as any).voteAverage;
          const yearVal = (details as any).first_air_date ? new Date((details as any).first_air_date).getFullYear() : ((details as any).release_date ? new Date((details as any).release_date).getFullYear() : movie.year);
          const posterPath = (details as any).poster_path || (details as any).posterUrl;
          const backdropPath = (details as any).backdrop_path || (details as any).backdropUrl;
          const posterUrl = posterPath ? (posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w500${posterPath}`) : movie.poster_url;
          const backdropUrl = backdropPath ? (backdropPath.startsWith('http') ? backdropPath : `https://image.tmdb.org/t/p/w1280${backdropPath}`) : movie.backdrop_url;
          return {
            ...movie,
            poster_url: posterUrl || movie.poster_url,
            backdrop_url: backdropUrl || movie.backdrop_url,
            score: voteAvg != null ? parseFloat(Number(voteAvg).toFixed(1)) : movie.score,
            rating: details.ageRating || movie.rating,
            year: yearVal || movie.year,
            genre: details.genres?.length ? details.genres : movie.genre,
            total_episodes: (details as any).number_of_episodes,
            total_seasons: (details as any).number_of_seasons,
            season_episodes: (details as any).seasons?.find((s: any) => s.season_number === movie.season_number)?.episode_count || movie.season_episodes,
          };
        } catch {
          return movie;
        }
      }));
      if (!cancelled) {
        setContinueWatching(updated);
      }
    };

    fetchMissingDetails();
    return () => { cancelled = true; };
  }, [rawWatchHistory, movies]);

  const watchlistTmdbIds = new Set(watchlistData.items.map((i: any) => i.tmdb_id));
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
  const personalizedMovies = movies.filter((m: Movie) => m.category === 'personalized');

  // Embaralha uma vez quando os filmes carregam, varia o backdrop inicial a cada visita
  const shuffledHeroMovies = useMemo(() => {
    const trendingPool = trendingTodayMovies.length > 0
      ? trendingTodayMovies
      : featuredMovies.length > 0
        ? featuredMovies
        : [];
    const pool = [...trendingPool, ...personalizedMovies];
    if (pool.length === 0) return movies.slice(0, 10);
    return [...new Map(pool.map(m => [m.tmdb_id, m])).values()]
      .filter(m => !m.synopsis || m.synopsis.length <= 250)
      .sort(() => Math.random() - 0.5);
  }, [movies]);
  const trendingMovies = movies.filter((m: Movie) => m.category === 'trending');
  const topRatedMovies = movies.filter((m: Movie) => m.category === 'top_rated');
  const comingSoonMovies = movies.filter((m: Movie) => m.category === 'coming_soon');
  const recommendedMovies = movies.filter((m: Movie) => m.category === 'recommended');
  const top10Movies = movies.filter((m: Movie) => m.category === 'top_10');
  const actionMovies = movies.filter((m: Movie) => m.category === 'action');
  const familyMovies = movies.filter((m: Movie) => m.category === 'family');
  const sciFiMovies = movies.filter((m: Movie) => m.category === 'scifi');
  const comedyMovies = movies.filter((m: Movie) => m.category === 'comedy');
  const romanceMovies = movies.filter((m: Movie) => m.category === 'romance');
  const horrorMovies = movies.filter((m: Movie) => m.category === 'horror');
  const animationMovies = movies.filter((m: Movie) => m.category === 'animation');
  const seriesPopularMovies = movies.filter((m: Movie) => m.category === 'series_popular');
  const seriesTopRatedMovies = movies.filter((m: Movie) => m.category === 'series_top_rated');

  const handleWatch = (movie: Movie) => {
    if (!userId) {
      setModalOpen(false);
      setLoginModalOpen(true);
      return;
    }
    const params = new URLSearchParams({ id: String(movie.id) });
    if (movie.rank) params.set('rank', String(movie.rank));
    if (movie.season_number) params.set('season', String(movie.season_number));
    if (movie.episode_number) params.set('episode', String(movie.episode_number));
    if (movie.tmdb_id) params.set('ref', String(movie.tmdb_id));
    if (movie.type) params.set('type', movie.type);
    router.push(`/watch?${params}`);
    setTimeout(() => setModalOpen(false), 100);
  };

  const handleMoreInfo = (movie: Movie) => {
    if (!movie.rank) {
      const top10Index = top10Movies.findIndex(m => m.tmdb_id && m.tmdb_id === movie.tmdb_id);
      if (top10Index >= 0) {
        movie = { ...movie, rank: top10Index + 1 };
      }
    }
    setSelectedMovie(movie);
    setModalOpen(true);
  };

  const handleAddToList = (movie: Movie) => {
    addToListMutation.mutate(movie);
  };

  const handleRemoveFromList = (movie: Movie) => {
    removeFromListMutation.mutate(movie);
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Hero - Prioriza filmes em alta do dia */}
      <HeroSection
        featuredMovies={shuffledHeroMovies.length > 0 ? shuffledHeroMovies : movies.filter((m: Movie) => !m.synopsis || m.synopsis.length <= 250).slice(0, 3)}
        onWatch={handleWatch}
        onMoreInfo={handleMoreInfo}
        top10Ranks={Object.fromEntries(top10Movies.slice(0, 10).map((m, i) => [m.tmdb_id, i + 1]).filter(([id]) => id != null) as [number, number][])}
      />

      {/* Carousels */}
      <div className="-mt-[211px] relative z-20 pb-12 space-y-5">
        {continueWatching.length > 0 && (
          
          <Carousel
            title="Recém assistidos"
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

        {seriesPopularMovies.length > 0 && (
          
          <Carousel
            title="Séries Populares"
            movies={seriesPopularMovies}
            onMovieClick={handleMoreInfo}
          />
          
        )}

        {seriesTopRatedMovies.length > 0 && (
          
          <Carousel
            title="Melhores Séries"
            movies={seriesTopRatedMovies}
            onMovieClick={handleMoreInfo}
          />
          
        )}

        {comedyMovies.length > 0 && (
          
          <Carousel
            title="Comédia"
            movies={comedyMovies}
            onMovieClick={handleMoreInfo}
          />
          
        )}

        {romanceMovies.length > 0 && (
          
          <Carousel
            title="Romance"
            movies={romanceMovies}
            onMovieClick={handleMoreInfo}
          />
          
        )}

        {topRatedMovies.length > 0 && (
          
          <Carousel
            title="Mais Bem Avaliados"
            movies={topRatedMovies}
            onMovieClick={handleMoreInfo}
          />
          
        )}

        {familyMovies.length > 0 && (
          
          <Carousel
            title="Família"
            movies={familyMovies}
            onMovieClick={handleMoreInfo}
          />
          
        )}

        {horrorMovies.length > 0 && (
          
          <Carousel
            title="Terror"
            movies={horrorMovies}
            onMovieClick={handleMoreInfo}
          />
          
        )}

        {animationMovies.length > 0 && (
          
          <Carousel
            title="Animação"
            movies={animationMovies}
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

        {actionMovies.length > 0 && (
          
          <Carousel
            title="Ação"
            movies={actionMovies}
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

      {/* Login Modal */}
      <LoginRequiredModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
}
