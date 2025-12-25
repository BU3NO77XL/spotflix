"use client";

import React, { useState } from 'react';

interface ProgressiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string | undefined | null;
    alt?: string;
    className?: string;
}

export default function ProgressiveImage({ src, alt = '', className = '', ...rest }: ProgressiveImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Se não há src válido, mostra apenas o placeholder
    const hasValidSrc = src && typeof src === 'string' && src.trim() !== '';

    return (
        <div className={`relative overflow-hidden bg-gradient-to-r from-[#0f1720] via-[#0b1220] to-[#0f1720] ${className}`.trim()}>
            {/* Placeholder overlay: mantém gradiente visível enquanto carrega ou se não há imagem */}
            <div
                aria-hidden
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${(loaded && !error) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                style={{ filter: 'blur(6px)' }}
            >
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.18)_100%)] animate-pulse" />
            </div>

            {hasValidSrc && !error && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                    className={`w-full h-full object-cover transition-opacity duration-700 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ filter: loaded ? 'none' : 'blur(20px)', transformOrigin: 'center' }}
                    {...rest}
                />
            )}
        </div>
    );
}
