import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { NETFLIX_AVATARS } from '@/lib/avatars';

interface NetflixAvatarProps {
    name?: string; // Usado para garantir consistência (se passar o mesmo nome, gera o mesmo avatar)
    size?: number;
    className?: string;
}

export default function NetflixAvatar({
    name = "User",
    size = 40,
    className
}: NetflixAvatarProps) {

    // Seleciona um avatar baseado no hash do nome para ser consistente
    // Se mudar o nome, muda o avatar. Se manter o nome, mantem o avatar.
    const avatarUrl = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % NETFLIX_AVATARS.length;
        return NETFLIX_AVATARS[index];
    }, [name]);

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
