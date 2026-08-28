import { useEffect, useState } from 'react';
import {
  getPreferences,
  updatePreferences,
  type UserPreferences,
} from '@/api/settingsApi';

export function PersonalisationSettings() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const data = await getPreferences();
      setPreferences(data);
    } catch {
      setStatus('Could not load personalisation settings.');
    }
  }

  async function saveChanges(
    updates: Partial<UserPreferences>
  ) {
    if (!preferences) return;

    const next = {
      ...preferences,
      ...updates,
    };

    setPreferences(next);
    setSaving(true);
    setStatus('');

    try {
      const saved = await updatePreferences({
        tone: next.tone,
        verbosity: next.verbosity,
        personality: next.personality,
        languageStyle: next.languageStyle,
        useEmojis: next.useEmojis,
        customInstructions: next.customInstructions,
      });

      setPreferences(saved);
      setStatus('Saved');
    } catch {
      setStatus('Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  if (!preferences) {
    return (
      <p className="text-sm text-muted-light dark:text-muted-dark">
        Loading personalisation…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-ink dark:text-paper">
          Personalisation
        </h3>

        <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
          Choose how Atlas should respond to you.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tone</label>

        <select
          value={preferences.tone}
          onChange={(e) =>
            void saveChanges({ tone: e.target.value })
          }
          className="w-full rounded-lg border border-border-light dark:border-border-dark bg-transparent px-3 py-2 text-sm"
        >
          <option value="balanced">Balanced</option>
          <option value="casual">Casual</option>
          <option value="professional">Professional</option>
          <option value="direct">Direct</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Response length
        </label>

        <select
          value={preferences.verbosity}
          onChange={(e) =>
            void saveChanges({ verbosity: e.target.value })
          }
          className="w-full rounded-lg border border-border-light dark:border-border-dark bg-transparent px-3 py-2 text-sm"
        >
          <option value="short">Concise</option>
          <option value="medium">Balanced</option>
          <option value="detailed">Detailed</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Personality
        </label>

        <select
          value={preferences.personality}
          onChange={(e) =>
            void saveChanges({ personality: e.target.value })
          }
          className="w-full rounded-lg border border-border-light dark:border-border-dark bg-transparent px-3 py-2 text-sm"
        >
          <option value="default">Default</option>
          <option value="friendly">Friendly</option>
          <option value="focused">Focused</option>
          <option value="creative">Creative</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Language style
        </label>

        <select
          value={preferences.languageStyle}
          onChange={(e) =>
            void saveChanges({ languageStyle: e.target.value })
          }
          className="w-full rounded-lg border border-border-light dark:border-border-dark bg-transparent px-3 py-2 text-sm"
        >
          <option value="british">British English</option>
          <option value="american">American English</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Use emojis</p>

          <p className="text-xs text-muted-light dark:text-muted-dark">
            Allow Atlas to use emojis naturally.
          </p>
        </div>

        <input
          type="checkbox"
          checked={preferences.useEmojis}
          onChange={(e) =>
            void saveChanges({ useEmojis: e.target.checked })
          }
          className="h-4 w-4"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Custom instructions
        </label>

        <textarea
          value={preferences.customInstructions}
          onChange={(e) =>
            setPreferences({
              ...preferences,
              customInstructions: e.target.value,
            })
          }
          onBlur={() =>
            void saveChanges({
              customInstructions: preferences.customInstructions,
            })
          }
          placeholder="Tell Atlas how you'd like it to respond..."
          rows={5}
          className="w-full resize-none rounded-lg border border-border-light dark:border-border-dark bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="min-h-5 text-xs text-muted-light dark:text-muted-dark">
        {saving ? 'Saving…' : status}
      </div>
    </div>
  );
}