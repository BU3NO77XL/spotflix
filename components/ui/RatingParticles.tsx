'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';

interface RatingParticlesProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const PARTICLE_COUNT = 20;

function createParticle(i: number) {
  const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.6;
  const dist = 25 + Math.random() * 55;
  const w = 3 + Math.random() * 5;
  const h = 2 + Math.random() * 3;
  const rotation = Math.random() * 720;
  return {
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist,
    w,
    h,
    rot: rotation,
    delay: Math.random() * 0.06,
  };
}

export default function RatingParticles({ x, y, onComplete }: RatingParticlesProps) {
  const particles = useRef(Array.from({ length: PARTICLE_COUNT }, (_, i) => createParticle(i)));

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ width: 0, height: 0, left: x, top: y }}
    >
      {particles.current.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bg-white"
          style={{
            width: p.w,
            height: p.h,
            left: -p.w / 2,
            top: -p.h / 2,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 1, rotate: p.rot }}
          transition={{
            x: { type: 'spring', stiffness: 200, damping: 12, mass: 0.4, delay: p.delay },
            y: { type: 'spring', stiffness: 200, damping: 12, mass: 0.4, delay: p.delay },
            opacity: { duration: 0.3, ease: 'easeOut', delay: p.delay + 0.15 },
            scale: { duration: 0.15, ease: 'easeOut', delay: p.delay },
            rotate: { duration: 0.5, ease: 'easeOut', delay: p.delay },
          }}
          onAnimationComplete={i === 0 ? onComplete : undefined}
        />
      ))}
    </div>
  );
}
