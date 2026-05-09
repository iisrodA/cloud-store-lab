-- Schema for the Cloud Games Store relational data.
-- Run once against the Cloud SQL database (see README "Cloud SQL setup").

CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255)     NOT NULL,
    description     TEXT,
    price           DOUBLE PRECISION NOT NULL,
    genre           VARCHAR(100)     NOT NULL,
    current_version VARCHAR(50)      NOT NULL,
    release_year    INTEGER          NOT NULL,
    image_url       TEXT,
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id          SERIAL PRIMARY KEY,
    product_id  INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    author      VARCHAR(255) NOT NULL,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_product_id ON comments(product_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
