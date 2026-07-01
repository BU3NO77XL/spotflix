'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Film, Tv, Star, Clock, Heart, Settings, Shield } from 'lucide-react';
import NetflixAvatar from '@/components/NetflixAvatar';

interface WatchHistoryItem {
  tmdb_id: number;
  media_type: string;
  title: string;
  season_number: number;
  episode_number: number;
  poster_url: string | null;
  watched_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(() => {
    try { if (typeof window === 'undefined') return null; const s = localStorage.getItem('userBasicInfo'); return s ? JSON.parse(s).id : null; } catch { return null; }
  });
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [avatarIndex, setAvatarIndex] = useState<number | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { router.replace('/login'); return; }

    const raw = localStorage.getItem('userBasicInfo');
    if (raw) {
      const info = JSON.parse(raw);
      setUserName(info.name || '');
      setUserEmail(info.email || '');
      setAvatarIndex(info.preferences?.avatarIndex ?? null);
      setGenres(info.preferences?.genres || []);
      setUserRole(info.role || null);
    }

    const fetchData = async () => {
      try {
        const [profileRes, historyRes, ratingsRes] = await Promise.all([
          fetch(`/api/auth/profile?userId=${userId}`),
          fetch(`/api/watch-history?userId=${userId}`),
          fetch(`/api/ratings?userId=${userId}`),
        ]);

        if (profileRes.ok) {
          const p = await profileRes.json();
          if (p.user) {
            setUserName(p.user.name || userName);
            setUserEmail(p.user.email || userEmail);
            setCreatedAt(p.user.createdAt || null);
            if (p.user.preferences?.avatarIndex != null) setAvatarIndex(p.user.preferences.avatarIndex);
            if (p.user.preferences?.genres?.length) setGenres(p.user.preferences.genres);
          }
        }

        if (historyRes.ok) {
          const h = await historyRes.json();
          setHistory((h.items || []).slice(0, 10));
        }

        if (ratingsRes.ok) {
          const r = await ratingsRes.json();
          setRatingsCount(Object.keys(r.ratings || {}).length);
        }
      } catch { /* silent */ }
      setLoading(false);
    };

    fetchData();
  }, [userId, router, userName, userEmail]);

  const seriesCount = history.filter(i => i.media_type === 'series').length;
  const movieCount = history.filter(i => i.media_type === 'movie').length;
  const totalEpisodes = history.reduce((acc, i) => acc + (i.media_type === 'series' ? 1 : 0), 0);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  };

  const formatWatchedDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ChevronLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        {/* Profile Header */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0">
            <NetflixAvatar name={userName} selectedIndex={avatarIndex} size={96} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">{userName || 'Usuário'}</h1>
            <p className="text-gray-400 mb-1">{userEmail}</p>
            <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Membro desde {formatDate(createdAt)}
            </p>
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                {genres.map(g => (
                  <span key={g} className="px-3 py-1 bg-[#1DB954]/20 text-[#1DB954] text-xs rounded-full font-medium">{g}</span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
          >
            <Settings className="w-4 h-4" />
            Editar Perfil
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
            >
              <Shield className="w-4 h-4" />
              Acessos Administrativos
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a1a] rounded-xl p-5 text-center">
            <Film className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{movieCount}</p>
            <p className="text-xs text-gray-400">Filmes vistos</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-5 text-center">
            <Tv className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{seriesCount}</p>
            <p className="text-xs text-gray-400">Séries vistas</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-5 text-center">
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{ratingsCount}</p>
            <p className="text-xs text-gray-400">Avaliações</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-5 text-center">
            <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{history.length}</p>
            <p className="text-xs text-gray-400">Total no histórico</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#1DB954]" />
            Atividade Recente
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl p-8 text-center">
              <p className="text-gray-500">Nenhuma atividade recente.</p>
              <p className="text-gray-600 text-sm mt-1">Assista a filmes e séries para ver seu histórico aqui.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-4 hover:bg-[#222] transition-colors cursor-pointer" onClick={() => router.push(`/watch?id=${item.tmdb_id}&type=${item.media_type}&ref=${item.tmdb_id}`)}>
                  <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-white/5">
                    {item.poster_url ? (
                      <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">{item.media_type === 'series' ? 'TV' : 'MV'}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-400">
                      {item.media_type === 'series' ? `Temporada ${item.season_number} Ep. ${item.episode_number}` : 'Filme'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{formatWatchedDate(item.watched_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
