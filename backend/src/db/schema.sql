-- Atlas AI database schema.
-- Applied automatically on startup by db/database.ts (idempotent via IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS conversations (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL DEFAULT 'New chat',
  system_prompt  TEXT NOT NULL DEFAULT '',
  model          TEXT NOT NULL,
  temperature    REAL NOT NULL DEFAULT 0.7,
  max_tokens     INTEGER NOT NULL DEFAULT 2048,
  top_p          REAL NOT NULL DEFAULT 0.9,
  pinned         INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content         TEXT NOT NULL,
  stopped         INTEGER NOT NULL DEFAULT 0,
  error           TEXT,
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

-- Full-text search over message content, used by GET /api/conversations/search.
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
  content,
  content='messages',
  content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
  INSERT INTO messages_fts(messages_fts, rowid, content) VALUES ('delete', old.rowid, old.content);
END;

CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
  INSERT INTO messages_fts(messages_fts, rowid, content) VALUES ('delete', old.rowid, old.content);
  INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
END;
