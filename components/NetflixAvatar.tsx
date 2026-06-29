import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { NETFLIX_AVATARS } from '@/lib/avatars';

interface NetflixAvatarProps {
    name?: string;
    selectedIndex?: number | null;
    size?: number;
    className?: string;
}

export default function NetflixAvatar({
    name = "User",
    selectedIndex,
    size = 40,
    className
}: NetflixAvatarProps) {

    const avatarUrl = useMemo(() => {
        if (typeof selectedIndex === 'number' && selectedIndex >= 0 && selectedIndex < NETFLIX_AVATARS.length) {
            return NETFLIX_AVATARS[selectedIndex];
        }
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % NETFLIX_AVATARS.length;
        return NETFLIX_AVATARS[index];
    }, [name, selectedIndex]);

    return (
        <div
            className={cn(
                "relative rounded-md overflow-hidden transition-all duration-200 shadow-md bg-gray-800",
                "group-hover:ring-2 group-hover:ring-white",
                className
            )}
            style={{ 
                width: className?.includes('w-full') ? '100%' : size, 
                height: className?.includes('h-full') ? '100%' : size 
            }}
        >
            <img
                src={avatarUrl}
                alt={`Avatar de ${name}`}
                className="w-full h-full object-cover object-center"
                draggable={false}
                onError={(e) => {
                    // Fallback para uma cor sólida com inicial caso a imagem falhe
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                        parent.style.backgroundColor = '#E50914';
                        parent.innerText = name.charAt(0).toUpperCase();
                        parent.style.display = 'flex';
                        parent.style.alignItems = 'center';
                        parent.style.justifyContent = 'center';
                        parent.style.color = 'white';
                        parent.style.fontWeight = 'bold';
                        parent.style.fontSize = `${size * 0.5}px`;
                    }
                }}
            />
        </div>
    );
}
