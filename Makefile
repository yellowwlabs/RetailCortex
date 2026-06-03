.PHONY: install dev dev-frontend dev-backend dev-app \
        build typecheck lint format check test clean \
        migrate migrate-make backend-lint backend-format backend-test

# ── install ───────────────────────────────────────────────────────────────────
install:
	pnpm install
	cd backend && uv sync

# ── dev ───────────────────────────────────────────────────────────────────────
dev:
	pnpm dev

dev-frontend:
	pnpm dev:frontend

dev-backend:
	pnpm dev:backend

dev-app:
	pnpm dev:app

# ── build ─────────────────────────────────────────────────────────────────────
build:
	pnpm build

# ── typecheck ─────────────────────────────────────────────────────────────────
typecheck:
	pnpm typecheck

# ── lint ──────────────────────────────────────────────────────────────────────
lint: backend-lint
	pnpm lint

backend-lint:
	cd backend && uv run ruff check src/

# ── format ────────────────────────────────────────────────────────────────────
format: backend-format
	pnpm format

backend-format:
	cd backend && uv run ruff format src/

# ── check (lint + format) ─────────────────────────────────────────────────────
check:
	pnpm check

# ── test ──────────────────────────────────────────────────────────────────────
test: backend-test
	pnpm test

backend-test:
	cd backend && uv run pytest

# ── db ────────────────────────────────────────────────────────────────────────
migrate:
	cd backend && uv run aerich upgrade

migrate-make:
	cd backend && uv run aerich migrate --name $(name)

# ── clean ─────────────────────────────────────────────────────────────────────
clean:
	pnpm turbo clean
	find . -name '.next' -maxdepth 3 -type d -exec rm -rf {} + 2>/dev/null; true
	find . -name 'dist'  -maxdepth 3 -type d -exec rm -rf {} + 2>/dev/null; true
	find . -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null; true
	find . -name '*.pyc' -delete 2>/dev/null; true
