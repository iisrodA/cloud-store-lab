"""
Cloud Games Store API — FastAPI entrypoint.

Wires together:
- Cloud SQL (PostgreSQL) for products and comments  [database.py]
- Cloud Storage for product images                  [storage.py]
- Firestore for audit events                        [firestore_service.py]
"""
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# Load .env for local development. On App Engine, env vars come from app.yaml
# and this call is a no-op when the file is absent.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import database
import firestore_service
import schemas
import storage as gcs

app = FastAPI(title="Cloud Games Store API")

# CORS open for the lab — restrict origins in real deployments.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    db_ok = database.healthcheck()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "ok" if db_ok else "unreachable",
    }


@app.post("/products", response_model=schemas.Product)
def create_product(payload: schemas.ProductCreate):
    row = database.execute(
        """
        INSERT INTO products (name, description, price, genre, current_version, release_year)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, name, description, price, genre, current_version, release_year, image_url, created_at
        """,
        (
            payload.name,
            payload.description,
            payload.price,
            payload.genre,
            payload.current_version,
            payload.release_year,
        ),
        returning=True,
    )
    firestore_service.log_event(
        "GAME_CREATED",
        product_id=row["id"],
        details={"name": row["name"], "genre": row["genre"]},
    )
    return row


@app.get("/products", response_model=list[schemas.Product])
def list_products():
    return database.fetch_all(
        """
        SELECT id, name, description, price, genre, current_version, release_year, image_url, created_at
        FROM products
        ORDER BY created_at DESC
        """
    )


@app.get("/products/{product_id}", response_model=schemas.Product)
def get_product(product_id: int):
    row = database.fetch_one(
        """
        SELECT id, name, description, price, genre, current_version, release_year, image_url, created_at
        FROM products WHERE id = %s
        """,
        (product_id,),
    )
    if not row:
        raise HTTPException(404, "Product not found")
    return row


@app.post("/products/{product_id}/image")
def upload_product_image(product_id: int, file: UploadFile = File(...)):
    if not database.fetch_one("SELECT id FROM products WHERE id = %s", (product_id,)):
        raise HTTPException(404, "Product not found")

    url = gcs.upload_image(file, product_id)

    database.execute(
        "UPDATE products SET image_url = %s WHERE id = %s",
        (url, product_id),
    )

    firestore_service.log_event(
        "IMAGE_UPLOADED",
        product_id=product_id,
        details={"url": url, "filename": file.filename},
    )
    return {"image_url": url}


@app.post("/products/{product_id}/comments", response_model=schemas.Comment)
def add_product_comment(product_id: int, payload: schemas.CommentCreate):
    if not database.fetch_one("SELECT id FROM products WHERE id = %s", (product_id,)):
        raise HTTPException(404, "Product not found")

    row = database.execute(
        """
        INSERT INTO comments (product_id, author, content)
        VALUES (%s, %s, %s)
        RETURNING id, product_id, author, content, created_at
        """,
        (product_id, payload.author, payload.content),
        returning=True,
    )
    firestore_service.log_event(
        "COMMENT_CREATED",
        product_id=product_id,
        details={"comment_id": row["id"], "author": payload.author},
    )
    return row


@app.get("/products/{product_id}/comments", response_model=list[schemas.Comment])
def list_product_comments(product_id: int):
    return database.fetch_all(
        """
        SELECT id, product_id, author, content, created_at
        FROM comments WHERE product_id = %s
        ORDER BY created_at DESC
        """,
        (product_id,),
    )


@app.get("/audit/events")
def get_audit_events(limit: int = 50):
    return firestore_service.list_events(limit=limit)
