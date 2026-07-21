# Atlas AI

A polished, ChatGPT-style AI assistant that runs entirely on your own
machine, powered by open-source language models through
[Ollama](https://ollama.com). No API keys, no external calls, no data
leaving your network.

<p>
  <strong>Frontend:</strong> React 18 + TypeScript + Vite + Tailwind CSS &nbsp;·&nbsp;
  <strong>Backend:</strong> Node.js + Express + TypeScript + SQLite &nbsp;·&nbsp;
  <strong>Models:</strong> any model served by Ollama (Llama 3.1, Mistral, Qwen 2.5, Gemma 2, Phi-3, …)
</p>

---

## Features

**Interface**
- Responsive, ChatGPT-inspired layout — desktop, tablet, and mobile
- Light and dark mode (follows system preference, then remembers your choice)
- Sidebar with searchable conversation history, grouped by date, with pinning
- Rename and delete conversations
- Settings modal (connection status, model defaults, appearance, data)
- Markdown rendering with GFM (tables, task lists, etc.)
- Syntax-highlighted code blocks with a one-click copy button
- Typing indicator, smooth animations, auto-scroll during generation with a
  "jump to latest" affordance when you've scrolled up
- Stop-generation and regenerate-response controls
- Toast notifications and clear error states throughout

**AI**
- Multi-turn conversations with full context retained per chat
- Token-by-token streaming over Server-Sent Events
- Per-conversation system prompt, temperature, top-p, and max-token controls
- A small library of system prompt presets (general, coding, concise,
  creative, tutor)
- Automatic history truncation so long chats keep working instead of
  erroring once a model's context window is exceeded

**Data**
- Export any conversation as Markdown, plain text, or JSON
- Import conversations from a previously exported JSON file
- Full-text search across all your chat history

**Other**
- Installable Progressive Web App with an offline app shell
- Keyboard shortcuts (see below)
- Rate limiting, input validation, and centralized error handling on the API

---

## Architecture

```
atlas-ai/
├── ai/            Model registry + system prompt presets — the layer that
│                  knows how to talk to Ollama. Swap or extend models here.
├── backend/       Express + TypeScript API. SQLite storage, SSE streaming,
│                  conversation CRUD, export/import, validation, logging.
├── frontend/      React + TypeScript + Vite + Tailwind UI.
├── assets/        Source design assets (logo, icon source).
├── config/        Cross-cutting configuration (Docker Compose, notes).
└── utilities/     Setup and diagnostic scripts.
```

```
Browser  <──SSE (tokens)──  Express backend  <──HTTP stream──  Ollama  <──>  model weights
              (frontend/)         (backend/)                (ai/ picks the model)
```

The backend never talks to any third-party API — it proxies exactly one
thing, your local Ollama server, and persists conversations in a local
SQLite file.

---

## Prerequisites

- [Node.js](https://nodejs.org) 18.18 or newer
- [Ollama](https://ollama.com), installed and on your PATH

## Setup

```bash
git clone <this-repo>
cd atlas-ai
./utilities/setup.sh
```

The script installs dependencies for both `backend/` and `frontend/` and
creates `.env` files from the provided `.env.example` templates. If you'd
rather do it by hand:

```bash
cd backend && npm install && cp .env.example .env && cd ..
cd frontend && npm install && cp .env.example .env && cd ..
```

## Pull a model

```bash
ollama pull llama3.1:8b
```

Any model in `ai/modelConfig.ts` works — pull whichever you want to use.
Smaller machines may prefer `mistral:7b` or `phi3:mini`.

## Run it

You need three things running at once, each in its own terminal:

```bash
# 1. The model runtime
ollama serve

# 2. The backend API (from the backend/ folder)
cd backend
npm run dev        # http://localhost:8787

# 3. The web app (from the frontend/ folder)
cd frontend
npm run dev         # http://localhost:5173
```

Open **http://localhost:5173** — that's Atlas AI. The Settings modal shows
whether Ollama is reachable and which models are pulled.

If Ollama is already running as a background service (common on macOS/
Windows installs), you can skip step 1.

### Docker alternative

```bash
docker compose -f config/docker-compose.yml up
```

See `config/README.md` for details.

## Production build

```bash
cd backend && npm run build && npm start
cd frontend && npm run build   # outputs static files to frontend/dist/
```

Serve `frontend/dist/` with any static file server (nginx, Caddy, etc.) and
point `VITE_API_BASE_URL` (frontend/.env, set at build time) at wherever the
backend is deployed.

---

## Keyboard shortcuts

| Action          | Shortcut          |
| --------------- | ----------------- |
| New chat        | `Ctrl/Cmd + K`     |
| Focus search    | `Ctrl/Cmd + /`     |
| Toggle sidebar  | `Ctrl/Cmd + B`     |
| Open settings   | `Ctrl/Cmd + ,`     |
| Send message    | `Enter`            |
| New line        | `Shift + Enter`    |
| Close dialog    | `Esc`              |

---

## Troubleshooting

**"Can't reach Ollama" in the UI.** Make sure `ollama serve` is running and
reachable at the URL in `backend/.env` (`OLLAMA_HOST`, default
`http://127.0.0.1:11434`). Run `node utilities/check-ollama.mjs` to test the
connection directly.

**A model doesn't respond / errors immediately.** Confirm it's actually
pulled: `ollama list`. The Settings → General panel also shows which models
Ollama currently has.

**Messages are slow.** That's the model, not Atlas AI — generation speed
depends entirely on your hardware and the model size. Try a smaller model
(`phi3:mini`, `mistral:7b`) if responses feel sluggish.

**Port already in use.** Change `PORT` in `backend/.env` or the dev server
port in `frontend/vite.config.ts`, and update `CORS_ORIGIN` /
`VITE_API_BASE_URL` to match.

---

## Notes on scope

Atlas AI is a client and server built around open-source models — it does
not include, embed, or attempt to reproduce any proprietary model or
product. Model quality, speed, and behavior come entirely from whichever
open-weight model you choose to run through Ollama.
