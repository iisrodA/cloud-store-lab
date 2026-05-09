# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

Cloud Games Store — a videogame catalog API + SPA built for a cloud computing course evaluation. The backend is intentionally a single small FastAPI app deployed to App Engine Standard, integrating Cloud SQL (PostgreSQL), Cloud Storage and Firestore. The frontend is React + Vite + Tailwind.

The original starter (`main.py` etc. at repo root) is the evaluation spec; the working implementation lives in `app/` and `frontend/`.

## Project Layout

```
cloud-store-lab/
├── app/                        # Backend (deployed to App Engine)
│   ├── main.py                 # FastAPI routes — wires DB + storage + firestore
│   ├── database.py             # psycopg2 (Cloud SQL: TCP local, Unix socket on App Engine)
│   ├── storage.py              # Cloud Storage uploads
│   ├── firestore_service.py    # Audit events (GAME_CREATED / IMAGE_UPLOADED / COMMENT_CREATED)
│   ├── schemas.py              # Pydantic models
│   ├── init.sql                # PostgreSQL schema
│   └── app.yaml                # App Engine deployment config
├── frontend/
│   ├── src/pages/              # Home, CreateGame, GameDetail
│   ├── src/components/         # Layout, GameCard
│   └── src/services/api.ts     # Backend client
├── README.md                   # High-level
├── app/README.md               # Backend deep-dive (IAM, troubleshooting, examples)
└── instrucciones.html          # Original evaluation spec
```

The repo root still contains `main.py`, `requirements.txt`, `.env.example`, `app.yaml.example` from the original starter — these are deprecated; use the `app/` versions.

## Common Commands

**Backend (from `app/`):**
```bash
pip install -r requirements.txt
uvicorn main:app --reload      # local dev — flat imports require running from app/
gcloud app deploy app.yaml     # production
gcloud app logs tail -s default
```

**Frontend (from `frontend/`):**
```bash
npm install
npm run dev                    # http://localhost:5173
npm run build                  # outputs dist/
```

**DB schema:**
```bash
psql -h localhost -U postgres -d cloudgames -f app/init.sql
```

## Architecture Notes

- **Imports are flat** (`import database`) not relative (`from . import database`). This is because `gcloud app deploy app.yaml` from `app/` makes that directory the source root.
- **Cloud SQL connection has two modes**, switched by env var:
  - If `INSTANCE_CONNECTION_NAME` is set → Unix socket `/cloudsql/<conn>` (App Engine).
  - Otherwise → TCP via `DB_HOST`/`DB_PORT` (local, Cloud SQL Auth Proxy, or public IP).
  - `DB_HOST` is *ignored* in socket mode. See [app/database.py](app/database.py).
- **Firestore is audit-only** — products and comments live in PostgreSQL. Don't put business data in Firestore.
- **Image URLs** returned from `storage.upload_image` use `https://storage.googleapis.com/<bucket>/<object>` and require the bucket/object to grant read to `allUsers` (or be served via signed URLs — not implemented).
- **Audit logging never raises** — `firestore_service.log_event` swallows exceptions so a Firestore outage doesn't block writes to Postgres.

## App Engine Deployment Specifics

- `app.yaml` lives inside `app/`. Always deploy with `gcloud app deploy app.yaml` from that directory.
- Cloud SQL socket only mounts when `beta_settings.cloud_sql_instances` is set in `app.yaml` — both that AND the `INSTANCE_CONNECTION_NAME` env var are required.
- Default service account `<PROJECT>@appspot.gserviceaccount.com` needs: `roles/cloudsql.client`, `roles/storage.objectAdmin`, `roles/datastore.user`.

## Frontend ↔ Backend Contract

Frontend hits the API URL from `VITE_API_URL` (defaults to `http://localhost:8000`). The `api` object in [frontend/src/services/api.ts](frontend/src/services/api.ts) is the single source of truth for endpoint shapes — keep it in sync with `app/schemas.py`.

CORS is open (`allow_origins=["*"]`) for the lab. Tighten before any production use.

## Out-of-scope (do not implement)

Per the project spec: no auth, no JWT, no SQLAlchemy/ORM, no Docker orchestration, no Redis/Celery, no CI/CD, no admin dashboard, no websockets. Keep features minimal so the cloud integration story stays clear.
