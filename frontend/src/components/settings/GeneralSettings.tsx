import { CheckCircle2, XCircle } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/common/Button';

const SHORTCUTS: Array<[string, string]> = [
  ['New chat', 'Ctrl/Cmd + K'],
  ['Focus search', 'Ctrl/Cmd + /'],
  ['Toggle sidebar', 'Ctrl/Cmd + B'],
  ['Open settings', 'Ctrl/Cmd + ,'],
  ['Send message', 'Enter'],
  ['New line', 'Shift + Enter'],
  ['Close dialog', 'Esc'],
];

export function GeneralSettings() {
  const { options, loading, loadError, reload } = useSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">Connection</h3>
        <div className="rounded-lg border border-border-light dark:border-border-dark px-3.5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {loading ? (
              <span className="text-muted-light dark:text-muted-dark">Checking Ollama…</span>
            ) : options?.ollama.reachable ? (
              <>
                <CheckCircle2 size={16} className="text-accent-500 dark:text-accent-dark" />
                <span>Connected to Ollama</span>
              </>
            ) : (
              <>
                <XCircle size={16} className="text-danger-light dark:text-danger-dark" />
                <span>Can't reach Ollama{loadError ? ` — ${loadError}` : ''}</span>
              </>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={reload}>
            Recheck
          </Button>
        </div>
        {options && options.ollama.reachable && (
          <p className="mt-2 text-xs text-muted-light dark:text-muted-dark">
            {options.ollama.pulledModels.length > 0
              ? `${options.ollama.pulledModels.length} model(s) pulled locally.`
              : 'No Gemini models are available. Check your Google AI Studio API key.'}
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Keyboard shortcuts</h3>
        <div className="rounded-lg border border-border-light dark:border-border-dark divide-y divide-border-light dark:divide-border-dark">
          {SHORTCUTS.map(([action, keys]) => (
            <div key={action} className="flex items-center justify-between px-3.5 py-2 text-sm">
              <span className="text-muted-light dark:text-muted-dark">{action}</span>
              <kbd className="font-mono text-xs bg-paper-alt dark:bg-ink-raised px-2 py-1 rounded">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">About</h3>
        <p className="text-sm text-muted-light dark:text-muted-dark leading-relaxed">
          Atlas AI runs entirely on your own machine. Conversations are stored locally by the
          backend, and generation happens through Ollama — no data leaves your network.
        </p>
      </div>
    </div>
  );
}
