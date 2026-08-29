-- Atlas AI PostgreSQL database schema

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,

  user_id TEXT NOT NULL DEFAULT 'local-dev-user',

  title TEXT NOT NULL DEFAULT 'New chat',

  system_prompt TEXT NOT NULL DEFAULT '',

  model TEXT NOT NULL,

  temperature REAL NOT NULL DEFAULT 0.7,

  max_tokens INTEGER NOT NULL DEFAULT 2048,

  top_p REAL NOT NULL DEFAULT 0.9,

  pinned BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL,

  updated_at TIMESTAMPTZ NOT NULL
);


CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,

  conversation_id TEXT NOT NULL
    REFERENCES conversations(id)
    ON DELETE CASCADE,

  role TEXT NOT NULL
    CHECK (
      role IN (
        'system',
        'user',
        'assistant'
      )
    ),

  content TEXT NOT NULL,

  stopped BOOLEAN NOT NULL DEFAULT FALSE,

  error TEXT,

  metadata JSONB NOT NULL
    DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL
);


-- Existing Atlas databases may already have the
-- messages table without this column.
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS metadata JSONB
  NOT NULL DEFAULT '{}'::jsonb;


CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,

  user_id TEXT NOT NULL,

  conversation_id TEXT NOT NULL
    REFERENCES conversations(id)
    ON DELETE CASCADE,

  message_id TEXT
    REFERENCES messages(id)
    ON DELETE CASCADE,

  file_name TEXT NOT NULL,

  mime_type TEXT NOT NULL,

  size_bytes BIGINT NOT NULL
    CHECK (size_bytes >= 0),

  kind TEXT NOT NULL
    CHECK (
      kind IN (
        'image',
        'file'
      )
    ),

  storage_provider TEXT NOT NULL
    DEFAULT 'pending',

  storage_key TEXT,

  storage_url TEXT,

  status TEXT NOT NULL
    DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'uploaded',
        'failed'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,

  user_id TEXT NOT NULL,

  content TEXT NOT NULL,

  category TEXT NOT NULL
    DEFAULT 'general',

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,

  tone TEXT NOT NULL
    DEFAULT 'balanced',

  verbosity TEXT NOT NULL
    DEFAULT 'medium',

  personality TEXT NOT NULL
    DEFAULT 'default',

  language_style TEXT NOT NULL
    DEFAULT 'british',

  use_emojis BOOLEAN NOT NULL
    DEFAULT TRUE,

  custom_instructions TEXT NOT NULL
    DEFAULT '',

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id);


CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
  ON conversations(updated_at);


CREATE INDEX IF NOT EXISTS idx_conversations_user_id
  ON conversations(user_id);


CREATE INDEX IF NOT EXISTS idx_messages_content
  ON messages
  USING GIN (
    to_tsvector(
      'english',
      content
    )
  );


CREATE INDEX IF NOT EXISTS idx_attachments_user_id
  ON attachments(user_id);


CREATE INDEX IF NOT EXISTS idx_attachments_conversation_id
  ON attachments(conversation_id);


CREATE INDEX IF NOT EXISTS idx_attachments_message_id
  ON attachments(message_id);


CREATE INDEX IF NOT EXISTS idx_attachments_status
  ON attachments(status);


CREATE INDEX IF NOT EXISTS idx_memories_user_id
  ON memories(user_id);