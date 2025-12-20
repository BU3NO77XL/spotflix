import { useMemo } from 'react';
import { cn } from '@/lib/utils';

// Lista de avatares estilo Netflix (CDNs confiáveis: Wikipedia e Behance)
const NETFLIX_AVATARS = [
    "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png", // Blue Classic
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/84c20033850498.56ba69ac290ea.png", // Red Classic
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/1bdc9a33850498.56ba69ac2ba5b.png", // Green Classic
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/64623a33850498.56ba69ac2a6f7.png", // Dark Classic
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/bf6e4a33850498.56ba69ac3064f.png", // Yellow Classic
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/f9fa8a33850498.56ba69ac2cc3a.png", // Happy
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/2c659933850498.56ba69ac2e080.png", // Grumpy
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/bb3a8833850498.56ba69ac33f26.png", // Shocked
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/363e3e33850498.56ba69ac3183c.png", // Cheeky
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/e70b1333850498.56ba69ac32ae3.png", // Cool
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/c7906d33850498.56ba69ac353e1.png", // Mustache
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/fd69a733850498.56ba69ac2f221.png", // Pirate
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/366be133850498.56ba69ac36858.png", // Alien
    "https://mir-s3-cdn-cf.behance.net/project_modules/disp/82530a33850498.56ba6efa6fc39.jpg"  // Hero Grid (Bonus)
];

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
