// TMDB API Service - Handles all API calls to The Movie Database
export class TMDBApiService {
  private static readonly BASE_URL = '/api/content';

  private static async fetchFromTMDB<T = unknown>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }
      return await response.json() as T;
    } catch (error) {
      console.error('TMDB API call failed:', error);
      throw error;
    }
  }

  // Movie endpoints
  static async getTrending(timeWindow: 'day' | 'week' = 'day') {
    return this.fetchFromTMDB(`/trending/all/${timeWindow}`);
  }

  static async getTopRatedMovies() {
    return this.fetchFromTMDB('/movie/top_rated');
  }

  static async getUpcomingMovies() {
    return this.fetchFromTMDB('/movie/upcoming');
  }

  static async getPopularMovies() {
    return this.fetchFromTMDB('/movie/popular');
  }

  static async getActionMovies() {
    return this.fetchFromTMDB('/discover/movie?with_genres=28');
  }

  static async getFamilyMovies() {
    return this.fetchFromTMDB('/discover/movie?with_genres=10751');
  }

  static async getSciFiMovies() {
    return this.fetchFromTMDB('/discover/movie?with_genres=878');
  }

  // Series endpoints
  static async getTopRatedSeries() {
    return this.fetchFromTMDB('/tv/top_rated');
  }

  static async getPopularSeries() {
    return this.fetchFromTMDB('/tv/popular');
  }

  // Details endpoints
  static async getMovieDetails(movieId: number) {
    return this.fetchFromTMDB(`/movie/${movieId}?append_to_response=credits,videos,keywords`);
  }

  static async getSeriesDetails(seriesId: number) {
    return this.fetchFromTMDB(`/tv/${seriesId}?append_to_response=credits,videos,keywords`);
  }

  static async getMovieImages(movieId: number) {
    return this.fetchFromTMDB(`/movie/${movieId}/images`);
  }

  static async getSeriesImages(seriesId: number) {
    return this.fetchFromTMDB(`/tv/${seriesId}/images`);
  }

  static async getMovieKeywords(movieId: number) {
    return this.fetchFromTMDB(`/movie/${movieId}/keywords`);
  }

  static async getSeriesKeywords(seriesId: number) {
    return this.fetchFromTMDB(`/tv/${seriesId}/keywords`);
  }

  // Search
  static async search(query: string) {
    return this.fetchFromTMDB(`/search/multi?query=${encodeURIComponent(query)}`);
  }

  // Configuration
  static async getConfiguration() {
    return this.fetchFromTMDB('/configuration');
  }
}