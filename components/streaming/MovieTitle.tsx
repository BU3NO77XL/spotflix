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
  isLoading?: boolean;
  className?: string;
}

export default function MovieTitle({ title, logos, isLoading = false, className = '' }: MovieTitleProps) {
  const logoUrl = logos.length > 0 ? `https://image.tmdb.org/t/p/original${logos[0]?.file_path}` : null;
  const { loaded: logoLoaded, error: logoError } = useImagePreload(logoUrl);

  const titleClasses = `font-black text-white leading-tight ${title.length > 50
    ? 'text-2xl sm:text-3xl lg:text-4xl'
    : title.length > 30
      ? 'text-3xl sm:text-4xl lg:text-5xl'
      : 'text-3xl sm:text-5xl lg:text-6xl'
    }`;

  // Enquanto os detalhes ainda estão carregando, não renderizar nada
  // (evita mostrar o título sem personalização para depois trocar pelo logo)
  if (isLoading) {
    return <div className={`relative min-h-[3rem] ${className}`} />;
  }

  // Mostrar logo apenas quando totalmente carregado e sem erros
  const showLogo = logoUrl && logoLoaded && !logoError;

  // Enquanto o logo está baixando (logoUrl existe mas ainda não carregou),
  // também não mostra nada — só quando confirmar que não há logo ou deu erro
  const showTitle = !logoUrl || logoError;

  return (
    <div className={`relative min-h-[3rem] ${className}`}>
      {/* Logo — mostrado apenas quando totalmente carregado */}
      {showLogo && (
        <div className="flex items-center">
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

      {/* Título de texto — só quando não há logo ou logo deu erro */}
      {showTitle && (
        <h1 className={titleClasses}>
          {title}
        </h1>
      )}
    </div>
  );
}