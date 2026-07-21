#!/usr/bin/env bash
#
# Atlas AI — one-shot setup script.
# Checks prerequisites, installs backend + frontend dependencies, and copies
# .env.example files if .env doesn't exist yet. Safe to re-run.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[atlas-ai]${NC} $1"; }
warn()  { echo -e "${YELLOW}[atlas-ai]${NC} $1"; }
fail()  { echo -e "${RED}[atlas-ai]${NC} $1"; exit 1; }

command -v node >/dev/null 2>&1 || fail "Node.js is not installed. Install Node 18.18+ from https://nodejs.org and re-run this script."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js 18.18+ is required (found $(node -v)). Please upgrade."
fi
info "Node.js $(node -v) found."

if command -v ollama >/dev/null 2>&1; then
  info "Ollama found: $(ollama --version 2>/dev/null || echo installed)."
else
  warn "Ollama was not found on your PATH."
  warn "Atlas AI needs it to generate responses — install it from https://ollama.com,"
  warn "then run: ollama pull llama3.1:8b"
fi

info "Installing backend dependencies…"
(cd "$ROOT_DIR/backend" && npm install)

info "Installing frontend dependencies…"
(cd "$ROOT_DIR/frontend" && npm install)

if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
  info "Created backend/.env from backend/.env.example."
fi

if [ ! -f "$ROOT_DIR/frontend/.env" ]; then
  cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env"
  info "Created frontend/.env from frontend/.env.example."
fi

info "Setup complete."
echo ""
echo "Next steps:"
echo "  1. Make sure Ollama is running:      ollama serve"
echo "  2. Pull a model (first time only):   ollama pull llama3.1:8b"
echo "  3. Start the backend:                cd backend && npm run dev"
echo "  4. In another terminal, the UI:      cd frontend && npm run dev"
echo "  5. Open:                             http://localhost:5173"
