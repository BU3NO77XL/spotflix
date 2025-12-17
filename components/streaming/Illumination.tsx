"use client";

import React from 'react';

interface IlluminationProps {
    intensity?: number; // 0-1
    color?: string;
}

export default function Illumination({ intensity = 0.22, color = '255,240,200' }: IlluminationProps) {
    const bg = `radial-gradient(ellipse at center, rgba(${color},${Math.min(0.9, intensity * 1.8)}) 0%, rgba(${color},${Math.min(0.35, intensity)}) 12%, rgba(${color},0.08) 28%, transparent 50%)`;

    return (
        <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
                background: bg,
                filter: 'blur(40px)',
                mixBlendMode: 'screen',
                opacity: intensity,
            }}
        />
    );
}
