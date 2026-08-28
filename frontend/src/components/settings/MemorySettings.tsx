import { useEffect, useState } from 'react';
import {
  clearMemories,
  deleteMemory,
  getMemories,
  type Memory,
} from '@/api/settingsApi';

export function MemorySettings() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void loadMemories();
  }, []);

  async function loadMemories() {
    try {
      setLoading(true);
      const data = await getMemories();
      setMemories(data);
    } catch {
      setStatus('Could not load memories.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMemory(id);
      setMemories((current) =>
        current.filter((memory) => memory.id !== id)
      );
    } catch {
      setStatus('Could not delete memory.');
    }
  }

  async function handleClearAll() {
    const confirmed = window.confirm(
      'Clear all saved memories for this account?'
    );

    if (!confirmed) return;

    try {
      await clearMemories();
      setMemories([]);
      setStatus('All memories cleared.');
    } catch {
      setStatus('Could not clear memories.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-ink dark:text-paper">
          Memory
        </h3>

        <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
          Atlas can remember useful details from your conversations and use
          them in future chats.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-light dark:text-muted-dark">
          Loading memories…
        </p>
      ) : memories.length === 0 ? (
        <div className="rounded-lg border border-border-light dark:border-border-dark p-4">
          <p className="text-sm font-medium">No saved memories</p>

          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
            When Atlas remembers something useful about you, it will appear
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-border-light dark:border-border-dark p-3"
            >
              <div className="min-w-0">
                <p className="text-sm">
                  {memory.content}
                </p>

                <p className="text-xs text-muted-light dark:text-muted-dark mt-1 capitalize">
                  {memory.category}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleDelete(memory.id)}
                className="shrink-0 text-xs text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {memories.length > 0 && (
        <button
          type="button"
          onClick={() => void handleClearAll()}
          className="text-sm text-red-500 hover:text-red-600"
        >
          Clear all memories
        </button>
      )}

      {status && (
        <p className="text-xs text-muted-light dark:text-muted-dark">
          {status}
        </p>
      )}
    </div>
  );
}