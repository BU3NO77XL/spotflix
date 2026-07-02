'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Film, Tv, Star, Clock, Heart, Shield, Trash2, UserCog, Search, Activity, ThumbsUp, ThumbsDown, Laugh, TrendingUp, Users } from 'lucide-react';
import NetflixAvatar from '@/components/NetflixAvatar';
import { TMDBService } from '@/components/streaming/TMDBIntegration';

interface RatingItem {
  tmdb_id: number;
  media_type: string;
  value: string;
}

interface RatingDetail extends RatingItem {
  title: string;
  poster_url: string | null;
}

interface RecentItem {
  tmdb_id: number;
  media_type: string;
  title: string;
  season_number: number;
  episode_number: number;
  poster_url: string | null;
  watched_at: string;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  movieCount: number;
  seriesCount: number;
  totalHistory: number;
  ratingsCount: number;
  ratings: RatingItem[];
  recentActivity: RecentItem[];
  preferences: { avatarIndex: number | null; genres: string[] } | null;
}

const ratingLabels: Record<string, { label: string; icon: any; color: string }> = {
  love: { label: 'Amei', icon: Heart, color: 'text-pink-400' },
  like: { label: 'Gostei', icon: ThumbsUp, color: 'text-white' },
  dislike: { label: 'Não gostei', icon: ThumbsDown, color: 'text-red-400' },
};

