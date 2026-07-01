export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: 'star' | 'film' | 'tv' | 'heart' | 'flame' | 'trophy' | 'compass' | 'message-circle';
  color: string;
  category: 'watched' | 'ratings' | 'watchlist' | 'special';
  max_progress: number;
}

export interface UserAchievement {
  achievement_key: string;
  progress_current: number;
  progress_max: number;
  unlocked_at: string | null;
}

export interface AchievementWithProgress extends Achievement {
  progress_current: number;
  unlocked_at: string | null;
  unlocked: boolean;
  percent: number;
}

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  {
    key: 'first_steps',
    name: 'Primeiros Passos',
    description: 'Assistiu ao primeiro conteúdo',
    icon: 'star',
    color: 'text-yellow-400',
    category: 'watched',
    max_progress: 1,
  },
  {
    key: 'series_binger',
    name: 'Maratonista',
    description: 'Assistiu 10 episódios de séries',
    icon: 'tv',
    color: 'text-purple-400',
    category: 'watched',
    max_progress: 10,
  },
  {
    key: 'movie_buff',
    name: 'Cinéfilo',
    description: 'Assistiu 10 filmes',
    icon: 'film',
    color: 'text-blue-400',
    category: 'watched',
    max_progress: 10,
  },
  {
    key: 'explorer',
    name: 'Explorador',
    description: 'Assistiu 25 conteúdos',
    icon: 'compass',
    color: 'text-green-400',
    category: 'watched',
    max_progress: 25,
  },
  {
    key: 'veteran',
    name: 'Veterano',
    description: 'Assistiu 50 conteúdos',
    icon: 'trophy',
    color: 'text-amber-400',
    category: 'watched',
    max_progress: 50,
  },
  {
    key: 'critic',
    name: 'Crítico',
    description: 'Avaliou 5 filmes ou séries',
    icon: 'heart',
    color: 'text-pink-400',
    category: 'ratings',
    max_progress: 5,
  },
  {
    key: 'tastemaker',
    name: 'Formador de Opinião',
    description: 'Avaliou 15 filmes ou séries',
    icon: 'heart',
    color: 'text-red-400',
    category: 'ratings',
    max_progress: 15,
  },
  {
    key: 'collector',
    name: 'Colecionador',
    description: 'Adicionou 10 itens à watchlist',
    icon: 'star',
    color: 'text-cyan-400',
    category: 'watchlist',
    max_progress: 10,
  },
  {
    key: 'series_lover',
    name: 'Apaixonado por Séries',
    description: 'Assistiu 30 episódios de séries',
    icon: 'flame',
    color: 'text-orange-400',
    category: 'watched',
    max_progress: 30,
  },
  {
    key: 'legend',
    name: 'Lenda',
    description: 'Assistiu 100 conteúdos',
    icon: 'trophy',
    color: 'text-yellow-300',
    category: 'watched',
    max_progress: 100,
  },
];

export function getAchievementIcon(icon: Achievement['icon']): string {
  const icons: Record<string, string> = {
    star: '⭐',
    film: '🎬',
    tv: '📺',
    heart: '❤️',
    flame: '🔥',
    trophy: '🏆',
    compass: '🧭',
    'message-circle': '💬',
  };
  return icons[icon] || '⭐';
}

export function mergeAchievements(
  definitions: Achievement[],
  userAchievements: UserAchievement[]
): AchievementWithProgress[] {
  const userMap = new Map(userAchievements.map(ua => [ua.achievement_key, ua]));

  return definitions.map(def => {
    const user = userMap.get(def.key);
    const progress_current = user?.progress_current ?? 0;
    const unlocked_at = user?.unlocked_at ?? null;
    const unlocked = !!unlocked_at;

    return {
      ...def,
      progress_current,
      unlocked_at,
      unlocked,
      percent: Math.min(100, Math.round((progress_current / def.max_progress) * 100)),
    };
  });
}
