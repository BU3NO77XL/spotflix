import { getLocalDatabase } from './init';

const db = getLocalDatabase();

// Exemplo: buscar usuário por auth_id
const user = db.prepare('SELECT * FROM users WHERE auth_id = ?').get('local-user-1');
console.log('Usuário:', user);

// Exemplo: listar watchlist do usuário
const watchlist = db.prepare('SELECT * FROM watchlist WHERE user_id = ?').all(1);
console.log('Watchlist:', watchlist);

// Exemplo: inserir histórico de assistido
const insertHistory = db.prepare(`
  INSERT INTO watch_history (user_id, tmdb_id, media_type, title, progress_percent)
  VALUES (?, ?, ?, ?, ?)
`);
insertHistory.run(1, 550, 'movie', 'Fight Club', 75);

console.log('Histórico atualizado.');
db.close();
