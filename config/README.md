# Atlas AI — Configuration

This folder holds configuration that spans the whole project rather than
belonging to just the frontend or backend.

- **`docker-compose.yml`** — optional convenience setup that runs Ollama, the
  backend, and the frontend together in containers. See the comments at the
  top of the file for usage. Not required — `utilities/setup.sh` plus
  `npm run dev` in `backend/` and `frontend/` is the simpler path for local
  development.

Per-service configuration (ports, CORS origin, database path, model
selection, API base URL) lives next to the code that reads it:

- `backend/.env.example` → copy to `backend/.env`
- `frontend/.env.example` → copy to `frontend/.env`

See the root `README.md` for the full setup walkthrough.
