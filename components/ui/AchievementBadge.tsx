'use client';

import { AchievementWithProgress } from '@/lib/achievements';
import { Star, Film, Tv, Heart, Flame, Trophy, Compass, MessageCircle } from 'lucide-react';

const ICON_MAP: Record<string, typeof Star> = {
  star: Star,
  film: Film,
  tv: Tv,
  heart: Heart,
  flame: Flame,
  trophy: Trophy,
  compass: Compass,
  'message-circle': MessageCircle,
};

export default function AchievementBadge({ achievement }: { achievement: AchievementWithProgress }) {
  const Icon = ICON_MAP[achievement.icon] || Star;

  return (
    <div className={`relative group flex flex-col items-center gap-1.5 ${achievement.unlocked ? '' : 'opacity-40'}`}>
      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 
        ${achievement.unlocked
          ? 'bg-white/10 ring-2 ring-white/20 shadow-lg shadow-white/5'
          : 'bg-white/5 ring-1 ring-white/5'
        }`}
      >
        <Icon className={`w-6 h-6 ${achievement.color} ${achievement.unlocked ? '' : 'opacity-60'}`} />
        {!achievement.unlocked && achievement.percent > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            <circle
              cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"
              strokeDasharray={`${achievement.percent * 1.005} 100.5`}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      <p className={`text-[10px] font-semibold text-center leading-tight max-w-[80px] ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
        {achievement.name}
      </p>
      {achievement.unlocked && achievement.percent >= 100 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
          <Star className="w-2.5 h-2.5 text-black fill-current" />
        </div>
      )}
    </div>
  );
}
