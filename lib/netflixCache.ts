const cache = new Map<number, boolean>();

export async function checkIsOnNetflix(tmdbId: number, type: 'movie' | 'series'): Promise<boolean> {
  if (cache.has(tmdbId)) return cache.get(tmdbId)!;

  try {
    const { TMDBService } = await import('@/components/streaming/TMDBIntegration');
    const providers = await TMDBService.fetchWatchProviders(tmdbId, type === 'series');
    const isNetflix = providers?.flatrate?.some(p =>
      p.provider_name.toLowerCase().includes('netflix')
    ) ?? false;
    cache.set(tmdbId, isNetflix);
    return isNetflix;
  } catch {
    return false;
  }
}
