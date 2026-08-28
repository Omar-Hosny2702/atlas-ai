import { nanoid } from 'nanoid';
import { getDatabase } from '../db/database.js';

export interface Memory {
  id: string;
  userId: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface MemoryRow {
  id: string;
  user_id: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

function rowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMemories(userId: string): Promise<Memory[]> {
  const sql = await getDatabase();

  const rows = await sql<MemoryRow[]>`
    SELECT *
    FROM memories
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;

  return rows.map(rowToMemory);
}

export async function addMemory(
  userId: string,
  content: string,
  category = 'general'
): Promise<Memory> {
  const sql = await getDatabase();
  const now = new Date().toISOString();

  const memory: MemoryRow = {
    id: nanoid(),
    user_id: userId,
    content: content.trim(),
    category,
    created_at: now,
    updated_at: now,
  };

  await sql`
    INSERT INTO memories (
      id,
      user_id,
      content,
      category,
      created_at,
      updated_at
    )
    VALUES (
      ${memory.id},
      ${memory.user_id},
      ${memory.content},
      ${memory.category},
      ${memory.created_at},
      ${memory.updated_at}
    )
  `;

  return rowToMemory(memory);
}

export async function updateMemory(
  userId: string,
  id: string,
  content: string,
  category?: string
): Promise<void> {
  const sql = await getDatabase();

  await sql`
    UPDATE memories
    SET
      content = ${content.trim()},
      category = COALESCE(${category ?? null}, category),
      updated_at = ${new Date().toISOString()}
    WHERE id = ${id}
      AND user_id = ${userId}
  `;
}

export async function deleteMemory(
  userId: string,
  id: string
): Promise<void> {
  const sql = await getDatabase();

  await sql`
    DELETE FROM memories
    WHERE id = ${id}
      AND user_id = ${userId}
  `;
}

export async function clearMemories(userId: string): Promise<void> {
  const sql = await getDatabase();

  await sql`
    DELETE FROM memories
    WHERE user_id = ${userId}
  `;
}