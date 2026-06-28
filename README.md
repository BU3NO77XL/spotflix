# SpotFlix

Plataforma de streaming com recomendações personalizadas usando a API do TMDB.

## Requisitos

- **Node.js** >= 18
- **pnpm** (recomendado) ou npm

```bash
# Instalar pnpm globalmente (caso não tenha)
npm install -g pnpm
```

## Primeiros passos

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd spotflix

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
```

Edite `.env` e preencha sua chave da TMDB:

```env
TMDB_API_KEY=seu_token_aqui
```

> Obtenha uma chave gratuita em: https://www.themoviedb.org/settings/api

## Banco de dados

O projeto usa **SQLite** via Prisma. O banco é criado automaticamente na raiz do projeto.

```bash
# Executar migrations do Prisma
npx prisma migrate dev

# (Opcional) Popular com dados de exemplo
pnpm db:seed
```

> `db:seed` usa o script `db/seed.ts` via `tsx`. As migrations já estão em `prisma/migrations/`.

## Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
pnpm dev
```

Acesse http://localhost:3000

## Build de produção

```bash
pnpm build
pnpm start
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia servidor de desenvolvimento |
| `pnpm build` | Compila para produção |
| `pnpm start` | Inicia servidor de produção |
| `pnpm lint` | Executa ESLint |
| `pnpm db:init` | Inicializa banco SQLite local |
| `pnpm db:seed` | Popula banco com dados de exemplo |
| `npx prisma migrate dev` | Executa migrations do Prisma |
| `npx prisma studio` | Abre interface gráfica do banco |

## Fluxo completo (primeira vez)

```bash
pnpm install
cp .env.example .env
# Editar .env com TMDB_API_KEY
npx prisma migrate dev
pnpm db:seed    # opcional
pnpm dev
```

## Tecnologias

- **Next.js 16** — framework React com App Router
- **Prisma** — ORM com SQLite
- **TMDB API** — dados de filmes e séries
- **TanStack React Query** — cache e estado server-side
- **Framer Motion** — animações
- **Tailwind CSS 4** — estilização
- **Lucide** — ícones
