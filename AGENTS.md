## Goal
Corrigir visuais, skeletons e filtros inconsistentes na home/página Watch; adicionar badge Netflix/Nova Temporada/Leaving Soon/TOP 10 nos cards; rastrear episódios de séries; aplicar fonte Netflix Sans e tooltip de ratings.

## Constraints & Preferences
- "Títulos Semelhantes" deve ter mesmo espaçamento lateral que "Elenco Principal".
- Match na página Watch deve aparecer mesmo sem usuário logado (fallback movie.score).
- Skeleton da home deve espelhar dimensões reais dos componentes.
- Carrossel "Para Você" só para usuários logados.
- Filmes com sinopse >~4 linhas não devem entrar no hero desktop.
- Badge Top 10 deve persistir ao clicar em qualquer carrossel (handleMoreInfo consulta top10Movies).
- Badge Top 10 na Watch comentada temporariamente.
- Botão de volume na Watch deve ter mesmas dimensões que joinha/+.
- Badge Top 10 na hero: maior, texto bold, fonte Netflix, w-[160px] md:w-[220px].
- Badge Netflix (logo N vermelho) deve aparecer no canto superior esquerdo dos cards com provedor Netflix.
- Badge Top 10 (SVG "10" vermelho) substitui badge Netflix nos cards do Top 10 para não sobrepor.
- Badge "NOVA TEMPORADA" na parte inferior dos posters de séries com temporada lançada no ano atual.
- Badge "LEAVING SOON" na parte inferior de posters (detecção não implementada).
- Tooltip de rating com 3 opções (Amei/Gostei/Não curti) substitui joinha simples no modal e Watch.
- Fonte Netflix Sans única em todo o sistema (sem fallbacks).
- "Continue Assistindo" populado por histórico real de exibição, não por watchlist.
- Ao clicar em item do "Continue Assistindo" de série, navega direto para Watch com season/episode corretos.