export default function AdminPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'ratings' | 'settings'>('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ targetProfileId: number; tmdbId: number; mediaType: string; title: string; type: 'history' | 'rating' } | null>(null);
  const [ratingDetails, setRatingDetails] = useState<Record<string, RatingDetail>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userBasicInfo');
      if (raw) {
        const info = JSON.parse(raw);
        if (info.role !== 'admin') { router.replace('/'); return; }
        setUserId(info.id);
      } else {
        router.replace('/login'); return;
      }
    } catch { router.replace('/login'); return; }
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/admin/users?userId=${userId}`);
        if (!res.ok) { router.replace('/'); return; }
        const data = await res.json();
        setUsers(data.users || []);
      } catch { router.replace('/'); }
      setLoading(false);
    };
    fetchUsers();
  }, [userId, router]);

  const fetchRatingDetails = useCallback(async (ratings: RatingItem[]) => {
    const newDetails: Record<string, RatingDetail> = {};
    const toFetch = ratings.filter(r => !ratingDetails[`${r.tmdb_id}_${r.media_type}`]);
    if (toFetch.length === 0) return;

    const results = await Promise.allSettled(toFetch.map(async (r) => {
      const details = r.media_type === 'series'
        ? await TMDBService.fetchSeriesDetails(r.tmdb_id)
        : await TMDBService.fetchMovieDetails(r.tmdb_id);
      const posterPath = (details as any)?.poster_path;
      return {
        ...r,
        title: (details as any)?.title || (details as any)?.name || `#${r.tmdb_id}`,
        poster_url: posterPath
          ? (posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w92${posterPath}`)
          : null,
      };
    }));

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const d = result.value;
        newDetails[`${d.tmdb_id}_${d.media_type}`] = d;
      }
    }
    if (Object.keys(newDetails).length > 0) {
      setRatingDetails(prev => ({ ...prev, ...newDetails }));
    }
  }, [ratingDetails]);

  useEffect(() => {
    if (expandedUser && activeTab === 'ratings') {
      const user = users.find(u => u.id === expandedUser);
      if (user?.ratings.length) {
        fetchRatingDetails(user.ratings);
      }
    }
  }, [expandedUser, activeTab, users, fetchRatingDetails]);

  const totals = {
    movies: users.reduce((a, u) => a + u.movieCount, 0),
    series: users.reduce((a, u) => a + u.seriesCount, 0),
    ratings: users.reduce((a, u) => a + u.ratingsCount, 0),
    history: users.reduce((a, u) => a + u.totalHistory, 0),
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  };

  const handleRoleChange = async (targetUserId: number, newRole: string) => {
    try {
      const res = await fetch('/api/admin/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetUserId, role: newRole }),
      });
      if (res.ok) setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
    } catch { /* silent */ }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const { targetProfileId, tmdbId, mediaType, type } = confirmDelete;
    const key = `${targetProfileId}-${tmdbId}-${mediaType}`;
    setDeletingId(key);
    setConfirmDelete(null);
    try {
      const endpoint = type === 'rating' ? '/api/admin/ratings' : '/api/admin/watch-history';
      await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetProfileId, tmdbId, mediaType }),
      });
      setUsers(prev => prev.map(u => {
        if (u.id !== targetProfileId) return u;
        return {
          ...u,
          ratings: type === 'rating' ? u.ratings.filter(r => !(r.tmdb_id === tmdbId && r.media_type === mediaType)) : u.ratings,
          ratingsCount: type === 'rating' ? u.ratingsCount - 1 : u.ratingsCount,
          recentActivity: type === 'history' ? u.recentActivity.filter(r => !(r.tmdb_id === tmdbId && r.media_type === mediaType)) : u.recentActivity,
          totalHistory: type === 'history' ? u.totalHistory - 1 : u.totalHistory,
          movieCount: type === 'history' && mediaType === 'movie' ? u.movieCount - 1 : u.movieCount,
          seriesCount: type === 'history' && mediaType === 'series' ? u.seriesCount - 1 : u.seriesCount,
        };
      }));
    } catch { /* silent */ }
    setDeletingId(null);
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-[#121212] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 pt-20 sm:pt-28">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="min-w-0">
            <button onClick={() => window.location.href = '/profile'} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3">
              <ChevronLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-3">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" />
              Painel Administrativo
            </h1>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          <div className="bg-[#1a1a1a] rounded-xl p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-white">{totals.movies}</p>
                <p className="text-[10px] sm:text-xs text-gray-200 font-semibold">Filmes vistos</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-white">{totals.series}</p>
                <p className="text-[10px] sm:text-xs text-gray-200 font-semibold">Séries vistas</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-white">{totals.ratings}</p>
                <p className="text-[10px] sm:text-xs text-gray-200 font-semibold">Avaliações</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-white">{totals.history}</p>
                <p className="text-[10px] sm:text-xs text-gray-200 font-semibold">Histórico total</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-300" />
          <h2 className="text-lg font-bold text-white">Usuários</h2>
          <span className="text-sm text-gray-400 font-medium ml-1">({filteredUsers.length})</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl p-12 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-[#1a1a1a] rounded-xl overflow-hidden transition-all duration-200">
                <div
                  onClick={() => {
                    setExpandedUser(expandedUser === user.id ? null : user.id);
                    setActiveTab('history');
                  }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:bg-[#222] transition-colors"
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <NetflixAvatar
                        name={user.name || ''}
                        selectedIndex={user.preferences?.avatarIndex ?? null}
                        size={44}
                      />
                      {user.role === 'admin' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center ring-2 ring-[#1a1a1a]">
                          <Star className="w-2.5 h-2.5 text-black fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold truncate text-base">{user.name || 'Sem nome'}</h3>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${user.role === 'admin' ? 'bg-red-500/15 text-red-400' : 'bg-white/10 text-gray-200'}`}>
                          {user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs font-medium truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-6 text-xs shrink-0">
                    <div className="text-center bg-white/5 sm:bg-white/5 rounded-lg py-1.5 sm:px-4 sm:py-2">
                      <p className="text-white font-bold text-sm">{user.movieCount}</p>
                      <p className="text-gray-200 font-semibold">Filmes</p>
                    </div>
                    <div className="text-center bg-white/5 sm:bg-white/5 rounded-lg py-1.5 sm:px-4 sm:py-2">
                      <p className="text-white font-bold text-sm">{user.seriesCount}</p>
                      <p className="text-gray-200 font-semibold">Séries</p>
                    </div>
                    <div className="text-center bg-white/5 sm:bg-white/5 rounded-lg py-1.5 sm:px-4 sm:py-2">
                      <p className="text-white font-bold text-sm">{user.ratingsCount}</p>
                      <p className="text-gray-200 font-semibold hidden sm:block">Avaliações</p>
                      <p className="text-gray-200 font-semibold sm:hidden">Aval.</p>
                    </div>
                    <div className="text-center bg-white/5 sm:bg-white/5 rounded-lg py-1.5 sm:px-4 sm:py-2">
                      <p className="text-white font-bold text-sm">{user.totalHistory}</p>
                      <p className="text-gray-200 font-semibold hidden sm:block">Histórico</p>
                      <p className="text-gray-200 font-semibold sm:hidden">Hist.</p>
                    </div>
                  </div>
                </div>

                {expandedUser === user.id && (
                  <div className="border-t border-white/10">
                    <div className="flex border-b border-white/10 overflow-x-auto scrollbar-none">
                      <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'history' ? 'text-white border-b-2 border-white' : 'text-gray-300 hover:text-white'}`}
                      >
                        <Activity className="w-4 h-4 shrink-0" />
                        Atividade Recente
                      </button>
                      <button
                        onClick={() => setActiveTab('ratings')}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'ratings' ? 'text-white border-b-2 border-white' : 'text-gray-300 hover:text-white'}`}
                      >
                        <Star className="w-4 h-4 shrink-0" />
                        Avaliações ({user.ratingsCount})
                      </button>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'text-white border-b-2 border-white' : 'text-gray-300 hover:text-white'}`}
                      >
                        <UserCog className="w-4 h-4 shrink-0" />
                        Configurações
                      </button>
                    </div>

                    <div className="p-4 sm:p-5">
                      {activeTab === 'history' && (
                        <>
                          {user.recentActivity.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Nenhuma atividade recente.</p>
                          ) : (
                            <div className="space-y-2">
                              {user.recentActivity.map((item, i) => {
                                const key = `${item.tmdb_id}-${item.media_type}-${i}`;
                                const delKey = `${user.id}-${item.tmdb_id}-${item.media_type}`;
                                return (
                                  <div key={key} className="flex items-center gap-3 bg-[#252525] rounded-lg p-3 group hover:bg-[#2a2a2a] transition-colors">
                                    <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-white/5">
                                      {item.poster_url ? (
                                        <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px]">
                                          {item.media_type === 'series' ? 'TV' : 'MV'}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                                      <p className="text-gray-300 text-xs font-medium mt-0.5">
                                        {item.media_type === 'series' ? `Temporada ${item.season_number} · Ep. ${item.episode_number}` : 'Filme'}
                                      </p>
                                      <p className="text-gray-400 text-[11px] font-medium mt-0.5">{formatWatchedDate(item.watched_at)}</p>
                                    </div>
                                    <button
                                      onClick={() => setConfirmDelete({ targetProfileId: user.id, tmdbId: item.tmdb_id, mediaType: item.media_type, title: item.title, type: 'history' })}
                                      disabled={deletingId === delKey}
                                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                                      title="Remover do histórico"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}

                      {activeTab === 'ratings' && (
                        <>
                          {user.ratings.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Nenhuma avaliação.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {user.ratings.map((r, i) => {
                                const info = ratingLabels[r.value] || { label: r.value, icon: Star, color: 'text-white' };
                                const Icon = info.icon;
                                const detail = ratingDetails[`${r.tmdb_id}_${r.media_type}`];
                                const delKey = `${user.id}-${r.tmdb_id}-${r.media_type}`;
                                return (
                                  <div key={i} className="relative bg-[#252525] rounded-lg p-3 group hover:bg-[#2a2a2a] transition-colors">
                                    <button
                                      onClick={() => setConfirmDelete({ targetProfileId: user.id, tmdbId: r.tmdb_id, mediaType: r.media_type, title: detail?.title || `#${r.tmdb_id}`, type: 'rating' })}
                                      disabled={deletingId === delKey}
                                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 z-10"
                                      title="Remover avaliação"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-white/5">
                                        {detail?.poster_url ? (
                                          <img src={detail.poster_url} alt={detail.title} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px]">
                                            {r.media_type === 'series' ? 'TV' : 'MV'}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate pr-5">
                                          {detail?.title || `Carregando...`}
                                        </p>
                                        <p className="text-gray-300 text-[11px] font-medium mt-0.5">
                                          {r.media_type === 'series' ? 'Série' : 'Filme'}
                                        </p>
                                        <span className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${info.color} bg-white/10`}>
                                          {r.value === 'love' ? <Heart className="w-3 h-3" fill="currentColor" /> : <Icon className="w-3 h-3" fill="currentColor" />}
                                          {info.label}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}

                      {activeTab === 'settings' && (
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <UserCog className="w-5 h-5 text-gray-300" />
                            <div>
                              <p className="text-sm text-gray-200 font-semibold">Cargo do usuário</p>
                              <select
                                value={user.role}
                                onChange={e => handleRoleChange(user.id, e.target.value)}
                                className="mt-1 bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white font-medium focus:outline-none focus:border-white/30"
                              >
                                <option value="user">Usuário</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Clock className="w-5 h-5 text-gray-300" />
                            <div>
                              <p className="text-sm text-gray-200 font-semibold">Membro desde</p>
                              <p className="text-white text-sm font-bold">{formatDate(user.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Users className="w-5 h-5 text-gray-300" />
                            <div>
                              <p className="text-sm text-gray-200 font-semibold">Gêneros preferidos</p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {user.preferences?.genres?.length ? user.preferences.genres.map(g => (
                                  <span key={g} className="text-xs px-2 py-0.5 bg-white/5 text-gray-200 font-medium rounded-full">{g}</span>
                                )) : (
                                  <span className="text-xs text-gray-500">Nenhum</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{confirmDelete.type === 'rating' ? 'Excluir avaliação' : 'Excluir do histórico'}</h3>
                <p className="text-gray-400 text-sm">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-6">
              {confirmDelete.type === 'rating' ? (
                <>Tem certeza que deseja remover a avaliação de <span className="text-white font-semibold">{confirmDelete.title}</span> deste usuário?</>
              ) : (
                <>Tem certeza que deseja remover <span className="text-white font-semibold">{confirmDelete.title}</span> do histórico deste usuário?</>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === `${confirmDelete.targetProfileId}-${confirmDelete.tmdbId}-${confirmDelete.mediaType}`}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {deletingId === `${confirmDelete.targetProfileId}-${confirmDelete.tmdbId}-${confirmDelete.mediaType}` ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
