'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import NetflixAvatar from '@/components/NetflixAvatar';
import { AVATAR_COUNT } from '@/lib/avatars';

const POPULAR_GENRES = [
  'Ação',
  'Aventura',
  'Comédia',
  'Drama',
  'Fantasia',
  'Ficção Científica',
  'Terror',
  'Romance',
  'Suspense',
  'Documentário',
  'Animação',
  'Crime'
];

const INITIAL_AVATARS = 6;

export default function PreferencesPage() {
  const router = useRouter();

  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [showAllAvatars, setShowAllAvatars] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('userBasicInfo');
    if (userInfo) {
      const { name } = JSON.parse(userInfo);
      setUserName(name);
    }
  }, []);

  const handleFinish = async () => {
    if (selectedGenres.length < 3) {
      toast.error('Por favor, selecione pelo menos 3 gêneros.');
      return;
    }

    const userInfo = localStorage.getItem('userBasicInfo');
    if (!userInfo) {
      toast.error('Usuário não encontrado. Faça login novamente.');
      router.push('/login');
      return;
    }

    const { id: userId } = JSON.parse(userInfo);
    if (!userId) {
      toast.error('Usuário não encontrado. Faça login novamente.');
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          avatarIndex: selectedAvatar,
          genres: selectedGenres,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar preferências.');
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem('userBasicInfo') || '{}');
      userInfo.avatarUrl = data.avatarUrl;
      userInfo.preferences = { avatarIndex: selectedAvatar, genres: selectedGenres };
      localStorage.setItem('userBasicInfo', JSON.stringify(userInfo));
      localStorage.setItem('userPreferences', JSON.stringify({
        avatar: selectedAvatar,
        genres: selectedGenres,
      }));

      toast.success('Preferências salvas! Bem-vindo ao WEBFLIX.');
      router.push('/');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genre]);
    } else {
      toast.info('Você pode selecionar no máximo 3 gêneros.');
    }
  };

  const selectAvatar = (index: number) => {
    setSelectedAvatar(index);
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden bg-[#121212]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 z-0 bg-[#121212]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 px-6 pb-12 pt-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Olá, {userName || 'usuário'}!
              </h2>
              <p className="text-lg text-gray-400">
                Personalize sua experiência
              </p>
            </div>

            <div className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold text-white">Escolha seu avatar</h3>
                <span className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap shrink-0" style={{ color: '#888', background: 'rgba(255, 255, 255, 0.05)' }}>
                  Passo 1 de 2
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {(() => {
                  if (selectedAvatar < INITIAL_AVATARS) return Array.from({ length: INITIAL_AVATARS }, (_, i) => i);
                  const indices = Array.from({ length: INITIAL_AVATARS - 1 }, (_, i) => i);
                  indices.push(selectedAvatar);
                  return indices;
                })().map((index) => (
                  <button
                    key={index}
                    onClick={() => selectAvatar(index)}
                    className={`aspect-square rounded-xl overflow-hidden transition-all ${selectedAvatar === index
                        ? 'ring-4 ring-[#1DB954]'
                        : 'ring-1 ring-white/10 hover:ring-white/30'
                      }`}
                  >
                    <NetflixAvatar selectedIndex={index} className="w-full h-full" />
                  </button>
                ))}
                <button
                  onClick={() => setShowAllAvatars(true)}
                  className="aspect-square rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-white/30 transition-all flex items-center justify-center bg-white/5 hover:bg-white/10"
                >
                  <span className="text-sm text-gray-400 font-medium">+{AVATAR_COUNT - INITIAL_AVATARS}</span>
                </button>
              </div>
            </div>

            <div className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Seus gêneros favoritos
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#888' }}>Selecione pelo menos 3 gêneros</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap" style={{ color: '#888', background: 'rgba(255, 255, 255, 0.05)' }}>
                    Passo 2 de 2
                  </span>
                  <span className={`text-sm font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${selectedGenres.length >= 3
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400'
                    }`} style={{ background: selectedGenres.length >= 3 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)' }}>
                    {selectedGenres.length}/3
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {POPULAR_GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`relative py-3 px-4 rounded-lg transition-colors ${selectedGenres.includes(genre)
                        ? 'text-white'
                        : 'text-gray-300 hover:bg-white/10'
                      }`}
                    style={{
                      background: selectedGenres.includes(genre) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: selectedGenres.includes(genre) ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <span className="font-medium text-sm whitespace-nowrap">{genre}</span>
                    {selectedGenres.includes(genre) && (
                      <div className="absolute top-1.5 right-1.5">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={handleFinish}
                disabled={selectedGenres.length < 3}
                className="px-10 py-3 bg-white hover:bg-gray-200 disabled:bg-white/30 disabled:cursor-not-allowed text-black font-semibold rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                <span>Começar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#888' }}>
                © 2026 WEBFLIX Entertainment Inc.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-sm transition-colors hover:opacity-80 hover:underline" style={{ color: '#888' }}>
                  Privacidade
                </a>
                <span style={{ color: '#888' }}>•</span>
                <a href="#" className="text-sm transition-colors hover:opacity-80 hover:underline" style={{ color: '#888' }}>
                  Termos de Uso
                </a>
                <span style={{ color: '#888' }}>•</span>
                <a href="#" className="text-sm transition-colors hover:opacity-80 hover:underline" style={{ color: '#888' }}>
                  Contato
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAllAvatars && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowAllAvatars(false)} />
          <div className="relative bg-[#1a1a1a] rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Escolha seu avatar</h3>
              <button
                onClick={() => setShowAllAvatars(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {Array.from({ length: AVATAR_COUNT }, (_, i) => i).map((index) => (
                  <button
                    key={index}
                    onClick={() => { selectAvatar(index); setShowAllAvatars(false); }}
                    className={`aspect-square rounded-xl overflow-hidden transition-all ${selectedAvatar === index
                        ? 'ring-4 ring-[#1DB954]'
                        : 'ring-1 ring-white/10 hover:ring-white/30'
                      }`}
                  >
                    <NetflixAvatar selectedIndex={index} className="w-full h-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
