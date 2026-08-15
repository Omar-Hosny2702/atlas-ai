import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

/**
 * Opens (creating if necessary) the SQLite database and applies the schema.
 * Safe to call multiple times — schema application is idempotent.
 */
export function getDatabase(): Database.Database {
  if (db) return db;

  const dir = path.dirname(config.databasePath);
  fs.mkdirSync(dir, { recursive: true });

  db = new Database(config.databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  const columns = db.prepare('PRAGMA table_info(conversations)').all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === 'user_id')) {
    db.exec('ALTER TABLE conversations ADD COLUMN user_id TEXT;');
  }

  db.exec(`
    UPDATE conversations SET user_id = 'legacy-unknown-user' WHERE user_id IS NULL OR user_id = '';
    CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
  `);

  logger.info(`Database ready at ${config.databasePath}`);
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
