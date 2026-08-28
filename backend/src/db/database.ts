import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

let sql: postgres.Sql | null = null;

export async function getDatabase(): Promise<postgres.Sql> {
  if (sql) return sql;

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }

  sql = postgres(config.databaseUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  await sql.unsafe(schema);

  logger.info('PostgreSQL database ready');

  return sql;
}

export async function closeDatabase(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
  }
}