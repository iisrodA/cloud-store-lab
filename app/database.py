"""
PostgreSQL access layer using psycopg2.

Runs in two modes:
- Local: TCP connection using DB_HOST/DB_PORT (e.g. Cloud SQL Auth Proxy or local Postgres).
- App Engine: Unix socket connection via /cloudsql/<INSTANCE_CONNECTION_NAME>, which
  App Engine mounts when `cloud_sql_instances` is set in app.yaml. There is no DB_HOST
  in this mode — the socket path replaces the host.
"""
import os
from contextlib import contextmanager

import psycopg2
from psycopg2.extras import RealDictCursor


def _connection_kwargs() -> dict:
    instance = os.getenv("INSTANCE_CONNECTION_NAME")
    if instance:
        # App Engine Standard mounts the Cloud SQL socket here automatically.
        return {
            "host": f"/cloudsql/{instance}",
            "dbname": os.getenv("DB_NAME"),
            "user": os.getenv("DB_USER"),
            "password": os.getenv("DB_PASSWORD"),
        }
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "dbname": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
    }


@contextmanager
def get_connection():
    conn = psycopg2.connect(**_connection_kwargs())
    try:
        yield conn
    finally:
        conn.close()


def fetch_all(query: str, params: tuple = ()) -> list[dict]:
    with get_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query, params)
        return [dict(r) for r in cur.fetchall()]


def fetch_one(query: str, params: tuple = ()) -> dict | None:
    with get_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query, params)
        row = cur.fetchone()
        return dict(row) if row else None


def execute(query: str, params: tuple = (), returning: bool = False) -> dict | None:
    with get_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query, params)
        result = dict(cur.fetchone()) if returning else None
        conn.commit()
        return result


def healthcheck() -> bool:
    try:
        with get_connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        return True
    except Exception:
        return False
