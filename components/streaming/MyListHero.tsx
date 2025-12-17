"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ProgressiveImage from './ProgressiveImage';
import Illumination from './Illumination';

interface Props {
    title?: string;
    description?: string;
    backdrops?: (string | undefined)[];
}

const imageVariants = {
    enter: (dir: number) => ({ opacity: 0, scale: 1.05, x: dir > 0 ? '3%' : '-3%', filter: 'brightness(0.4)' }),
    center: { opacity: 1, scale: 1, x: 0, filter: 'brightness(1)', transition: { duration: 1 } },
    exit: (dir: number) => ({ opacity: 0, scale: 1.02, x: dir > 0 ? '-3%' : '3%', filter: 'brightness(0.4)', transition: { duration: 0.6 } }),
} as Variants;

const contentVariants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.4 } },
} as Variants;

export default function MyListHero({ title = 'Minha Lista', description = '', backdrops = [] }: Props) {
    const available = backdrops.filter(Boolean) as string[];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [loaded, setLoaded] = useState(new Set<number>([0]));

    useEffect(() => {
        if (available.length <= 1) return;
        const id = setInterval(() => {
            setDirection(1);
            setCurrentIndex((i) => (i + 1) % available.length);
        }, 8000);
        return () => clearInterval(id);
    }, [available.length]);

    const src = available.length ? available[currentIndex] : undefined;

    useEffect(() => {
        if (!src) return;
        if (loaded.has(currentIndex)) return;
        const img = new Image();
        img.onload = () => setLoaded((prev) => new Set([...prev, currentIndex]));
        img.src = src;
    }, [src, currentIndex, loaded]);

    return (
        <section className="relative h-[52vh] sm:h-[60vh] lg:h-[70vh] w-full overflow-hidden bg-[#0a0a0a]">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={`mylist-backdrop-${currentIndex}`}
                    custom={direction}
                    variants={imageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0"
                >
                    <div className="w-full h-full">
                        {src ? (
                            <ProgressiveImage src={src} alt={title} className="w-full h-full object-cover object-center" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-[#071018] via-[#0b1620] to-[#071018]" />
                        )}
                        <Illumination intensity={0.22} />
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
                </motion.div>
            </AnimatePresence>

            {/* Gradients similar to home hero */}
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/40 to-transparent" />

            {/* Content positioned like home hero, no buttons */}
            <div className="absolute inset-0 flex items-center sm:items-end z-20">
                    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 w-full pb-4 sm:pb-8 lg:pb-12">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={`mylist-content-${currentIndex}`}
                            variants={contentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="max-w-2xl"
                        >
                            <h1 className="font-black text-white mb-4 lg:mb-6 leading-tight tracking-tight text-4xl sm:text-5xl lg:text-7xl">{title}</h1>
                            {description ? (
                                <p className="text-gray-300 text-base lg:text-lg leading-relaxed mb-6 lg:mb-8 line-clamp-3 max-w-xl">{description}</p>
                            ) : null}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
