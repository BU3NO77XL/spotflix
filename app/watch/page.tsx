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
            title: 'Assistir - Spotflix',
            description: 'Assista a milhares de filmes e séries online.',
        };
    }

    try {
        const data = (mediaType === 'series'
            ? await TMDBService.fetchSeriesDetails(Number(tmdbId))
            : await TMDBService.fetchMovieDetails(Number(tmdbId))) as any;

        const title = data?.title || data?.name || 'Assistir';
        const description = data?.overview || 'Assista online com qualidade no Spotflix.';
        
        // Prioridade: Backdrop -> Poster
        const imagePath = data?.backdrop_path || data?.poster_path;
        const ogImage = imagePath ? `https://image.tmdb.org/t/p/w1280${imagePath}` : undefined;

        return {
            title: `${title} - Spotflix`,
            description,
            openGraph: {
                title: `${title} - Spotflix`,
                description,
                type: mediaType === 'series' ? 'video.tv_show' : 'video.movie',
                images: ogImage ? [{ url: ogImage, width: 1280, height: 720 }] : [],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${title} - Spotflix`,
                description,
                images: ogImage ? [ogImage] : [],
            }
        };
    } catch (e) {
        return {
            title: 'Assistir - Spotflix',
        };
    }
}

export default function WatchPage() {
    return <WatchClient />;
}
