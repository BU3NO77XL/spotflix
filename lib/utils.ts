import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Page URL creator (simplified for Next.js)
export function createPageUrl(page: string): string {
    const routes: Record<string, string> = {
        Home: "/",
        MyList: "/my-list",
        Watch: "/watch",
    };
    return routes[page] || "/";
}

// Convert score from 10-point scale to 5-point scale
export function convertScoreToFivePoint(score: number): string {
    const converted = score / 2;
    // Always show one decimal place
    return converted.toFixed(1);
}
// Helper para garantir que URLs de vídeo sejam carregadas corretamente em produção
export function getAnimatedBackdropUrl(relativePath: string): string {
    // Garantir que o caminho comece com /
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    
    // Em desenvolvimento e produção, usar caminho relativo para o arquivo público
    return path;
}