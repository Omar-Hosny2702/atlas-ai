import { addMemory, getMemories, updateMemory } from './memoryService.js';
import { getDatabase } from '../db/database.js';

interface ExtractedMemory {
  content: string;
  category?: string;
}

function normalise(text: string): string {
  return text.trim().toLowerCase();
}

export async function saveUsefulMemories(
  userId: string,
  memories: ExtractedMemory[]
): Promise<void> {
  if (!memories.length) return;

  const existing = await getMemories(userId);

  for (const memory of memories) {
    const content = memory.content.trim();
    if (!content) continue;

    const duplicate = existing.find(
      (item) => normalise(item.content) === normalise(content)
    );

    if (duplicate) {
      await updateMemory(
        userId,
        duplicate.id,
        content,
        memory.category ?? duplicate.category
      );
      continue;
    }

    await addMemory(
      userId,
      content,
      memory.category ?? 'general'
    );
  }
}

export async function deleteMemoryByContent(
  userId: string,
  search: string
): Promise<void> {
  const sql = await getDatabase();
  const like = `%${search.trim()}%`;

  await sql`
    DELETE FROM memories
    WHERE user_id = ${userId}
      AND content ILIKE ${like}
  `;
}