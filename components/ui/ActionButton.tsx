'use client';

import { Plus, Heart, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  onClick?: () => void;
  type: 'add' | 'favorite' | 'like';
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6 p-1',
  md: 'w-8 h-8 p-1.5',
  lg: 'w-10 h-10 p-2'
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
};

export default function ActionButton({ 
  onClick, 
  type,
  isActive = false,
  size = 'md',
  className,
  disabled = false
}: ActionButtonProps) {
  const getIcon = () => {
    switch (type) {
      case 'add':
        return <Plus className={iconSizes[size]} />;
      case 'favorite':
        return <Heart className={cn(iconSizes[size], isActive && 'fill-current')} />;
      case 'like':
        return <ThumbsUp className={cn(iconSizes[size], isActive && 'fill-current')} />;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-full transition-all duration-200 flex items-center justify-center',
        'bg-white/20 hover:bg-white/30 border border-white/30 text-white',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive && type === 'favorite' && 'text-red-500',
        isActive && type === 'like' && 'text-blue-500',
        sizeClasses[size],
        className
      )}
    >
      {getIcon()}
    </button>
  );
}