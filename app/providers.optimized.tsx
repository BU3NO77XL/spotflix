/**
 * VERSÃO OTIMIZADA DO PROVIDERS
 * 
 * Melhorias implementadas:
 * 1. Cache mais longo (1 hora vs 1 minuto)
 * 2. Não recarrega ao focar janela
 * 3. Retry inteligente
 * 4. Garbage collection otimizado
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ANTES: staleTime: 1000 * 60 (1 minuto)
            // DEPOIS: 1 hora - dados de filmes raramente mudam
            staleTime: 1000 * 60 * 60, // 1 hora

            // Tempo que dados ficam em cache antes de serem removidos
            gcTime: 1000 * 60 * 60 * 24, // 24 horas (antes era cacheTime)

            // Não recarregar automaticamente ao focar janela
            // (economiza requisições desnecessárias)
            refetchOnWindowFocus: false,

            // Não recarregar ao reconectar (a menos que dados estejam stale)
            refetchOnReconnect: false,

            // Retry inteligente: apenas em erros de rede, não em 404/403
            retry: (failureCount, error: any) => {
              // Não fazer retry em erros de cliente (4xx)
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              // Fazer até 2 retries em erros de servidor (5xx) ou rede
              return failureCount < 2;
            },

            // Delay entre retries (exponencial backoff)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry para mutations apenas em erros de rede
            retry: (failureCount, error: any) => {
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              return failureCount < 1; // Apenas 1 retry para mutations
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

/**
 * IMPACTO DAS MUDANÇAS:
 * 
 * 1. staleTime: 1 hora
 *    - Reduz requisições à API em 98% (de 60 req/hora para 1 req/hora)
 *    - Dados de filmes raramente mudam, então é seguro
 * 
 * 2. refetchOnWindowFocus: false
 *    - Evita recarregar dados toda vez que usuário volta à aba
 *    - Economiza banda e requisições à API
 * 
 * 3. gcTime: 24 horas
 *    - Mantém dados em cache por mais tempo
 *    - Usuário pode navegar entre páginas sem recarregar
 * 
 * 4. Retry inteligente
 *    - Não tenta novamente em erros 404/403 (inútil)
 *    - Tenta apenas em erros de rede/servidor
 *    - Economiza requisições desnecessárias
 * 
 * RESULTADO ESPERADO:
 * - 95% menos requisições à API TMDB
 * - Navegação mais rápida (dados já em cache)
 * - Menor consumo de banda
 * - Melhor experiência do usuário
 */
