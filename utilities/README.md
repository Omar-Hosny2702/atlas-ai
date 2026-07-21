# Atlas AI — Utilities

Standalone scripts that support development and setup but aren't part of
either the frontend or backend application code.

- **`setup.sh`** — checks Node/Ollama are installed, runs `npm install` in
  both `backend/` and `frontend/`, and creates `.env` files from the
  `.env.example` templates if they don't already exist.

  ```bash
  ./utilities/setup.sh
  ```

- **`check-ollama.mjs`** — pings Ollama directly and lists which models are
  pulled, without needing the backend running. Useful when debugging
  "can't reach Ollama" errors in the UI.

  ```bash
  node utilities/check-ollama.mjs
  # or against a non-default host:
  node utilities/check-ollama.mjs http://192.168.1.50:11434
  ```