## Done
- Animado MovieModal com framer-motion (fade+slide, AnimatePresence no body): lib/motion.ts.
- Corrigido carregamento do match na Watch: useEffect antes dos guards, userId como useState+useEffect, fallback movie.score.
- Removido dev.db do tracking, adicionado ao .gitignore.
- Aumentados elementos da Watch em desktop (meta row, botões, títulos).
- Corrigidos espaçamentos inconsistentes na Watch (px-2 em Títulos Semelhantes, md:text-2xl no CastSlider, py-6→py-8 em Detalhes).
- Adicionada prop showTitle ao Carousel para separar título do breakout -mx-.
- Corrigidas dimensões do PageSkeleton (aspect-2/3, largura 140-160px, pl-4/sm:pl-6/lg:pl-24, hero 810px, sinopse 3 linhas, botões md:h-52).
- Oculta carrossel "Para Você" para não logados.
- Filtro de sinopse >250 caracteres do hero (desktop).
- handleMoreInfo enriquece movie com rank do top10Movies se tmdb_id coincidir.
- URL watch? passa ?rank= para propagar badge à Watch.
- Badge Top 10 comentado na Watch por solicitação do usuário.
- Botão de volume na Watch ajustado para w-12 h-12 sm:w-10 sm:h-10 md:w-12 md:h-12 com SVGs 26x26.
- Badge Top 10 na hero ampliado para w-[160px] md:w-[220px], fontWeight="700", fonte 'Helvetica Neue'.
- Criado components/streaming/NetflixBadge.tsx com logo N vermelho.
- Criado lib/netflixCache.ts (Map<number, boolean> + TMDBService.fetchWatchProviders).
- NetflixBadge adicionado a MovieCard, Top10Card, MiniCard, my-list/page.tsx.
- Baixadas 6 variações da fonte Netflix Sans (woff2 do CDN oficial) para public/fonts/.
- Adicionados @font-face em app/globals.css para todos os pesos.
- Atualizado body font-family e variável --font-sans do Tailwind para "Netflix Sans".
- Atualizados todos os fontFamily inline em LoginRequiredModal, MovieModal, HeroSection, WatchClient, Top10Card.
- Removidos TODOS os fallbacks (Helvetica Neue, Arial, sans-serif) — só "Netflix Sans".
- 3 commits em português: badge Netflix, fonte Netflix Sans, remoção de fallbacks.
- Configurado CI/CD Pipeline via GitHub Actions (.github/workflows/ci.yml) com 4 estagios: Auditoria de Seguranca, Linter/Formato, Testes Unitarios (Vitest) + Typecheck, e Verificacao de Build de Producao antes do deploy na Vercel.
- Reorganizadas todas as tabelas do Prisma schema com sequência lógica limpa (IDs/FKs -> Conteúdo/Atributos -> Rastreamento -> Timestamps -> Relacionamentos) e comentários em português.
- Aplicado db push no dev.db.
- API /api/watch-history aceita seasonNumber/episodeNumber/totalSeasons/totalEpisodes (POST, DELETE, GET).
- WatchClient.tsx salva histórico no banco EXCLUSIVAMENTE ao clicar no botão "Assistir" (com a temporada e episódio selecionados pelo usuário). Ao abrir a página de assistir, recupera automaticamente a temporada no seletor e o destaque (contorno verde) do episódio em que o usuário parou.
- Home page: Carrossel renomeado para "Recém assistidos", populado por rawWatchHistory (useQuery) para filmes e séries; MovieCard exibe barra de progresso vermelha no estilo Netflix na parte inferior do poster e indicadores de episódios (ex: `Ep. 3/10` ou badge `Completo`).
- handleMoreInfo para itens com season_number/episode_number navega direto para Watch (não abre modal).
- handleWatch passa ref, type, season, episode na URL.
- MovieCard exibe ano de lançamento e rótulo "S1:E3" de forma permanente abaixo do poster (removidos do hover).
- MovieCard e Top10Card atualizados com elementos de hover no estilo Netflix (botão Play branco, Chevron de detalhes, metadados HD/Rating e lista de gêneros).
- Estrelas de avaliação atualizadas para a cor amarela (`#facc15` / `yellow-400`) e pontuação convertida para a escala de 0 a 5 em todos os cards do sistema.
- Corrigido infinite loop: rawWatchHistory (undefined estável) em vez de destructuring "= { items: [] }".
- Criado Top10Badge.tsx com SVG "10" vermelho (20×29, #F50723).
- Top10Badge adicionado a Top10Card (top-left); NetflixBadge removido do Top10Card para evitar sobreposição.
- Criado NewSeasonBadge.tsx (SVG "NOVA TEMPORADA" 70×17, fundo vermelho).
- Criado lib/newSeasonCache.ts (TMDBService.fetchSeriesDetails + verificação air_date no ano atual).
- NewSeasonBadge adicionado na parte inferior de MovieCard, MiniCard (portrait) e cards de my-list/page.tsx, só para movie.type === 'series'.
- Criado LeavingSoonBadge.tsx (SVG "LEAVING SOON" 76×17, fundo vermelho).
- Criado components/ui/RatingTooltip.tsx com SVG de 3 opções (Amei/Gostei/Não curti), fundo #232323, destaque da seleção atual.
- MovieModal.tsx substituiu tooltip inline por RatingTooltip.
- WatchClient.tsx substituiu like binário (localLiked) por sistema love/like/dislike com handleRatingAction + fetch de rating existente + tooltip de 3 opções.
- my-list/page.tsx já não tinha botão de like (apenas watchlist).

## Key Decisions
- userId como estado (useState+useEffect) em vez de inline localStorage para hydration consistente.
- Match usa watchMatch (API) como primário, movie.score como fallback.
- Filmes longos filtrados por caracteres (~250) em vez de medição de layout real.
- "Títulos Semelhantes" usa mesmo padrão de breakout que CastSlider (heading com px-2, -mx- só no carrossel).
- Rank do Top 10 propagado via lookup de tmdb_id no handleMoreInfo + URL param para Watch.
- Badge Netflix usa cache module-level (Map<number, boolean>) para evitar chamadas repetidas à TMDB.
- Netflix Sans baixada do CDN oficial da Netflix (assets.nflxext.com) e hospedada localmente.
- Font-family do sistema usa apenas "Netflix Sans" sem fallbacks.
- WatchHistory para filmes armazena seasonNumber=0, episodeNumber=0; unique key composta.
- RawWatchHistory (undefined estável) como dependência de useEffect para evitar loop.
- Top10Badge substitui NetflixBadge nos cards Top 10 para não sobrepor.
- "Continue Assistindo" usa watch history em vez de watchlist.
- Hook useState em vez de useRef para userId no WatchClient para re-renderizar ao obter ID.

## Next Steps
- N/A (Tarefas principais concluídas).

## Critical Context
- Movie type (types/movie.ts) não tem campo provider; provedor é obtido via TMDB API (fetchWatchProviders).
- fetchWatchProviders já é usado em MovieModal.tsx; reaproveitado com cache no netflixCache.ts.
- TMDBService está em components/streaming/TMDBIntegration.ts.
- Rating API (/api/ratings) já suporta POST upsert com value ('love' | 'like' | 'dislike') e DELETE.
- Tabela Rating no Prisma: profileId, tmdbId, mediaType, value (String).
- Para séries, a detecção de "novo episódio" usa TMDBService.fetchSeriesDetails + season.air_date.
- MegaEmbed (player) não permite capturar currentTime; salvamos só o clique no episódio.
- Netflix Sans foi removida do body como fallback — se falhar o carregamento, não há fallback definido.
- Top10Badge e NetflixBadge compartilham mesma área (top-left) — Top10Badge tem prioridade.
- SVG do tooltip de rating (140×52) contém: mão com 2 polegares (Amei), mão com 1 polegar (Gostei), polegar para baixo (Não curti).

## Relevant Files
- components/ui/RatingTooltip.tsx: tooltip com 3 opções de rating.
- components/streaming/NetflixBadge.tsx: logo N vermelho.
- lib/netflixCache.ts: cache module-level + fetch para verificar Netflix por tmdb_id.
- types/movie.ts: Movie type (adicionados season_number?, episode_number?).
- components/streaming/TMDBIntegration.ts: TMDBService.fetchWatchProviders, fetchSeriesDetails, fetchSeasonDetails.
- components/streaming/MovieCard.tsx: NetflixBadge, NewSeasonBadge, label S1:E3 no hover.
- components/ui/Top10Card.tsx: apenas Top10Badge (NetflixBadge removido).
- components/ui/Top10Badge.tsx: SVG "10" vermelho (20×29).
- components/ui/MiniCard.tsx: NetflixBadge + NewSeasonBadge (portrait).
- components/ui/NewSeasonBadge.tsx: SVG "NOVA TEMPORADA" (70×17).
- components/ui/LeavingSoonBadge.tsx: SVG "LEAVING SOON" (76×17) — sem detecção.
- lib/newSeasonCache.ts: verifica air_date da última temporada no ano atual.
- app/my-list/page.tsx: grid inline com NetflixBadge.
- app/page.tsx: Continue Assistindo por watch history, handleWatch com ref/type/season/episode, rawWatchHistory, rawWatchlist.
- app/watch/WatchClient.tsx: rating completo (love/like/dislike), save history, urlSeason/urlEpisode.
- app/api/watch-history/route.ts: POST/DELETE aceitam seasonNumber/episodeNumber.
- app/api/ratings/route.ts: POST upsert com value (love/like/dislike), DELETE.
- app/globals.css: @font-face Netflix Sans (6 pesos), body e --font-sans sem fallbacks.
- public/fonts/: NetflixSans_W_Th, Lt, Rg, Md, Bd, Blk.woff2.
- prisma/schema.prisma: WatchHistory com seasonNumber/episodeNumber e unique key composta; Rating com profileId_tmdbId_mediaType unique.
- components/streaming/MovieModal.tsx: rating tooltip com RatingTooltip, fetch de rating no mount.
- components/streaming/HeroSection.tsx: badge Top 10 com fonte Netflix Sans, fontWeight 700.
- components/streaming/LoginRequiredModal.tsx: fontFamily Netflix Sans.
- components/ui/BaseCarousel.tsx: suporte title com Netflix Sans.
