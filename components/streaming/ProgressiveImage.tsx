"use client";

import React, { useState, useEffect } from 'react';

interface ProgressiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string | undefined | null;
    alt?: string;
    className?: string;
    preloaded?: boolean;
}

export default function ProgressiveImage({ src, alt = '', className = '', preloaded = false, ...rest }: ProgressiveImageProps) {
    const [loaded, setLoaded] = useState(preloaded);
    const [error, setError] = useState(false);

    // Se não há src válido, mostra apenas o placeholder
    const hasValidSrc = src && typeof src === 'string' && src.trim() !== '';

    // Se a imagem foi precarregada, marcar como loaded imediatamente
    useEffect(() => {
        if (preloaded && hasValidSrc) {
            setLoaded(true);
        }
    }, [preloaded, hasValidSrc]);

    return (
        <div className={`relative overflow-hidden bg-linear-to-r from-[#0f1720] via-[#0b1220] to-[#0f1720] ${className}`.trim()}>
            {/* Placeholder overlay: mantém gradiente visível enquanto carrega ou se não há imagem */}
            <div
                aria-hidden
                className={`absolute inset-0 transition-opacity duration-2000 ease-out ${(loaded && !error) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                style={{ filter: 'blur(6px)' }}
            >
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.18)_100%)] animate-pulse" />

                {/* Shimmer effect - reflexo de brilho */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/20 to-transparent transform skew-x-12" />
                </div>
            </div>

            {hasValidSrc && !error && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                    className={`w-full h-full object-cover transition-all duration-2000 ease-out ${loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-lg'}`}
                    {...rest}
                />
            )}
        </div>
    );
}
