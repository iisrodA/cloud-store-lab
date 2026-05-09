"""
Firestore audit log.

Stores immutable audit events ONLY (no business data). Each document records a
type, optional product_id, server timestamp, and free-form details dict.
"""
import os
from datetime import datetime, timezone
from typing import Any, Optional

from google.cloud import firestore

_client: firestore.Client | None = None


def _get_client() -> firestore.Client:
    global _client
    if _client is None:
        _client = firestore.Client()
    return _client


def _collection() -> firestore.CollectionReference:
    name = os.getenv("FIRESTORE_COLLECTION_AUDIT_EVENTS", "audit_events")
    return _get_client().collection(name)


def log_event(event_type: str, product_id: Optional[int] = None, details: Optional[dict[str, Any]] = None) -> None:
    """Persist an audit event. Failures are swallowed so the caller still succeeds."""
    try:
        _collection().add({
            "type": event_type,
            "product_id": product_id,
            "timestamp": datetime.now(timezone.utc),
            "details": details or {},
        })
    except Exception as exc:
        # Audit logging must never break the main request flow. Log and continue.
        print(f"[firestore] failed to log {event_type}: {exc}")


def list_events(limit: int = 50) -> list[dict]:
    docs = (
        _collection()
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    out: list[dict] = []
    for d in docs:
        data = d.to_dict() or {}
        data["id"] = d.id
        ts = data.get("timestamp")
        if hasattr(ts, "isoformat"):
            data["timestamp"] = ts.isoformat()
        out.append(data)
    return out
