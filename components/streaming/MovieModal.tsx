'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Plus, ThumbsUp, Volume2, VolumeX, Check, Star } from 'lucide-react';
import { Movie } from '@/types/movie';
import { cn } from '@/lib/utils';
import { TMDBService } from './TMDBIntegration';

interface MovieModalProps {
    movie: Movie | null;
    isOpen: boolean;
    onClose: () => void;
    onWatch: (movie: Movie) => void;
    onAddToList: (movie: Movie, listType: 'favorites' | 'watch_later') => void;
}

export default function MovieModal({ movie, isOpen, onClose, onWatch, onAddToList }: MovieModalProps) {
    const [cast, setCast] = useState<any[]>([]);
    const [similar, setSimilar] = useState<Movie[]>([]);
    const [isMuted, setIsMuted] = useState(true);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoLoading, setLogoLoading] = useState(false);
    const [isOnNetflix, setIsOnNetflix] = useState(false);

    useEffect(() => {
        if (isOpen && movie) {
            setCast([]);
            setSimilar([]);
            setLogoUrl(null);

            // Se há tmdb_id, iniciamos loading do logo para evitar flash
            const hasTmdbId = !!(movie.tmdb_id || movie.id);
            setLogoLoading(hasTmdbId);

            TMDBService.fetchMovieDetails(Number(movie.tmdb_id || movie.id)).then(details => {
                if (details?.cast) setCast(details.cast.slice(0, 5));
            });

            TMDBService.fetchSimilar(Number(movie.tmdb_id || movie.id), movie.type === 'series').then(similarMovies => {
                setSimilar(similarMovies.slice(0, 3) as Movie[]);
            });

            TMDBService.fetchMovieLogos(Number(movie.tmdb_id || movie.id), movie.type === 'series').then(logos => {
                if (logos && logos.length > 0) {
                    setLogoUrl(logos[0].file_path);
                } else {
                    setLogoUrl(null);
                }
                setLogoLoading(false);
            }).catch(() => {
                setLogoUrl(null);
                setLogoLoading(false);
            });

            TMDBService.fetchWatchProviders(Number(movie.tmdb_id || movie.id)).then(providers => {
                if (providers?.flatrate) {
                    const hasNetflix = providers.flatrate.some(p => 
                        p.provider_name.toLowerCase().includes('netflix')
                    );
                    setIsOnNetflix(hasNetflix);
                }
            });

            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen, movie]);

    if (!movie) return null;

    const titleLines = movie.title.split(' ');
    const displayTitle = titleLines.length > 2 ? [titleLines.slice(0, Math.ceil(titleLines.length/2)).join(' '), titleLines.slice(Math.ceil(titleLines.length/2)).join(' ')] : [movie.title];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 overflow-y-auto scrollbar-hide py-8">
                    {/* Overlay with Radial Gradient */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#000]/78"
                        style={{
                            background: 'radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.08), transparent 34%), rgba(0, 0, 0, 0.78)'
                        }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-[850px] bg-[#181818] rounded-lg shadow-[0_28px_80px_rgba(0,0,0,0.65)] overflow-hidden my-8"
                    >
                        {/* Hero Section */}
                        <div className="relative h-[478px] w-full overflow-hidden">
                            {/* Backdrop Image Layer + Gradients */}
                            <div 
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: `
                                        linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.12) 30%, rgba(24, 24, 24, 0.92) 100%),
                                        linear-gradient(115deg, rgba(13, 13, 13, 0.15) 18%, rgba(13, 13, 13, 0.86) 58%, rgba(13, 13, 13, 1) 100%),
                                        radial-gradient(circle at 18% 24%, rgba(255, 235, 220, 0.22), transparent 28%),
                                        linear-gradient(135deg, #333 0%, #1a1a1a 100%),
                                        url("${movie.backdrop_url || movie.poster_url}")
                                    `,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center top',
                                    backgroundRepeat: 'no-repeat',
                                }}
                            />
                            
                            {/* Separate Layer for Screen Blending as in Reference */}
                            <div 
                                className="absolute inset-0 mix-blend-screen opacity-[0.4]"
                                style={{
                                    backgroundImage: `
                                        linear-gradient(90deg, rgba(0, 0, 0, 0.01) 0%, rgba(0, 0, 0, 0.24) 68%, rgba(0, 0, 0, 0.58) 100%),
                                        url("${movie.backdrop_url || movie.poster_url}")
                                    `,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center top',
                                }}
                            />

                            {/* Bottom Fade */}
                            <div className="absolute inset-x-0 bottom-0 h-[180px] bg-linear-to-t from-[#181818] via-[#181818]/94 to-transparent z-10" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 z-40 w-9 h-9 flex items-center justify-center bg-[#181818]/70 text-white rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" strokeWidth={2.2} />
                            </button>

                            {/* Title Shadow Layer — só renderiza quando não está carregando e não há logo */}
                            {!logoLoading && !logoUrl && (
                                <div className="absolute left-12 bottom-[108px] z-10 select-none pointer-events-none opacity-[0.34] blur-[8px] transform-gpu">
                                    <h1 className="text-[74px] font-[800] leading-[0.92] tracking-[-0.04em] uppercase text-black">
                                        {displayTitle.map((line, i) => <span key={i} className="block">{line}</span>)}
                                    </h1>
                                </div>
                            )}

                            {/* Main Title Area */}
                            <div className="absolute left-12 bottom-[108px] z-20">
                                {isOnNetflix && (
                                    <div className="flex items-center gap-2 mb-4 opacity-[0.74]">
                                        <img src="/assets/netflix-n.png" alt="Netflix" className="w-[18px] h-[32px] object-contain" />
                                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                                            {movie.type === 'series' ? 'Série' : 'Filme'}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Aguarda resolução do logo antes de exibir qualquer título */}
                                <AnimatePresence mode="wait">
                                    {!logoLoading && (
                                        logoUrl ? (
                                            <motion.img
                                                key="logo-img"
                                                src={`https://image.tmdb.org/t/p/original${logoUrl}`}
                                                alt={movie.title}
                                                className="h-32 object-contain filter drop-shadow-2xl"
                                                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                            />
                                        ) : (
                                            <motion.h1
                                                key="logo-text"
                                                className="text-[74px] font-[800] leading-[0.92] tracking-[-0.04em] uppercase text-white"
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                                            >
                                                {displayTitle.map((line, i) => <span key={i} className="block">{line}</span>)}
                                            </motion.h1>
                                        )
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Actions Area matching reference SVG structure */}
                            <div className="absolute left-12 bottom-10 z-30 flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onWatch(movie)}
                                        className="bg-white hover:bg-[#e6e6e6] text-black font-bold h-[43px] px-6 rounded-[4px] transition-all flex items-center gap-2"
                                    >
                                        <svg width="18" height="22" viewBox="0 0 20 24" fill="black">
                                            <path d="M19.4951 10.5876C20.1603 10.9831 20.1436 11.9519 19.465 12.324L1.4809 22.1878C0.8145 22.5533 0 22.0711 0 21.311L0 0.7577C0 -0.01775 0.8444 -0.49812 1.5109 -0.10191L19.4951 10.5876Z" transform="translate(0, 1)"/>
                                        </svg>
                                        <span className="text-base font-bold">Assistir</span>
                                    </button>

                                    <button
                                        onClick={() => onAddToList(movie, 'watch_later')}
                                        className="w-10 h-10 flex items-center justify-center bg-[#2a2a2a] hover:bg-[#333] border-2 border-white/50 rounded-full text-white transition-all backdrop-blur-md"
                                    >
                                        <Plus className="w-7 h-7" />
                                    </button>
                                    
                                    <button
                                        onClick={() => onAddToList(movie, 'favorites')}
                                        className="w-10 h-10 flex items-center justify-center bg-[#2a2a2a] hover:bg-[#333] border-2 border-white/50 rounded-full text-white transition-all backdrop-blur-md"
                                    >
                                        <ThumbsUp className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="fixed right-12 bottom-10">
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-white/10 border-2 border-white/20 rounded-full text-white transition-all"
                                    >
                                        {isMuted ? (
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                                <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
                                            </svg>
                                        ) : (
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Body Section */}
                        <div className="px-12 pb-12 pt-0 bg-[#181818]">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-12">
                                {/* Left Column: Summary */}
                                <div className="space-y-5">
                                    {/* Meta row: 98% Match, ano, duração, classificação, HD */}
                                    <div className="flex flex-wrap items-center gap-2 text-base">
                                        <span className="text-[#46d369] font-bold">98% Match</span>
                                        <span className="text-[#bcbcbc]">{movie.year}</span>
                                        <span className="text-[#bcbcbc]">{movie.type === 'series' ? '3 Temporadas' : movie.duration}</span>
                                        <span className="px-1.5 py-0.5 border border-[#808080] text-[11px] font-bold rounded-[4px] text-[#e5e5e5]">
                                            {movie.rating || '14+'}
                                        </span>
                                        <span className="px-1.5 py-0.5 border border-white/20 text-[10px] font-bold rounded-[4px] text-white/60">HD</span>
                                        <svg className="w-10 h-4" viewBox="0 0 39 16" fill="none" aria-label="Audiodescrição">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M0 16L11.1999 0H15.9999V16H11.9999V14.4H7.19996L5.59997 16H0ZM11.9999 5.6L8.8 10.4H11.9999V5.6Z" fill="#BCBCBC"/>
                                            <path fillRule="evenodd" clipRule="evenodd" d="M16.8 0V16H24.8C26.4 15.7 29.6 14.4 29.6 8C29.3 5.3 27.7 0 23.2 0H16.8ZM20.8 11.2V4.8C24 4.8 24.8 6.9 24.8 8C24.8 10.6 23.7 11.2 23.2 11.2H20.8Z" fill="#BCBCBC"/>
                                            <path d="M28.8 0C32 1.6 32 14.4 28.8 16H29.6C33.6 13.6 33.6 2.4 29.6 0L28.8 0Z" fill="#BCBCBC"/>
                                            <path d="M32 0C35.2 1.6 35.2 14.4 32 16H32.8C36.8 13.6 36.8 2.4 32.8 0L32 0Z" fill="#BCBCBC"/>
                                        </svg>
                                    </div>

                                    {/* Top 10 Badge — pixel-perfect do reference modal_detail/index.html */}
                                    {movie.rank && (
                                        <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-500">
                                            <svg
                                                width="245"
                                                height="30"
                                                viewBox="0 0 245 30"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                aria-label={`#${movie.rank} em ${movie.type === 'series' ? 'Séries' : 'Filmes'} hoje`}
                                            >
                                                {/* Quadrado vermelho do badge */}
                                                <rect y="1.0957" width="27.8086" height="27.8086" rx="3.47608" fill="#F50723"/>

                                                {/* Glifo "TOP" — paths exatos do reference */}
                                                <path d="M7.72649 13.7028H6.16834V8.3974H4.05576V7.04955H9.83908V8.3974H7.72649V13.7028Z" fill="white"/>
                                                <path d="M13.27 13.8557C12.7729 13.8557 12.3141 13.7697 11.903 13.5976C11.4824 13.4255 11.1192 13.1866 10.8228 12.8711C10.5169 12.5557 10.278 12.1924 10.1155 11.7622C9.94339 11.3416 9.85736 10.8828 9.85736 10.3762C9.85736 9.86951 9.94339 9.41067 10.1155 8.98051C10.278 8.5599 10.5169 8.19665 10.8228 7.8812C11.1192 7.56574 11.4824 7.32676 11.903 7.1547C12.3141 6.98263 12.7729 6.8966 13.27 6.8966C13.7766 6.8966 14.2355 6.98263 14.6561 7.1547C15.0671 7.32676 15.4304 7.56574 15.7363 7.8812C16.0422 8.19665 16.2812 8.5599 16.4532 8.98051C16.6157 9.41067 16.7018 9.86951 16.7018 10.3762C16.7018 10.8828 16.6157 11.3416 16.4532 11.7622C16.2812 12.1924 16.0422 12.5557 15.7363 12.8711C15.4304 13.1866 15.0671 13.4255 14.6561 13.5976C14.2355 13.7697 13.7766 13.8557 13.27 13.8557ZM13.27 12.4792C13.6333 12.4792 13.9583 12.3931 14.2355 12.2115C14.5127 12.0395 14.723 11.7909 14.8855 11.4755C15.048 11.16 15.1245 10.7968 15.1245 10.3762C15.1245 9.95555 15.048 9.58274 14.8855 9.26728C14.723 8.95183 14.5127 8.71285 14.2355 8.53123C13.9583 8.35916 13.6333 8.27313 13.27 8.27313C12.9163 8.27313 12.6009 8.35916 12.3236 8.53123C12.0464 8.71285 11.8266 8.95183 11.6736 9.26728C11.5111 9.58274 11.4346 9.95555 11.4346 10.3762C11.4346 10.7968 11.5111 11.16 11.6736 11.4755C11.8266 11.7909 12.0464 12.0395 12.3236 12.2115C12.6009 12.3931 12.9163 12.4792 13.27 12.4792Z" fill="white"/>
                                                {/* "P" de TOP */}
                                                <path d="M17.3002 13.7028V7.04955H20.0533C20.5982 7.04955 21.0761 7.14514 21.4681 7.33632C21.86 7.52751 22.1659 7.79517 22.3762 8.1393C22.5865 8.48343 22.6916 8.88492 22.6916 9.34376C22.6916 9.8026 22.5865 10.2041 22.3762 10.5482C22.1659 10.9019 21.86 11.1696 21.4681 11.3608C21.0761 11.5519 20.5982 11.6475 20.0533 11.6475H18.8584V13.7028H17.3002ZM18.8584 10.3284H19.8239C20.2732 10.3284 20.5982 10.2423 20.8085 10.0703C21.0092 9.90775 21.1144 9.65921 21.1144 9.34376C21.1144 9.0283 21.0092 8.78932 20.8085 8.61726C20.5982 8.45475 20.2732 8.36872 19.8239 8.36872H18.8584V10.3284Z" fill="white"/>

                                                {/* Número do rank dinâmico */}
                                                <text
                                                    x="9"
                                                    y="24"
                                                    fill="white"
                                                    fontSize="13"
                                                    fontWeight="900"
                                                    fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
                                                >
                                                    {movie.rank}
                                                </text>

                                                {/* Texto "#N em Séries hoje" */}
                                                <text
                                                    x="35"
                                                    y="21"
                                                    fill="white"
                                                    fontSize="17"
                                                    fontWeight="400"
                                                    fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
                                                >
                                                    #{movie.rank} em {movie.type === 'series' ? 'Séries' : 'Filmes'} hoje
                                                </text>
                                            </svg>
                                        </div>
                                    )}

                                    <p className="text-white text-[16px] leading-[26px] font-normal">
                                        {movie.synopsis}
                                    </p>
                                </div>

                                {/* Right Column: Meta */}
                                <div className="space-y-3.5 text-sm leading-5">
                                    <div className="flex flex-wrap gap-1">
                                        <span className="text-[#777777]">Elenco:</span>
                                        <span className="text-white">{cast.map(c => c.name).join(', ') || 'Informação indisponível'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="text-[#777777]">Gêneros:</span>
                                        <span className="text-white">{movie.genre?.join(', ') || 'Filmes, Séries'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="text-[#777777]">Este título é:</span>
                                        <span className="text-white">Cerebral, Inspirador, Empolgante</span>
                                    </div>
                                </div>
                            </div>

                            {/* More Like This Section */}
                            {similar.length > 0 && (
                                <div className="mt-12">
                                    <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Títulos semelhantes</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
                                        {similar.map((item, idx) => (
                                            <div 
                                                key={idx}
                                                className="bg-[#232323] rounded-md overflow-hidden group cursor-pointer shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                                            >
                                                <div className="relative h-[141px]">
                                                    <img 
                                                        src={item.backdrop_url || item.poster_url} 
                                                        alt="" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <span className="absolute bottom-2.5 right-2.5 text-base font-semibold text-white/92 bg-black/60 px-2 py-1 rounded-[3px] shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                                                        {item.year}
                                                    </span>
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                                                            <Play className="w-5 h-5 fill-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-4 pt-3.5 pb-4.5">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#46d369] text-base font-bold">98% Match</span>
                                                            <span className="px-1.5 border border-white/38 text-[13px] font-semibold rounded-[4px] text-white/88 leading-none py-1">
                                                                {item.rating || '14+'}
                                                            </span>
                                                        </div>
                                                        <button className="w-7 h-7 rounded-full border-2 border-white/62 flex items-center justify-center text-white hover:bg-white/10">
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-[#d2d2d2] text-[15px] line-clamp-3 leading-[1.45]">
                                                        {item.synopsis}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* About Section */}
                            <div className="mt-12 pt-6 border-t border-white/10">
                                <h3 className="text-2xl font-bold text-white mb-6">Sobre {movie.title}</h3>
                                <div className="grid grid-cols-[128px_1fr] gap-x-4.5 gap-y-2.5 text-[15px] leading-[1.5]">
                                    <div className="text-white/45">Direção:</div>
                                    <div className="text-[#d2d2d2]">Christopher Nolan</div>
                                    
                                    <div className="text-white/45">Elenco:</div>
                                    <div className="text-[#d2d2d2]">{cast.map(c => c.name).join(', ')}</div>
                                    
                                    <div className="text-white/45">Roteiro:</div>
                                    <div className="text-[#d2d2d2]">Jonathan Nolan</div>
                                    
                                    <div className="text-white/45">Gêneros:</div>
                                    <div className="text-[#d2d2d2]">{movie.genre?.join(', ')}</div>
                                    
                                    <div className="text-white/45">Este título é:</div>
                                    <div className="text-[#d2d2d2]">Cerebral, Inspirador, Empolgante</div>
                                    
                                    <div className="text-white/45">Classificação:</div>
                                    <div className="text-[#d2d2d2]">
                                        <div className="flex flex-col gap-1">
                                            <span className="px-2 py-0.5 border border-gray-600 rounded text-[10px] w-fit text-white">
                                                {movie.rating || '14+'}
                                            </span>
                                            <span className="text-[10px] text-gray-500">recomendado para maiores de {movie.rating || '14'} anos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
