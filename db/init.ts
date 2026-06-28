import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db', 'local.sqlite');
const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');

export function initLocalDatabase() {
  const db = new Database(dbPath);
  const schema = fs.readFileSync(schemaPath, 'utf8');

  db.exec(schema);

  db.prepare(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO app_meta(key, value)
    VALUES ('db_version', '1')
  `).run();

  return db;
}

export function getLocalDatabase() {
  return initLocalDatabase();
}
