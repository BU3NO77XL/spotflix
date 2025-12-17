'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize
} from 'lucide-react';
import styles from './VideoPlayer.module.css';
import ProgressiveImage from './ProgressiveImage';
import Illumination from './Illumination';

interface VideoPlayerProps {
    title: string;
    posterUrl?: string;
    backdropUrl?: string;
    duration?: string;
    onPlay?: () => void;
    onPause?: () => void;
}

export default function VideoPlayer({
    title,
    posterUrl,
    backdropUrl,
    duration = '2:15:00',
    onPlay,
    onPause
}: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(100);
    const [lastClickTime, setLastClickTime] = useState(0);

    const playerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    // Simular progresso do vídeo
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    const totalSeconds = timeToSeconds(duration);
                    return prev >= totalSeconds ? totalSeconds : prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, duration]);

    const timeToSeconds = (timeStr: string): number => {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        return 0;
    };

    const secondsToTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlay = () => {
        setIsPlaying(!isPlaying);
        if (!isPlaying) {
            onPlay?.();
        } else {
            onPause?.();
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (progressRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const totalSeconds = timeToSeconds(duration);
            setCurrentTime(Math.floor(totalSeconds * percentage));
        }
    };

    const handleDoubleClick = () => {
        toggleFullscreen();
    };

    const handleVideoClick = () => {
        const now = Date.now();
        if (now - lastClickTime < 300) {
            handleDoubleClick();
        } else {
            handlePlay();
        }
        setLastClickTime(now);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            playerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const totalSeconds = timeToSeconds(duration);
    const progressPercentage = totalSeconds > 0 ? (currentTime / totalSeconds) * 100 : 0;

    return (
        <motion.div
            ref={playerRef}
            className={`relative aspect-video bg-black rounded-lg overflow-hidden ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'max-w-5xl mx-auto'
            }`}
            onClick={handleVideoClick}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Video Background */}
            <div className="absolute inset-0">
                <ProgressiveImage src={backdropUrl || posterUrl || '/placeholder-video.jpg'} alt={title} className="w-full h-full object-cover" />
                <Illumination intensity={0.12} />
                {!isPlaying && (
                    <div className="absolute inset-0 bg-black/20" />
                )}
            </div>

            {/* Loading - APENAS texto e barrinha verde */}
            <AnimatePresence>
                {isPlaying && currentTime === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/30"
                    >
                        <div className="flex flex-col items-center">
                            <motion.div
                                className={`text-white text-lg mb-4 font-medium ${styles.loadingPulse}`}
                            >
                                Carregando...
                            </motion.div>
                            <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-linear-to-r from-red-500 via-red-600 to-red-700 rounded-full"
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 2, ease: 'easeInOut' }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center Play Button */}
            <AnimatePresence>
                {!isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePlay}
                            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30
                                hover:bg-white/30 flex items-center justify-center transition-all duration-300 shadow-2xl"
                        >
                            <Play className="w-6 h-6 text-white ml-1" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/40"
            >
                {/* Top Bar - Minimalista */}
                <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
                    <h3 className="text-white font-medium text-sm truncate max-w-[60%]">{title}</h3>
                    <div className="flex items-center gap-1">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleFullscreen}
                            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                        >
                            {isFullscreen ? (
                                <Minimize className="w-4 h-4 text-white" />
                            ) : (
                                <Maximize className="w-4 h-4 text-white" />
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* Bottom Controls - Minimalista e alinhado para mobile */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    {/* Progress Bar - Mais fina com gradiente vermelho */}
                    <div
                        ref={progressRef}
                        onClick={handleProgressClick}
                        className={`w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer ${styles.progressBar}`}
                    >
                        <div className="relative h-full">
                            <motion.div
                                className="h-full bg-linear-to-r from-red-500 via-red-600 to-red-700 rounded-full relative"
                                style={{ width: `${progressPercentage}%` }}
                                layout
                            />
                        </div>
                    </div>

                    {/* Control Buttons - Essenciais e alinhados */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handlePlay}
                                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                {isPlaying ? (
                                    <Pause className="w-5 h-5 text-white" />
                                ) : (
                                    <Play className="w-5 h-5 text-white ml-0.5" />
                                )}
                            </motion.button>

                            <span className="text-white text-xs font-mono">
                                {secondsToTime(currentTime)} / {duration}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsMuted(!isMuted)}
                                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX className="w-4 h-4 text-white" />
                                ) : (
                                    <Volume2 className="w-4 h-4 text-white" />
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}