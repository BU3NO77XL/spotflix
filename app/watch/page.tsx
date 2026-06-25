import { Metadata } from 'next';
import WatchClient from './WatchClient';

export const revalidate = 3600;

// generateMetadata com timeout para não bloquear a navegação em produção
// Se a API demorar mais de 2s, retorna metadados genéricos e não segura o usuário
export async function generateMetadata(
    props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const tmdbId = searchParams.ref as string;
    const mediaType = (searchParams.type as string) || 'movie';

    if (!tmdbId) {
        return {
            title: 'Assistir - WEBFLIX',
            description: 'Assista a milhares de filmes e séries online.',
        };
    }

    const embedUrl = mediaType === 'series'
        ? `https://megaembed.com/embed/${tmdbId}/1/1`
        : `https://megaembed.com/embed/${tmdbId}`;

    const fallback: Metadata = {
        title: 'Assistir - WEBFLIX',
        description: 'Assista online com qualidade no WEBFLIX.',
        other: {
            'og:video': embedUrl,
            'og:video:url': embedUrl,
            'og:video:secure_url': embedUrl,
        }
    };

    try {
        // Timeout de 1.5s — se a API demorar mais, usa fallback e não bloqueia
        const endpoint = mediaType === 'series'
            ? `https://api.themoviedb.org/3/tv/${tmdbId}?language=pt-BR&api_key=${process.env.TMDB_API_KEY}`
            : `https://api.themoviedb.org/3/movie/${tmdbId}?language=pt-BR&api_key=${process.env.TMDB_API_KEY}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);

        const response = await fetch(endpoint, {
            signal: controller.signal,
            next: { revalidate: 3600 }
        });
        clearTimeout(timeout);

        if (!response.ok) return fallback;

        const data = await response.json();
        const title = data?.title || data?.name || 'Assistir';
        const description = data?.overview || `Assista ${title} online com qualidade no WEBFLIX.`;
        const imagePath = data?.backdrop_path || data?.poster_path;
        const ogImage = imagePath ? `https://image.tmdb.org/t/p/w1280${imagePath}` : undefined;

        return {
            title: `${title} - WEBFLIX`,
            description,
            openGraph: {
                title: `${title} - WEBFLIX`,
                description,
                type: mediaType === 'series' ? 'video.tv_show' : 'video.movie',
                images: ogImage ? [{ url: ogImage, width: 1280, height: 720 }] : [],
                videos: [{ url: embedUrl, secureUrl: embedUrl, type: 'text/html', width: 1280, height: 720 }],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${title} - WEBFLIX`,
                description,
                images: ogImage ? [ogImage] : [],
            },
            other: {
                'og:video': embedUrl,
                'og:video:url': embedUrl,
                'og:video:secure_url': embedUrl,
                'og:video:type': 'text/html',
                'og:video:width': '1280',
                'og:video:height': '720',
            }
        };
    } catch {
        return fallback;
    }
}

export default function WatchPage() {
    return <WatchClient />;
}
