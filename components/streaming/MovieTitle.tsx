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

  // Ocultar texto se houver logo (carregando ou carregado) e não houver erro
  // Isso evita o flash do texto enquanto o logo carrega
  const hideText = logoUrl && !logoError;

  return (
    <div className={`relative ${className}`}>
      {/* Logo - mostrado apenas quando carregado */}
      <div
        className={`flex items-center transition-opacity duration-300 ${showLogo ? 'opacity-100' : 'opacity-0 absolute'}`}
        aria-hidden={!showLogo || undefined}
      >
        {logoUrl && (
          <img
            src={logoUrl}
            alt={title}
            className="max-h-16 sm:max-h-20 lg:max-h-24 w-auto object-contain"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
              maxWidth: '90%'
            }}
          />
        )}
      </div>

      {/* Título de texto - visível APENAS se não houver logo ou se o logo falhar */}
      <h1
        className={`${titleClasses} transition-opacity duration-300 ${hideText ? 'opacity-0 absolute pointer-events-none hidden' : 'opacity-100'}`}
        aria-hidden={hideText || undefined}
      >
        {title}
      </h1>
    </div>
  );
}