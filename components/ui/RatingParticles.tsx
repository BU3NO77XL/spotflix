'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface RatingParticlesProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const PARTICLE_COUNT = 24;

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

interface Particle {
  dx: number;
  dy: number;
  size: number;
  delay: number;
  duration: number;
}

function createParticle(): Particle {
  const angle = randomRange(0, Math.PI * 2);
  const dist = randomRange(20, 80);
  return {
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist,
    size: randomRange(2, 7),
    delay: randomRange(0, 0.12),
    duration: randomRange(0.7, 1.1),
  };
}

export default function RatingParticles({ x, y, onComplete }: RatingParticlesProps) {
  const particles = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, () => createParticle()),
    [],
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ width: 0, height: 0, left: x, top: y }}
    >
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: -p.size / 2,
            top: -p.size / 2,
          }}
          initial={{ x: 0, y: 0, opacity: 0.9, scale: 0 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 1.2 }}
          transition={{
            x: { duration: p.duration, ease: [0.2, 0.45, 0.3, 1], delay: p.delay },
            y: { duration: p.duration, ease: [0.2, 0.45, 0.3, 1], delay: p.delay },
            opacity: { duration: 0.5, ease: 'easeOut', delay: p.delay + 0.25 },
            scale: { duration: 0.2, ease: 'easeOut', delay: p.delay },
          }}
          onAnimationComplete={i === 0 ? onComplete : undefined}
        />
      ))}
    </div>
  );
}
