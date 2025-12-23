"""
Database connection and session management for Neon Postgres
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import logging

logger = logging.getLogger(__name__)

# Get database URL from environment
DATABASE_URL = os.getenv("NEON_POSTGRES_URL")

if not DATABASE_URL:
    logger.warning("NEON_POSTGRES_URL not set. Database features will be disabled.")
    engine = None
    SessionLocal = None
else:
    # Create engine with proper connection pooling for Neon
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,  # Use NullPool for serverless environments
        echo=False,  # Set to True for SQL debugging
        connect_args={
            "connect_timeout": 10,
        }
    )

    # Create session factory
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    logger.info("Database engine created successfully")

# Base class for models
Base = declarative_base()

def get_db():
    """
    Dependency function to get database session
    Usage in FastAPI:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            ...
    """
    if SessionLocal is None:
        raise RuntimeError("Database is not configured. Set NEON_POSTGRES_URL environment variable.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database tables
    Call this on application startup
    """
    if engine is None:
        logger.warning("Database engine is None. Skipping database initialization.")
        return

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise
