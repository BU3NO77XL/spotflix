'use client';

import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayButtonProps {
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4', 
  lg: 'w-5 h-5'
};

const variantClasses = {
  primary: 'bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold',
  secondary: 'bg-white hover:bg-gray-200 text-black font-bold',
  ghost: 'bg-white/20 hover:bg-white/30 text-white'
};

export default function PlayButton({ 
  onClick, 
  size = 'md', 
  variant = 'primary',
  className,
  children,
  disabled = false
}: PlayButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-1 rounded-lg transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <Play className={cn(iconSizes[size], 'fill-current')} />
      {children || 'Play'}
    </button>
  );
}