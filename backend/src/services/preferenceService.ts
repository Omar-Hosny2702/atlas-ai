import { getDatabase } from '../db/database.js';

export interface UserPreferences {
  userId: string;
  tone: string;
  verbosity: string;
  personality: string;
  languageStyle: string;
  useEmojis: boolean;
  customInstructions: string;
  updatedAt: string;
}

interface PreferenceRow {
  user_id: string;
  tone: string;
  verbosity: string;
  personality: string;
  language_style: string;
  use_emojis: boolean;
  custom_instructions: string;
  updated_at: string;
}

function rowToPreferences(row: PreferenceRow): UserPreferences {
  return {
    userId: row.user_id,
    tone: row.tone,
    verbosity: row.verbosity,
    personality: row.personality,
    languageStyle: row.language_style,
    useEmojis: Boolean(row.use_emojis),
    customInstructions: row.custom_instructions,
    updatedAt: row.updated_at,
  };
}

export async function getPreferences(
  userId: string
): Promise<UserPreferences> {
  const sql = await getDatabase();

  const rows = await sql<PreferenceRow[]>`
    SELECT *
    FROM user_preferences
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (rows[0]) {
    return rowToPreferences(rows[0]);
  }

  const now = new Date().toISOString();

  const created = await sql<PreferenceRow[]>`
    INSERT INTO user_preferences (
      user_id,
      tone,
      verbosity,
      personality,
      language_style,
      use_emojis,
      custom_instructions,
      updated_at
    )
    VALUES (
      ${userId},
      'balanced',
      'medium',
      'default',
      'british',
      TRUE,
      '',
      ${now}
    )
    RETURNING *
  `;

  return rowToPreferences(created[0]);
}

export async function updatePreferences(
  userId: string,
  updates: Partial<{
    tone: string;
    verbosity: string;
    personality: string;
    languageStyle: string;
    useEmojis: boolean;
    customInstructions: string;
  }>
): Promise<UserPreferences> {
  const current = await getPreferences(userId);
  const sql = await getDatabase();

  const updated = await sql<PreferenceRow[]>`
    UPDATE user_preferences
    SET
      tone = ${updates.tone ?? current.tone},
      verbosity = ${updates.verbosity ?? current.verbosity},
      personality = ${updates.personality ?? current.personality},
      language_style = ${updates.languageStyle ?? current.languageStyle},
      use_emojis = ${updates.useEmojis ?? current.useEmojis},
      custom_instructions = ${updates.customInstructions ?? current.customInstructions},
      updated_at = ${new Date().toISOString()}
    WHERE user_id = ${userId}
    RETURNING *
  `;

  return rowToPreferences(updated[0]);
}
