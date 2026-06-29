'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Heart, Bookmark, Sparkles, LogIn, ChevronRight } from 'lucide-react';
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    {/* Backdrop Overlay com desfoque e gradiente radial */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md"
                        style={{
                            background: 'radial-gradient(circle at 50% 30%, rgba(229, 9, 20, 0.15), rgba(0, 0, 0, 0.9) 70%)'
                        }}
                    />

                    {/* Card Principal do Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl shadow-[0_32px_96px_rgba(0,0,0,0.95)] overflow-hidden z-10"
                    >
                        {/* Header Visual com Mosaico de Filmes */}
                        <div className="relative h-48 w-full overflow-hidden">
                            {/* Mosaico de Imagens */}
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 scale-105">
                                {gridBackdrops.map((url, i) => (
                                    <div key={url + i} className="relative overflow-hidden bg-[#111]">
                                        <img
                                            src={url}
                                            alt=""
                                            className={`w-full h-full object-cover transition-all duration-1000 transform hover:scale-110 ${loadedImages[i] ? 'opacity-80' : 'opacity-0'}`}
                                            onLoad={() => setLoadedImages(prev => ({ ...prev, [i]: true }))}
                                            loading="eager"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Overlay de Gradiente Escuro e Vermelho Netflix */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: `
                                        linear-gradient(180deg, rgba(22,22,22,0.2) 0%, rgba(22,22,22,0.85) 70%, #161616 100%),
                                        radial-gradient(circle at 50% 0%, rgba(229, 9, 20, 0.4), transparent 70%)
                                    `
                                }}
                            />

                            {/* Badge central flutuante com brilho */}
                            <div className="absolute inset-0 flex items-center justify-center pb-2">
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
                                    className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E50914] to-[#B80710] text-white shadow-[0_0_30px_rgba(229,9,20,0.6)] border border-white/20"
                                >
                                    <LogIn className="w-8 h-8 stroke-[2.5]" />
                                </motion.div>
                            </div>

                            {/* Botão Fechar */}
                            <button
                                onClick={onClose}
                                className="absolute top-3.5 right-3.5 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/90 border border-white/10 transition-all duration-200"
                                aria-label="Fechar"
                            >
                                <X className="w-5 h-5" strokeWidth={2} />
                            </button>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="px-6 sm:px-8 pt-2 pb-8 flex flex-col items-center text-center">
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2"
                                style={{ fontFamily: '"Netflix Sans"' }}
                            >
                                Entre para Continuar
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.3 }}
                                className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed"
                                style={{ fontFamily: '"Netflix Sans"' }}
                            >
                                Crie sua conta ou faça login para ter acesso a todos os recursos exclusivos da plataforma.
                            </motion.p>

                            {/* Lista de Benefícios */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3.5 mb-7 text-left space-y-3"
                            >
                                {BENEFITS.map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="p-1.5 rounded-lg bg-[#E50914]/15 text-[#E50914] shrink-0 mt-0.5">
                                                <Icon className="w-4 h-4 stroke-[2.5]" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-white leading-snug">{item.title}</h4>
                                                <p className="text-[11px] text-gray-400 leading-tight">{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>

                            {/* Botões de Ação */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25, duration: 0.3 }}
                                className="w-full space-y-3"
                            >
                                <motion.button
                                    onClick={handleLogin}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#E50914] via-[#F50723] to-[#E50914] text-white font-bold text-base shadow-[0_4px_25px_rgba(229,9,20,0.45)] hover:shadow-[0_6px_30px_rgba(229,9,20,0.6)] transition-all duration-200 flex items-center justify-center gap-2 group"
                                    style={{ fontFamily: '"Netflix Sans"' }}
                                >
                                    <span>Fazer login ou Cadastrar</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                </motion.button>

                                <button
                                    onClick={onClose}
                                    className="w-full py-2.5 px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                                    style={{ fontFamily: '"Netflix Sans"' }}
                                >
                                    Continuar apenas navegando
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
