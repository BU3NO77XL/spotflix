import { Movie } from '@/types/movie';

interface PlatformInfo {
  onNetflix: boolean;
  onHbo: boolean;
}

const cache = new Map<number, PlatformInfo>();
const STORAGE_KEY = 'spotflix_platform_cache';

function loadFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as [number, PlatformInfo][];
      parsed.forEach(([id, info]) => cache.set(id, info));
    }
  } catch { /* ignore */ }
}

function saveToStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const entries: [number, PlatformInfo][] = [];
    cache.forEach((info, id) => entries.push([id, info]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* ignore */ }
}

loadFromStorage();

function extractPlatforms(providers: { flatrate?: { provider_name: string }[] } | null): PlatformInfo {
  if (!providers?.flatrate) return { onNetflix: false, onHbo: false };
  return {
    onNetflix: providers.flatrate.some(p =>
      p.provider_name.toLowerCase().includes('netflix')
    ),
    onHbo: providers.flatrate.some(p =>
      p.provider_name.toLowerCase().includes('hbo') ||
      p.provider_name.toLowerCase().includes('max')
    ),
  };
}

export async function checkPlatforms(movie: Movie): Promise<PlatformInfo> {
  const tmdbId = Number(movie.tmdb_id);
  if (!tmdbId) return { onNetflix: false, onHbo: false };
  if (cache.has(tmdbId)) return cache.get(tmdbId)!;

  try {
    const { TMDBService } = await import('@/components/streaming/TMDBIntegration');
    const providers = await TMDBService.fetchWatchProviders(tmdbId, movie.type === 'series');
    const info = extractPlatforms(providers);
    cache.set(tmdbId, info);
    saveToStorage();
    return info;
  } catch {
    return { onNetflix: false, onHbo: false };
  }
}

const BATCH_SIZE = 5;
const BATCH_DELAY = 1500;

export async function batchCheckPlatforms(
  movies: Movie[],
  onProgress?: (totalChecked: number) => void
): Promise<Map<number, boolean>> {
  const eligible = movies.filter(m => Number(m.tmdb_id) && !cache.has(Number(m.tmdb_id)));
  const unique = new Map<number, Movie>();
  eligible.forEach(m => unique.set(Number(m.tmdb_id), m));
  const entries = Array.from(unique.values());

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(m => checkPlatforms(m)));
    if (onProgress) onProgress(Math.min(i + BATCH_SIZE, entries.length));
    if (i + BATCH_SIZE < entries.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }

  const result = new Map<number, boolean>();
  movies.forEach(m => {
    const id = Number(m.tmdb_id);
    const info = cache.get(id);
    if (info) {
      result.set(id, info.onNetflix || info.onHbo);
    }
  });
  return result;
}

export function isOnNetflixOrHbo(movie: Movie): boolean {
  const id = Number(movie.tmdb_id);
  if (!id || !cache.has(id)) return true;
  const info = cache.get(id)!;
  return info.onNetflix || info.onHbo;
}

export function isChecked(movie: Movie): boolean {
  return cache.has(Number(movie.tmdb_id));
}
