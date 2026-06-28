import { getLocalDatabase } from './init';

const db = getLocalDatabase();

try {
  db.prepare(`
    INSERT OR IGNORE INTO users (auth_id, email, full_name, avatar_url)
    VALUES
      ('local-user-1', 'demo@example.com', 'Demo User', 'https://example.com/avatar.png')
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO profiles (user_id, display_name, bio, favorite_genres)
    VALUES
      (1, 'Demo User', 'Usuário de teste local', 'drama,comedy')
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO watchlist (user_id, tmdb_id, media_type, title, poster_url)
    VALUES
      (1, 550, 'movie', 'Fight Club', 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg')
  `).run();

  console.log('Seed executado com sucesso.');
} finally {
  db.close();
}
