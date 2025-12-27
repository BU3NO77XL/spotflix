'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useRouterPreload() {
  const router = useRouter();

  const preloadRoute = useCallback((href: string) => {
    // Preload da rota para navegação mais rápida
    router.prefetch(href);
  }, [router]);

  const navigateWithPreload = useCallback((href: string) => {
    // Navegação otimizada
    router.push(href);
  }, [router]);

  return { preloadRoute, navigateWithPreload };
}