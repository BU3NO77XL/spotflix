'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LoginRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Busca backdrops de filmes trending no TMDB
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

// Fallback estático caso a API falhe
const FALLBACK_BACKDROPS = [
    'https://image.tmdb.org/t/p/w780/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg',
    'https://image.tmdb.org/t/p/w780/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    'https://image.tmdb.org/t/p/w780/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
    'https://image.tmdb.org/t/p/w780/qjiskwlV1qQzRCjpV0cL9pEMF9a.jpg',
    'https://image.tmdb.org/t/p/w780/4EYPN5mVIhKLfxGruy7Dy41dTVn.jpg',
    'https://image.tmdb.org/t/p/w780/gErDSuDPBBnM8nGnmAo3cnwuN1p.jpg',
];

export default function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
    const router = useRouter();
    const [backdrops, setBackdrops] = useState<string[]>(FALLBACK_BACKDROPS);
    const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
    const [hasFetched, setHasFetched] = useState(false);

    // Busca backdrops dinâmicos uma única vez quando o modal abre pela primeira vez
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
        <>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >

                    {/* Overlay — radial-gradient igual ao MovieModal */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={onClose}
                        className="absolute inset-0"
                        style={{
                            background: 'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.08), transparent 34%), rgba(0,0,0,0.82)'
                        }}
                    />

                    {/* Card do modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-sm rounded-xl shadow-[0_28px_80px_rgba(0,0,0,0.85)]"
                        style={{ background: '#181818' }}
                    >
                        {/* ─── HERO BACKDROP ─── */}
                        {/* overflow-hidden aqui contém todos os gradientes */}
                        <div className="relative h-[200px] w-full overflow-hidden rounded-t-xl">

                            {/* Camada base: mosaico de backdrops dinâmicos */}
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

                            {/* Camada 2: gradientes idênticos ao MovieModal (sem transform/scale) */}
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

                            {/* Camada 3: screen-blend — idêntico ao MovieModal */}
                            <div
                                className="absolute inset-0 mix-blend-screen"
                                style={{
                                    opacity: 0.35,
                                    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.24) 68%, rgba(0,0,0,0.58) 100%)`,
                                }}
                            />

                            {/* Camada 4: brilho âmbar pulsante (opacity-only, sem translate/scale) */}
                            <motion.div
                                className="absolute inset-0"
                                animate={{ opacity: [0.18, 0.35, 0.18] }}
                                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,210,150,0.32) 0%, transparent 70%)',
                                    pointerEvents: 'none',
                                }}
                            />

                            {/* Fade inferior — funde com o body #181818 */}
                            <div
                                className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
                                style={{ background: 'linear-gradient(to top, #181818 0%, transparent 100%)' }}
                            />

                            {/* Botão fechar */}
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center
                                    rounded-full text-white/70 hover:text-white
                                    transition-all duration-200"
                            >
                                <X className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* ─── CORPO DO MODAL ─── */}
                        <div className="px-7 pt-2 pb-8 flex flex-col items-center text-center">

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.18, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                                className="text-white mb-3 leading-tight"
                                style={{
                                    fontSize: '22px',
                                    fontWeight: 900,
                                    fontFamily: '"Netflix Sans"',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                Entre para continuar
                            </motion.h2>

                            {/* Texto — mesma fonte da descrição do MovieModal */}
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.24, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    fontSize: '15px',
                                    fontFamily: '"Netflix Sans"',
                                    fontWeight: 400,
                                    color: 'rgba(255,255,255,0.70)',
                                    lineHeight: 1.6,
                                    maxWidth: '240px',
                                    marginBottom: '28px',
                                }}
                            >
                                Para criar sua lista de filmes e salvar os favoritos, faça login na sua conta.
                            </motion.p>

                            {/* Botão Fazer Login */}
                            <motion.button
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.30, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                                onClick={handleLogin}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                style={{
                                    width: '200px',
                                    background: 'white',
                                    color: 'black',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    fontFamily: '"Netflix Sans"',
                                    letterSpacing: '0.01em',
                                    borderRadius: '8px',
                                    padding: '12px 32px',
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
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
}
