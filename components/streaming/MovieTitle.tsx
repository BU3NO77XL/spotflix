'use client';

import { useImagePreload } from '@/hooks/useImagePreload';

interface MovieTitleProps {
  title: string;
  logos: Array<{
    file_path: string;
    file_type: string;
    width: number;
    height: number;
  }>;
  className?: string;
}

export default function MovieTitle({ title, logos, className = '' }: MovieTitleProps) {
  const logoUrl = logos.length > 0 ? `https://image.tmdb.org/t/p/original${logos[0]?.file_path}` : null;
  const { loaded: logoLoaded, error: logoError } = useImagePreload(logoUrl);

  const titleClasses = `font-black text-white leading-tight ${title.length > 50
    ? 'text-2xl sm:text-3xl lg:text-4xl'
    : title.length > 30
      ? 'text-3xl sm:text-4xl lg:text-5xl'
      : 'text-3xl sm:text-5xl lg:text-6xl'
    }`;

  // Mostrar logo apenas quando totalmente carregado e sem erros
  const showLogo = logoUrl && logoLoaded && !logoError;

  // Sempre mostrar o título como fallback - nunca deixar vazio
  const showTitle = !showLogo;

  return (
    <div className={`relative ${className}`}>
      {/* Logo - mostrado apenas quando carregado */}
      {showLogo && (
        <div
          className="flex items-center transition-opacity duration-300 opacity-100"
        >
          <img
            src={logoUrl}
            alt={title}
            className="max-h-16 sm:max-h-20 lg:max-h-24 w-auto object-contain"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
              maxWidth: '90%'
            }}
          />
        </div>
      )}

      {/* Título de texto - visível quando não há logo ou enquanto logo carrega */}
      {showTitle && (
        <h1 className={titleClasses}>
          {title}
        </h1>
      )}
    </div>
  );
}