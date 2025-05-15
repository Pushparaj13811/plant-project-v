from typing import Generator
import re

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

# Determine if we're using SQLite
is_sqlite = settings.SQLALCHEMY_DATABASE_URI.startswith("sqlite://")

# Create SQLAlchemy engine with appropriate parameters
if is_sqlite:
    engine = create_engine(
        settings.SQLALCHEMY_DATABASE_URI, connect_args={"check_same_thread": False}
    )
else:
    # For PostgreSQL, MySQL, etc.
    engine = create_engine(
        settings.SQLALCHEMY_DATABASE_URI,
        pool_pre_ping=True,  # Check if connection is alive
        pool_size=10,        # Maximum number of connections to keep
        max_overflow=20      # Maximum number of connections to create beyond pool_size
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for getting database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_db_and_tables() -> None:
    """
    Create database tables
    """
    Base.metadata.create_all(bind=engine) 