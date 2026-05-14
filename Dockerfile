# syntax=docker/dockerfile:1.7

# ─── Stage 1: build the Vite frontend ──────────────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend

# Install deps first (cached layer reuses across rebuilds when package files
# don't change). Using npm ci with the committed lockfile for reproducibility.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source and produce the production build.
COPY frontend/ ./
RUN npm run build
# Output now lives in /app/frontend/dist


# ─── Stage 2: Python runtime, serves API + the built static frontend ───────
FROM python:3.12-slim AS runtime
WORKDIR /app

# Install Python deps in a separate cached layer.
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Backend source.
COPY backend/ ./backend/

# Built frontend goes where FastAPI mounts static files (backend/static/).
COPY --from=frontend-build /app/frontend/dist ./backend/static

# Railway injects PORT at runtime. Default to 8000 for local `docker run`.
WORKDIR /app/backend
EXPOSE 8000
CMD python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
