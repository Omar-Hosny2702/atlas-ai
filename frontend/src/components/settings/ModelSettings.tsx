import { useSettings } from '@/context/SettingsContext';

export interface ModelSettingsValues {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

interface ModelSettingsProps {
  values: ModelSettingsValues;
  onChange: (patch: Partial<ModelSettingsValues>) => void;
}

export function ModelSettings({ values, onChange }: ModelSettingsProps) {
  const { options } = useSettings();
  const bounds = options?.paramBounds;
  const models = options?.models ?? [];
  const presets = options?.systemPromptPresets ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="model-select">
          Model
        </label>
        <select
          id="model-select"
          value={values.model}
          onChange={(e) => onChange({ model: e.target.value })}
          className="w-full rounded-lg border border-border-light dark:border-border-dark bg-paper dark:bg-ink-alt px-3 py-2 text-sm outline-none focus:border-accent-500 dark:focus:border-accent-dark"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} — {m.description}
            </option>
          ))}
        </select>
        {options && !options.ollama.pulledModels.some((m) => m === values.model) && (
          <p className="mt-1.5 text-xs text-danger-light dark:text-danger-dark">
            This model doesn't look pulled yet. Run{' '}
            <code className="font-mono">ollama pull {values.model}</code> first.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium" htmlFor="system-prompt">
            System prompt
          </label>
          <select
            aria-label="Load a preset system prompt"
            onChange={(e) => {
              const preset = presets.find((p) => p.id === e.target.value);
              if (preset) onChange({ systemPrompt: preset.prompt });
            }}
            defaultValue=""
            className="text-xs bg-transparent text-accent-500 dark:text-accent-dark outline-none"
          >
            <option value="" disabled>
              Load preset…
            </option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <textarea
          id="system-prompt"
          value={values.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          rows={4}
          className="w-full resize-y rounded-lg border border-border-light dark:border-border-dark bg-paper dark:bg-ink-alt px-3 py-2 text-sm outline-none focus:border-accent-500 dark:focus:border-accent-dark"
        />
      </div>

      <SliderField
        id="temperature"
        label="Temperature"
        hint="Lower is more focused and deterministic; higher is more varied and creative."
        value={values.temperature}
        min={bounds?.temperature.min ?? 0}
        max={bounds?.temperature.max ?? 2}
        step={0.05}
        onChange={(v) => onChange({ temperature: v })}
      />

      <SliderField
        id="top-p"
        label="Top-p"
        hint="Limits sampling to the smallest set of likely next-tokens. Leave at 0.9 unless you have a reason to change it."
        value={values.topP}
        min={bounds?.topP.min ?? 0}
        max={bounds?.topP.max ?? 1}
        step={0.05}
        onChange={(v) => onChange({ topP: v })}
      />

      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="max-tokens">
          Max response tokens
        </label>
        <input
          id="max-tokens"
          type="number"
          value={values.maxTokens}
          min={bounds?.maxTokens.min ?? 1}
          max={bounds?.maxTokens.max ?? 8192}
          onChange={(e) => onChange({ maxTokens: Number(e.target.value) })}
          className="w-full rounded-lg border border-border-light dark:border-border-dark bg-paper dark:bg-ink-alt px-3 py-2 text-sm outline-none focus:border-accent-500 dark:focus:border-accent-dark"
        />
        <p className="mt-1.5 text-xs text-muted-light dark:text-muted-dark">
          Caps how long a single reply can be. Higher values use more memory and take longer.
        </p>
      </div>
    </div>
  );
}

interface SliderFieldProps {
  id: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function SliderField({ id, label, hint, value, min, max, step, onChange }: SliderFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        <span className="text-xs font-mono text-muted-light dark:text-muted-dark">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent-500 dark:accent-accent-dark"
      />
      <p className="mt-1 text-xs text-muted-light dark:text-muted-dark">{hint}</p>
    </div>
  );
}
