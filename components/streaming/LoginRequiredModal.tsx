'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Bookmark, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LoginRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
}

async function fetchTrendingBackdrops(): Promise<string[]> {
    try {
        const res = await fetch('/api/content/trending/all/week?language=pt-BR');
        if (!res.ok) return [];
        const data = await res.json();
        return (data.results || [])
            .filter((item: any) => item.backdrop_path)
            .map((item: any) => `https://image.tmdb.org/t/p/w780${item.backdrop_path}`)
            .slice(0, 9);
    } catch {
        return [];
    }
}

const FALLBACK_BACKDROPS = [
    'https://image.tmdb.org/t/p/w780/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg',
    'https://image.tmdb.org/t/p/w780/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    'https://image.tmdb.org/t/p/w780/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
    'https://image.tmdb.org/t/p/w780/qjiskwlV1qQzRCjpV0cL9pEMF9a.jpg',
    'https://image.tmdb.org/t/p/w780/4EYPN5mVIhKLfxGruy7Dy41dTVn.jpg',
    'https://image.tmdb.org/t/p/w780/gErDSuDPBBnM8nGnmAo3cnwuN1p.jpg',
];

const BENEFITS = [
    {
        icon: Play,
        title: 'Continue de onde parou',
        desc: 'Sincronize seu histórico e episódios assistidos.',
    },
    {
        icon: Bookmark,
        title: 'Sua lista personalizada',
        desc: 'Salve filmes e séries favoritos para ver depois.',
    },
    {
        icon: Sparkles,
        title: 'Recomendações exclusivas',
        desc: 'Descubra conteúdos baseados no seu gosto.',
    },
];

export default function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
    const router = useRouter();
    const [backdrops, setBackdrops] = useState<string[]>(FALLBACK_BACKDROPS);
    const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (!hasFetched) {
            setHasFetched(true);
            fetchTrendingBackdrops().then(urls => {
                if (urls.length >= 6) setBackdrops(urls);
            });
        }
    }, [hasFetched]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleLogin = () => {
        onClose();
        router.push('/login');
    };

    const gridBackdrops = backdrops.slice(0, 6);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    {/* Overlay — radial-gradient exatamente como o estilo original do MovieModal */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        className="fixed inset-0"
                        style={{
                            background: 'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.08), transparent 34%), rgba(0,0,0,0.82)'
                        }}
                    />

                    {/* Card Principal do Modal — estilo e fundo original #181818 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-sm rounded-xl shadow-[0_28px_80px_rgba(0,0,0,0.85)] overflow-hidden z-10"
                        style={{ background: '#181818' }}
                    >
                        {/* ─── HERO BACKDROP ─── */}
                        <div className="relative h-[190px] w-full overflow-hidden rounded-t-xl">
                            {/* Mosaico de imagens dinâmicas */}
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-[2px]">
                                {gridBackdrops.map((url, i) => (
                                    <div key={url + i} className="relative overflow-hidden bg-[#111]">
                                        <img
                                            src={url}
                                            alt=""
                                            className={`w-full h-full object-cover transition-opacity duration-700 ${loadedImages[i] ? 'opacity-100' : 'opacity-0'}`}
                                            onLoad={() => setLoadedImages(prev => ({ ...prev, [i]: true }))}
                                            loading="eager"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Gradientes idênticos ao estilo original do MovieModal */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: `
                                        linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.12) 30%, rgba(24,24,24,0.97) 100%),
                                        linear-gradient(115deg, rgba(13,13,13,0.10) 18%, rgba(13,13,13,0.40) 58%, rgba(13,13,13,0.75) 100%),
                                        radial-gradient(circle at 18% 24%, rgba(255,235,220,0.22), transparent 28%)
                                    `,
                                }}
                            />

                            {/* Brilho âmbar discreto idêntico ao original */}
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                animate={{ opacity: [0.18, 0.35, 0.18] }}
                                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,210,150,0.32) 0%, transparent 70%)',
                                }}
                            />

                            {/* Fade inferior integrando com o fundo #181818 */}
                            <div
                                className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
                                style={{ background: 'linear-gradient(to top, #181818 0%, transparent 100%)' }}
                            />

                            {/* Botão Fechar sem fundo */}
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 z-20 p-1.5 text-white/60 hover:text-white transition-colors duration-200"
                                aria-label="Fechar"
                            >
                                <X className="w-5 h-5" strokeWidth={2} />
                            </button>
                        </div>

                        {/* ─── CORPO DO MODAL ─── */}
                        <div className="px-7 pt-1 pb-6 flex flex-col items-center text-center">
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.12, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                                className="text-white mb-2 leading-tight"
                                style={{
                                    fontSize: '22px',
                                    fontWeight: 900,
                                    fontFamily: '"Netflix Sans"',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                Entre para continuar
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.18, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    fontSize: '14px',
                                    fontFamily: '"Netflix Sans"',
                                    fontWeight: 400,
                                    color: 'rgba(255,255,255,0.70)',
                                    lineHeight: 1.5,
                                    maxWidth: '260px',
                                    marginBottom: '20px',
                                }}
                            >
                                Faça login na sua conta para liberar todos os recursos da plataforma.
                            </motion.p>

                            {/* Lista de Benefícios */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.22, duration: 0.38 }}
                                className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-3 mb-6 text-left space-y-2.5"
                            >
                                {BENEFITS.map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="p-1.5 rounded-md bg-white/10 text-white shrink-0 mt-0.5">
                                                <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white leading-tight" style={{ fontFamily: '"Netflix Sans"' }}>{item.title}</h4>
                                                <p className="text-[11px] text-white/60 leading-tight mt-0.5" style={{ fontFamily: '"Netflix Sans"' }}>{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>

                            {/* Botão Fazer Login Original */}
                            <motion.button
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.28, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                                onClick={handleLogin}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: '100%',
                                    background: 'white',
                                    color: 'black',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    fontFamily: '"Netflix Sans"',
                                    letterSpacing: '0.01em',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#e6e6e6')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                            >
                                Fazer login
                            </motion.button>

                            {/* Botão Secundário em Texto Cinza */}
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.32, duration: 0.38 }}
                                onClick={onClose}
                                className="w-full mt-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                                style={{ fontFamily: '"Netflix Sans"' }}
                            >
                                Continuar apenas navegando
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
