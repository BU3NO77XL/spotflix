'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { LogoStoreProvider } from '@/stores/logoStore';

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 60, // 1 hour - movie data rarely changes
                gcTime: 1000 * 60 * 60 * 2, // 2 hours - keep in cache longer
                refetchOnWindowFocus: false,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <LogoStoreProvider>
                {children}
            </LogoStoreProvider>
        </QueryClientProvider>
    );
}
