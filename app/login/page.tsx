'use client';
'use no memo';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Info, Play, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { TMDBService } from '@/components/streaming/TMDBIntegration';
import { Movie } from '@/types/movie';

// Fixed particle positions to avoid hydration mismatch
const PARTICLE_CONFIG = [
    { x: 15, y: 20, opacity: 0.25, duration: 18, delay: 2 },
    { x: 45, y: 60, opacity: 0.18, duration: 22, delay: 5 },
    { x: 75, y: 35, opacity: 0.30, duration: 16, delay: 8 },
    { x: 25, y: 80, opacity: 0.22, duration: 20, delay: 12 },
    { x: 85, y: 15, opacity: 0.15, duration: 24, delay: 3 },
    { x: 55, y: 45, opacity: 0.28, duration: 19, delay: 7 },
    { x: 35, y: 70, opacity: 0.20, duration: 21, delay: 15 },
    { x: 65, y: 90, opacity: 0.12, duration: 17, delay: 10 },
];

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [backgroundMovies, setBackgroundMovies] = useState<Omit<Movie, 'id'>[]>([]);

    useEffect(() => {
        const loadBackdrops = async () => {
            const movies = await TMDBService.fetchTrending();
            // Triplicar a lista para preencher bem o grid
            setBackgroundMovies([...movies, ...movies, ...movies].slice(0, 48));
        };
        loadBackdrops();
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Por favor, preencha todos os campos.');
            return;
        }

        setIsLoading(true);

        // Simulando um login de 2 segundos
        setTimeout(() => {
            setIsLoading(false);
            toast.success('Login realizado com sucesso! Bem-vindo ao SpotFlix.');
            router.push('/');
        }, 2000);
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
            {/* Movie Backdrop Mosaic */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="flex flex-wrap gap-1 opacity-[0.25] sm:opacity-[0.2] scale-110 blur-[0.5px]">
                    {backgroundMovies.map((movie, i) => (
                        <div
                            key={`${movie.tmdb_id}-${i}`}
                            className="w-[32%] sm:w-[24%] md:w-[18%] lg:w-[12%] aspect-[2/3] shrink-0"
                        >
                            <img
                                src={movie.poster_url}
                                alt=""
                                className="w-full h-full object-cover rounded-md"
                            />
                        </div>
                    ))}
                </div>

                {/* Advanced Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/40" />
                <div className="absolute inset-0 bg-black/15 sm:bg-black/25" />

                {/* Moving Minimalist Shapes Overlay */}
                <div className="absolute inset-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#1DB954]/5 blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#1DB954]/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

                    {PARTICLE_CONFIG.map((particle, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white/10 rounded-full"
                            initial={{
                                x: `${particle.x}%`,
                                y: `${particle.y}%`,
                                opacity: particle.opacity
                            }}
                            animate={{
                                y: [null, '-20%', '120%'],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                ease: "linear",
                                delay: particle.delay
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md px-6"
            >
                <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {/* Brand Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-3 mb-2"
                        >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#1DB954] flex items-center justify-center shadow-lg shadow-[#1DB954]/20">
                                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
                                <span className="text-white">Spot</span>
                                <span className="text-[#1DB954]">Flix</span>
                            </h1>
                        </motion.div>
                        <p className="text-gray-400 text-sm font-medium">Filmes e séries ilimitados esperam por você.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-[#1DB954] transition-colors text-gray-500">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#1DB954]/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Senha</label>
                                <button type="button" className="text-xs text-[#1DB954] hover:underline font-medium">Esqueceu?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-[#1DB954] transition-colors text-gray-500">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#1DB954]/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-[#1DB954]/20"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                'Entrar agora'
                            )}
                        </button>
                    </form>

                    {/* Secondary Actions */}
                    <div className="mt-10 text-center space-y-4">
                        <p className="text-gray-500 text-sm">
                            Novo por aqui? <button className="text-white hover:text-[#1DB954] font-bold transition-colors">Crie uma conta.</button>
                        </p>

                        <div className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 rounded-xl border border-white/5 cursor-help group">
                            <Info size={14} className="text-[#1DB954]" />
                            <p className="text-[10px] text-gray-500 leading-tight">
                                Este é um projeto de demonstração. Use qualquer e-mail e senha para acessar.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Copy */}
                <p className="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-[0.2em]">
                    © 2025 SpotFlix Entrerteinment Inc.
                </p>
            </motion.div>
        </div>
    );
}
