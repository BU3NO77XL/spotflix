// ========= CACHE CONSOLIDADO - SUBSTITUI netflixCache E platformCache =========

interface PlatformInfo {
  onNetflix: boolean;
  onHbo: boolean;
}

const cache = new Map<string, PlatformInfo>();
const STORAGE_KEY = 'spotflix_platform_cache';

function cacheKey(tmdbId: number, type: 'movie' | 'series'): string {
  return `${tmdbId}:${type}`;
}

function loadFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as [string, PlatformInfo][];
      parsed.forEach(([key, info]) => cache.set(key, info));
    }
  } catch { /* ignore */ }
}

function saveToStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const entries: [string, PlatformInfo][] = [];
    cache.forEach((info, key) => entries.push([key, info]));
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

async function checkPlatforms(tmdbId: number, type: 'movie' | 'series'): Promise<PlatformInfo> {
  const key = cacheKey(tmdbId, type);
  if (cache.has(key)) return cache.get(key)!;

  // Verifica também se o tipo oposto já foi resolvido (evita re-fetch quando tipo está errado)
  const oppositeType = type === 'movie' ? 'series' : 'movie';
  const oppositeKey = `${tmdbId}:${oppositeType}`;
  if (cache.has(oppositeKey)) {
    const result = cache.get(oppositeKey)!;
    cache.set(key, result); // propaga para a chave solicitada
    return result;
  }

  try {
    const { TMDBService } = await import('@/components/streaming/TMDBIntegration');
    const providers = await TMDBService.fetchWatchProviders(tmdbId, type === 'series');
    const info = extractPlatforms(providers);
    cache.set(key, info);
    saveToStorage();
    return info;
  } catch {
    return { onNetflix: false, onHbo: false };
  }
}

// ========= FUNÇÕES PÚBLICAS (compatibilidade com código existente) =========

export async function checkIsOnNetflix(tmdbId: number, type: 'movie' | 'series'): Promise<boolean> {
  const info = await checkPlatforms(tmdbId, type);
  return info.onNetflix;
}

export async function checkIsOnHbo(tmdbId: number, type: 'movie' | 'series'): Promise<boolean> {
  const info = await checkPlatforms(tmdbId, type);
  return info.onHbo;
}

export function getNetflixStatus(tmdbId: number, type: 'movie' | 'series'): boolean | null {
  const info = cache.get(cacheKey(tmdbId, type));
  return info ? info.onNetflix : null;
}

export function isChecked(tmdbId: number, type: 'movie' | 'series'): boolean {
  return cache.has(cacheKey(tmdbId, type));
}
