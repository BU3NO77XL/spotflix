'use client';

import { useState } from 'react';
import { X, Share2, Check, MessageCircle, Link2, Twitter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '@/types/movie';
import { convertScoreToFivePoint } from '@/lib/utils';

interface ShareModalProps {
  movie: Movie;
  onClose: () => void;
}

export default function ShareModal({ movie, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/watch?ref=${movie.tmdb_id}&type=${movie.type}`
    : '';

  const shareText = `Estou assistindo "${movie.title}" no WEBFLIX! ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const rating = movie.score ? convertScoreToFivePoint(movie.score) : null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="relative h-40 bg-gradient-to-t from-[#1a1a1a] to-transparent">
              {movie.backdrop_url ? (
                <img
                  src={movie.backdrop_url}
                  alt=""
                  className="w-full h-full object-cover absolute inset-0"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 absolute inset-0" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent" />
            </div>

            <div className="relative -mt-16 px-5 pb-2">
              <div className="flex items-end gap-4">
                <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden shadow-xl ring-2 ring-white/10">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-0.5">
                  <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{movie.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {movie.year && <span className="text-gray-400 text-xs">{movie.year}</span>}
                    {rating && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-yellow-400 text-xs font-medium">{rating}</span>
                      </div>
                    )}
                    <span className="text-white/60 text-xs capitalize">{movie.type === 'series' ? 'Série' : 'Filme'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            <p className="text-gray-300 text-sm text-center font-medium">Compartilhe com seus amigos</p>
            <div className="flex gap-3">
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 rounded-xl transition-all group"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                <span className="text-white text-sm font-medium">WhatsApp</span>
              </button>
              <button
                onClick={handleTwitter}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
              >
                <Twitter className="w-5 h-5 text-sky-400" />
                <span className="text-white text-sm font-medium">Twitter</span>
              </button>
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Copiado!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 text-gray-300" />
                  <span className="text-gray-300 text-sm font-medium">Copiar Link</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
