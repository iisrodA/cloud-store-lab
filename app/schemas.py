"""Pydantic models for request/response validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    genre: str
    current_version: str
    release_year: int


class Product(ProductCreate):
    id: int
    image_url: Optional[str] = None
    created_at: datetime


class CommentCreate(BaseModel):
    author: str
    content: str


class Comment(CommentCreate):
    id: int
    product_id: int
    created_at: datetime
