const cache = new Map<number, boolean>();

export async function checkHasNewSeason(tmdbId: number): Promise<boolean> {
  if (cache.has(tmdbId)) return cache.get(tmdbId)!;

  try {
    const { TMDBService } = await import('@/components/streaming/TMDBIntegration');
    const series = await TMDBService.fetchSeriesDetails(tmdbId);
    if (!series?.seasons) return false;

    const currentYear = new Date().getFullYear();
    const hasNewSeasonThisYear = series.seasons.some((s: any) => {
      if (!s.air_date) return false;
      const year = new Date(s.air_date).getFullYear();
      return year === currentYear;
    });

    cache.set(tmdbId, hasNewSeasonThisYear);
    return hasNewSeasonThisYear;
  } catch {
    return false;
  }
}
