/**
 * EXEMPLO DE MIGRAÇÃO PARA SUPABASE
 * 
 * Este arquivo mostra como migrar o sistema de localStorage para Supabase
 * 
 * PASSOS PARA IMPLEMENTAR:
 * 1. Criar conta em https://supabase.com
 * 2. Criar novo projeto
 * 3. Executar SQL abaixo no SQL Editor do Supabase
 * 4. Instalar: npm install @supabase/supabase-js
 * 5. Adicionar variáveis de ambiente no .env.local
 * 6. Renomear este arquivo para supabase.ts
 * 7. Atualizar lib/dataClient.ts para usar este cliente
 */

import { createClient } from '@supabase/supabase-js'
import { Movie, UserListItem } from '@/types/movie'

// ============================================
// SQL PARA CRIAR TABELAS NO SUPABASE
// ============================================
/*
-- Tabela de filmes
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('movie', 'series')),
  year INTEGER NOT NULL,
  rating TEXT,
  duration TEXT,
  genre TEXT[],
  synopsis TEXT,
  cast TEXT[],
  director TEXT,
  poster_url TEXT NOT NULL,
  backdrop_url TEXT,
  trailer_url TEXT,
  score NUMERIC,
  is_featured BOOLEAN DEFAULT false,
  category TEXT,
  tmdb_id INTEGER UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de listas de usuários
CREATE TABLE user_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  list_type TEXT NOT NULL CHECK (list_type IN ('favorites', 'watch_later')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id, list_type)
);

-- Índices para performance
CREATE INDEX idx_movies_category ON movies(category);
CREATE INDEX idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX idx_user_lists_user_id ON user_lists(user_id);
CREATE INDEX idx_user_lists_movie_id ON user_lists(movie_id);

-- Row Level Security (RLS)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lists ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Todos podem ler filmes
CREATE POLICY "Movies are viewable by everyone" 
  ON movies FOR SELECT 
  USING (true);

-- Apenas admins podem inserir/atualizar filmes
CREATE POLICY "Only admins can insert movies" 
  ON movies FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Usuários podem gerenciar suas próprias listas
CREATE POLICY "Users can view their own lists" 
  ON user_lists FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lists" 
  ON user_lists FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" 
  ON user_lists FOR DELETE 
  USING (auth.uid() = user_id);
*/

// ============================================
// CONFIGURAÇÃO DO CLIENTE SUPABASE
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// MOVIE ENTITY COM SUPABASE
// ============================================

export const MovieEntity = {
  async list(): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching movies:', error)
      throw error
    }
    
    return data || []
  },

  async filter(criteria: Partial<Movie>): Promise<Movie[]> {
    let query = supabase.from('movies').select('*')
    
    // Aplicar filtros dinamicamente
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value)
      }
    })
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error filtering movies:', error)
      throw error
    }
    
    return data || []
  },

  async create(movie: Omit<Movie, 'id'>): Promise<Movie> {
    const { data, error } = await supabase
      .from('movies')
      .insert([movie])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating movie:', error)
      throw error
    }
    
    return data
  },

  async bulkCreate(movies: Omit<Movie, 'id'>[]): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .insert(movies)
      .select()
    
    if (error) {
      console.error('Error bulk creating movies:', error)
      throw error
    }
    
    return data || []
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting movie:', error)
      throw error
    }
  },
}

// ============================================
// USER LIST ENTITY COM SUPABASE
// ============================================

export const UserListEntity = {
  async list(): Promise<UserListItem[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('No user logged in')
      return []
    }
    
    const { data, error } = await supabase
      .from('user_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching user lists:', error)
      throw error
    }
    
    return data || []
  },

  async create(item: Omit<UserListItem, 'id'>): Promise<UserListItem> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be logged in')
    }
    
    const { data, error } = await supabase
      .from('user_lists')
      .insert([{ ...item, user_id: user.id }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user list item:', error)
      throw error
    }
    
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_lists')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting user list item:', error)
      throw error
    }
  },
}

// ============================================
// API UNIFICADA (compatível com código existente)
// ============================================

export const base44 = {
  entities: {
    Movie: MovieEntity,
    UserList: UserListEntity,
  },
}

// ============================================
// VARIÁVEIS DE AMBIENTE NECESSÁRIAS
// ============================================
/*
Adicionar no .env.local:

NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

Adicionar no .env.example:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
*/
