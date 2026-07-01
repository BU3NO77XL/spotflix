const cache = new Map<number, boolean>();

// Sistema de batching para evitar muitas chamadas simultâneas
const pendingBatch = new Set<number>();
let batchTimeout: NodeJS.Timeout | null = null;

async function processBatch(tmdbIds: number[]): Promise<Map<number, boolean>> {
  const results = new Map<number, boolean>();
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 800;

  try {
    const { TMDBService } = await import('@/components/streaming/TMDBIntegration');
    
    // Processa em chunks menores com delay
    for (let i = 0; i < tmdbIds.length; i += BATCH_SIZE) {
      const chunk = tmdbIds.slice(i, i + BATCH_SIZE);
      
      const promises = chunk.map(async (tmdbId) => {
        try {
          const series = await TMDBService.fetchSeriesDetails(tmdbId);
          if (!series?.seasons) return [tmdbId, false] as [number, boolean];

          const currentYear = new Date().getFullYear();
          const hasNewSeasonThisYear = series.seasons.some((s: any) => {
            if (!s.air_date) return false;
            const year = new Date(s.air_date).getFullYear();
            return year === currentYear;
          });

          return [tmdbId, hasNewSeasonThisYear] as [number, boolean];
        } catch {
          return [tmdbId, false] as [number, boolean];
        }
      });

      const chunkResults = await Promise.allSettled(promises);
      chunkResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const [id, hasNew] = result.value;
          cache.set(id, hasNew);
          results.set(id, hasNew);
          pendingBatch.delete(id);
        }
      });

      // Delay entre chunks (exceto no último)
      if (i + BATCH_SIZE < tmdbIds.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
  } catch (err) {
    // Em caso de erro geral, marca todos como false e remove do pending
    tmdbIds.forEach(id => {
      cache.set(id, false);
      results.set(id, false);
      pendingBatch.delete(id);
    });
  }

  return results;
}

export async function checkHasNewSeason(tmdbId: number): Promise<boolean> {
  if (cache.has(tmdbId)) return cache.get(tmdbId)!;
  
  // Se já está sendo processado, aguarda o batch
  if (pendingBatch.has(tmdbId)) {
    // Aguarda até aparecer no cache (máximo 10s)
    let attempts = 0;
    while (!cache.has(tmdbId) && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    return cache.get(tmdbId) ?? false;
  }

  // Adiciona ao batch pendente
  pendingBatch.add(tmdbId);

  // Se é o primeiro item do batch, agenda processamento
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }

  batchTimeout = setTimeout(async () => {
    const idsToProcess = Array.from(pendingBatch);
    if (idsToProcess.length > 0) {
      await processBatch(idsToProcess);
    }
    batchTimeout = null;
  }, 150); // Aguarda 150ms para acumular mais IDs

  // Retorna false por enquanto (será atualizado quando o batch processar)
  return false;
}

// Função para verificar múltiplos IDs de uma vez (útil para carrosséis)
export async function checkMultipleNewSeasons(tmdbIds: number[]): Promise<Map<number, boolean>> {
  const uncachedIds = tmdbIds.filter(id => !cache.has(id));
  
  if (uncachedIds.length === 0) {
    // Todos já estão em cache
    const results = new Map<number, boolean>();
    tmdbIds.forEach(id => results.set(id, cache.get(id) ?? false));
    return results;
  }

  // Processa os não-cacheados em batch
  await processBatch(uncachedIds);
  
  // Retorna todos os resultados
  const results = new Map<number, boolean>();
  tmdbIds.forEach(id => results.set(id, cache.get(id) ?? false));
  return results;
}
