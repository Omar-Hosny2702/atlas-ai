# Atlas AI — AI Layer

This folder defines *which models Atlas AI can talk to and how it talks to
them*. It's deliberately kept separate from `backend/` so the model layer can
be swapped, extended, or reused without touching server/routing code.

## How inference works

Atlas AI does not ship a language model itself. Instead it drives
[Ollama](https://ollama.com), a local runtime for open-source LLMs
(Llama 3.1, Mistral, Qwen, Gemma, Phi-3, and many others). Ollama exposes a
local HTTP API; the backend's `llmService` (in `backend/src/services/`)
streams from `POST /api/chat` on that API and relays tokens to the browser
over Server-Sent Events.

```
Browser  <--SSE (tokens)--  Backend (Express)  <--HTTP stream--  Ollama  <-->  Model weights on disk
```

This means:

- **No API keys, no external calls.** Everything runs on your machine (or
  whatever server you point `OLLAMA_HOST` at).
- **Model choice is configuration, not code.** Add a model to
  `modelConfig.ts` and pull it with `ollama pull <id>` — it appears in the
  UI's model picker automatically.
- **Atlas AI does not attempt to reproduce ChatGPT.** It's a UI and backend
  around genuinely open-weight models; behavior, quality, and license all
  come from whichever model you run.

## Files

- `modelConfig.ts` — the list of supported models, their context windows,
  and default sampling parameters (temperature, max tokens, top-p).
- `systemPrompts.ts` — a small library of starter system prompts
  (general assistant, coding, concise, creative, tutor) plus the default.

## Adding a model

1. Pull it: `ollama pull <model-id>` (e.g. `ollama pull llama3.1:8b`).
2. Add an entry to `AVAILABLE_MODELS` in `modelConfig.ts` with the exact
   Ollama tag as `id`, an approximate `contextWindow`, and reasonable
   `defaults`.
3. Restart the backend. The model appears in Settings → Model immediately —
   no frontend changes needed.

## Long-context handling

Because open-source models have widely varying context windows (4K–128K
tokens in the presets above), `backend/src/services/conversationService.ts`
estimates token usage per message and truncates the oldest turns of a
conversation (always keeping the system prompt) before sending history to
the model. This keeps long chats functional instead of erroring out once a
model's window is exceeded.
