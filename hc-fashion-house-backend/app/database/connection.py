"""
Database connection and session management for SQLite
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get the directory where this file is located
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, "database", "ecommerce.db")

# Ensure database directory exists
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

# SQLite connection URL
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create engine with SQLite-specific settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
    echo=False  # Set to True for SQL query logging
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency to get database session.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize the database by creating all tables.
    NOTE: User tables are in Supabase Postgres, NOT SQLite.
    """
    from database.db_models import (
        Category, Catalogue, Product,
        ProductVariant, VariantOption, MediaAsset, FootwearDetails,
        Address, Order, OrderItem, ReturnRequest, ReturnRequestItem,
        ContactSubmission
    )

    # Create all tables (catalogue/product/order tables)
    Base.metadata.create_all(bind=engine)

    # NOTE: User tables (user_profile, roles, user_roles, etc.)
    # are now in Supabase Postgres. See database/supabase_schema.sql


# NOTE: _seed_roles() removed - roles are now seeded in Supabase
# Run database/supabase_schema.sql in Supabase Dashboard to set up user tables



