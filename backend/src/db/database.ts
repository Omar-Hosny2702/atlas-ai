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

  logger.info(`Database ready at ${config.databasePath}`);
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
