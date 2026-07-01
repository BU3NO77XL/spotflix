'use client';

import { useEffect, useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

interface RatingParticlesProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const PARTICLE_COUNT = 16;

function createParticle(i: number) {
  const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.4;
  const dist = 30 + Math.random() * 50;
  const size = 3 + Math.random() * 4;
  return {
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist,
    size,
    delay: Math.random() * 0.05,
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
          className="absolute rounded-full bg-white"
          style={{
            width: p.size,
            height: p.size,
            left: -p.size / 2,
            top: -p.size / 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 1.2 }}
          transition={{
            duration: 0.45 + p.delay,
            ease: 'easeOut',
            delay: p.delay,
          }}
          onAnimationComplete={i === 0 ? onComplete : undefined}
        />
      ))}
    </div>
  );
}
