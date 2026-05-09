"""
Cloud Storage uploads.

The bucket name comes from GCS_BUCKET_NAME. On App Engine, authentication uses the
default service account automatically; locally, it uses GOOGLE_APPLICATION_CREDENTIALS.

For the returned URL to be publicly accessible, the bucket (or object) must grant
read to allUsers, OR be served via Uniform bucket-level access with a public role.
"""
import os
import uuid

from fastapi import HTTPException, UploadFile
from google.cloud import storage

_client: storage.Client | None = None


def _get_client() -> storage.Client:
    global _client
    if _client is None:
        _client = storage.Client()
    return _client


def upload_image(file: UploadFile, product_id: int) -> str:
    bucket_name = os.getenv("GCS_BUCKET_NAME")
    if not bucket_name:
        raise HTTPException(500, "GCS_BUCKET_NAME is not configured")

    contents = file.file.read()
    if not contents:
        raise HTTPException(400, "Uploaded file is empty")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "bin"
    object_name = f"products/{product_id}/{uuid.uuid4().hex}.{ext}"

    try:
        bucket = _get_client().bucket(bucket_name)
        blob = bucket.blob(object_name)
        blob.upload_from_string(contents, content_type=file.content_type or "application/octet-stream")
    except Exception as exc:
        # Common causes: 403 (missing IAM role), bucket not found, region mismatch.
        raise HTTPException(500, f"Cloud Storage upload failed: {exc}") from exc

    # Public URL works only if the bucket/object grants read to allUsers.
    return f"https://storage.googleapis.com/{bucket_name}/{object_name}"
