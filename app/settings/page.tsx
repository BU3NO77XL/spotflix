'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ChevronLeft, LogOut, User, Palette, Globe, Play, Monitor } from 'lucide-react';
import NetflixAvatar from '@/components/NetflixAvatar';
import { AVATAR_COUNT } from '@/lib/avatars';

const POPULAR_GENRES = [
  'Ação', 'Aventura', 'Comédia', 'Drama', 'Fantasia',
  'Ficção Científica', 'Terror', 'Romance', 'Suspense',
  'Documentário', 'Animação', 'Crime'
];

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

const INITIAL_AVATARS = 6;

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showAllAvatars, setShowAllAvatars] = useState(false);
  const [contentLang, setContentLang] = useState('pt-BR');
  const [autoPlay, setAutoPlay] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('userBasicInfo');
    if (!raw) {
      router.push('/login');
      return;
    }
    const info = JSON.parse(raw);
    setUserId(info.id);
    setUserName(info.name || '');
    setUserEmail(info.email || '');
    setNameInput(info.name || '');
    setSelectedAvatar(info.preferences?.avatarIndex ?? 0);
    setSelectedGenres(info.preferences?.genres || []);
    const savedLang = localStorage.getItem('contentLang') || 'pt-BR';
    setContentLang(savedLang);
    const savedAutoPlay = localStorage.getItem('autoPlay') !== 'false';
    setAutoPlay(savedAutoPlay);
  }, [router]);

  const handleSaveName = async () => {
    if (!userId || !nameInput.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: nameInput.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Erro ao salvar nome.');
        return;
      }
      const info = JSON.parse(localStorage.getItem('userBasicInfo') || '{}');
      info.name = nameInput.trim();
      localStorage.setItem('userBasicInfo', JSON.stringify(info));
      setUserName(nameInput.trim());
      setEditingName(false);
      toast.success('Nome atualizado!');
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!userId) return;
    if (selectedGenres.length < 3) {
      toast.error('Selecione pelo menos 3 gêneros.');
      return;
    }
    setSavingPrefs(true);
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, avatarIndex: selectedAvatar, genres: selectedGenres }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Erro ao salvar preferências.');
        return;
      }
      const data = await res.json();
      const info = JSON.parse(localStorage.getItem('userBasicInfo') || '{}');
      info.avatarUrl = data.avatarUrl;
      info.preferences = { avatarIndex: selectedAvatar, genres: selectedGenres };
      localStorage.setItem('userBasicInfo', JSON.stringify(info));
      localStorage.setItem('userPreferences', JSON.stringify({ avatar: selectedAvatar, genres: selectedGenres }));
      toast.success('Preferências salvas!');
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* silent */ }
    localStorage.removeItem('sb-session');
    localStorage.removeItem('userBasicInfo');
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('contentLang');
    localStorage.removeItem('autoPlay');
    window.location.href = '/login';
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genre]);
    } else {
      toast.info('Máximo de 3 gêneros.');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ChevronLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-3xl font-bold mb-10">Configurações</h1>

        {/* Profile Section */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-[#1DB954]" />
            <h2 className="text-xl font-semibold">Perfil</h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 space-y-5">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nome</label>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="flex-1 bg-[#2a2a2a] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#1DB954] transition-colors"
                    autoFocus
                  />
                  <button onClick={handleSaveName} disabled={savingName} className="bg-[#1DB954] hover:bg-[#17a34a] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {savingName ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => { setEditingName(false); setNameInput(userName); }} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-white text-lg">{userName || '---'}</span>
                  <button onClick={() => setEditingName(true)} className="text-sm text-[#1DB954] hover:text-[#17a34a] transition-colors">Editar</button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <p className="text-white text-lg">{userEmail || '---'}</p>
            </div>
          </div>
        </section>

        {/* Avatar Section */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-[#1DB954]" />
            <h2 className="text-xl font-semibold">Avatar</h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-4">
              {Array.from({ length: showAllAvatars ? AVATAR_COUNT : INITIAL_AVATARS }, (_, i) => i).map((index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(index)}
                  className={`aspect-square rounded-xl overflow-hidden transition-all ${selectedAvatar === index ? 'ring-4 ring-[#1DB954]' : 'ring-1 ring-white/10 hover:ring-white/30'}`}
                >
                  <NetflixAvatar selectedIndex={index} className="w-full h-full" />
                </button>
              ))}
              {!showAllAvatars && (
                <button
                  onClick={() => setShowAllAvatars(true)}
                  className="aspect-square rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-white/30 transition-all flex items-center justify-center bg-white/5 hover:bg-white/10"
                >
                  <span className="text-sm text-gray-400 font-medium">+{AVATAR_COUNT - INITIAL_AVATARS}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Genre Preferences */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Play className="w-5 h-5 text-[#1DB954]" />
            <h2 className="text-xl font-semibold">Gêneros Preferidos</h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <div className="flex flex-wrap gap-3">
              {POPULAR_GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedGenres.includes(genre)
                    ? 'bg-[#1DB954] text-black'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                >
                  {genre}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">Selecione até 3 gêneros para recomendações personalizadas.</p>
          </div>
        </section>

        {/* Content Language */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-[#1DB954]" />
            <h2 className="text-xl font-semibold">Idioma do Conteúdo</h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <select
              value={contentLang}
              onChange={e => {
                setContentLang(e.target.value);
                localStorage.setItem('contentLang', e.target.value);
                toast.success('Idioma salvo!');
              }}
              className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Playback Settings */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="w-5 h-5 text-[#1DB954]" />
            <h2 className="text-xl font-semibold">Reprodução</h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto-play do próximo episódio</p>
                <p className="text-sm text-gray-400">Reproduzir automaticamente o próximo episódio de séries.</p>
              </div>
              <button
                onClick={() => {
                  const next = !autoPlay;
                  setAutoPlay(next);
                  localStorage.setItem('autoPlay', String(next));
                }}
                className={`relative w-12 h-7 rounded-full transition-colors ${autoPlay ? 'bg-[#1DB954]' : 'bg-white/20'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${autoPlay ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Save Preferences Button */}
        <button
          onClick={handleSavePreferences}
          disabled={savingPrefs}
          className="w-full bg-[#1DB954] hover:bg-[#17a34a] text-black font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mb-10"
        >
          {savingPrefs ? 'Salvando...' : 'Salvar Preferências'}
        </button>

        {/* Account Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <LogOut className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-semibold">Conta</h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors font-medium">
              <LogOut className="w-5 h-5" />
              <span>Sair da conta</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
