import { Metadata } from 'next';
import WatchClient from './WatchClient';
import { TMDBService } from '@/components/streaming/TMDBIntegration';

export const revalidate = 3600; // Cache da página por 1 hora

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const id = searchParams.id as string;
    const tmdbId = searchParams.ref as string;
    const mediaType = (searchParams.type as string) || 'movie';

    if (!tmdbId) {
        return {
            title: 'Assistir - RAVEFLIX',
            description: 'Assista a milhares de filmes e séries online.',
        };
    }

    try {
        const data = (mediaType === 'series'
            ? await TMDBService.fetchSeriesDetails(Number(tmdbId))
            : await TMDBService.fetchMovieDetails(Number(tmdbId))) as any;

        const title = data?.title || data?.name || 'Assistir';
        const description = data?.overview || 'Assista online com qualidade no RAVEFLIX.';
        
        // Prioridade: Backdrop -> Poster
        const imagePath = data?.backdrop_path || data?.poster_path;
        const ogImage = imagePath ? `https://image.tmdb.org/t/p/w1280${imagePath}` : undefined;

        // URL do embed para o RAVE
        const embedUrl = mediaType === 'series'
            ? `https://megaembed.com/embed/${tmdbId}/1/1`
            : `https://megaembed.com/embed/${tmdbId}`;

        return {
            title: `${title} - RAVEFLIX`,
            description,
            openGraph: {
                title: `${title} - RAVEFLIX`,
                description,
                type: mediaType === 'series' ? 'video.tv_show' : 'video.movie',
                images: ogImage ? [{ url: ogImage, width: 1280, height: 720 }] : [],
                videos: [
                    {
                        url: embedUrl,
                        secureUrl: embedUrl,
                        type: 'text/html',
                        width: 1280,
                        height: 720,
                    }
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${title} - RAVEFLIX`,
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
    } catch (error) {
        console.error('Error fetching metadata:', error);
        
        // Fallback caso a API do TMDB falhe
        const embedUrl = mediaType === 'series'
            ? `https://megaembed.com/embed/${tmdbId}/1/1`
            : `https://megaembed.com/embed/${tmdbId}`;
            
        return {
            title: 'Assistir - RAVEFLIX',
            description: 'Assista online com qualidade no RAVEFLIX.',
            other: {
                'og:video': embedUrl,
                'og:video:url': embedUrl,
                'og:video:secure_url': embedUrl,
            }
        };
    }
}

export default function WatchPage() {
    return <WatchClient />;
}
