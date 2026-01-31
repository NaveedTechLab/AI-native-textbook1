"""
Database models for Neon Postgres
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Nullable for OAuth users
    full_name = Column(String(255), nullable=True)
    software_background = Column(Text, nullable=True)
    hardware_background = Column(Text, nullable=True)
    experience_level = Column(String(50), nullable=True, default="Intermediate")

    # OAuth fields
    oauth_provider = Column(String(50), nullable=True)  # 'google', 'facebook', or None
    oauth_id = Column(String(255), nullable=True)  # Provider's user ID
    profile_picture = Column(String(500), nullable=True)  # Profile picture URL from OAuth

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Index for OAuth lookup
    __table_args__ = (
        Index('idx_user_oauth', 'oauth_provider', 'oauth_id'),
    )

class Personalization(Base):
    __tablename__ = "personalizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    chapter_id = Column(String(255), nullable=False, index=True)
    personalized_content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Composite unique constraint: one personalization per user per chapter
    __table_args__ = (
        UniqueConstraint('user_id', 'chapter_id', name='uq_user_chapter'),
    )

class Translation(Base):
    __tablename__ = "translations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(String(255), nullable=False, index=True)
    content_hash = Column(String(64), nullable=False, index=True)
    source_language = Column(String(10), nullable=False, default="english")
    target_language = Column(String(10), nullable=False, index=True)
    original_content = Column(Text, nullable=False)
    translated_content = Column(Text, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Composite unique constraint: one translation per (chapter_id, content_hash, target_language)
    __table_args__ = (
        UniqueConstraint('chapter_id', 'content_hash', 'target_language', name='uq_chapter_hash_language'),
        Index('idx_translations_lookup', 'chapter_id', 'content_hash', 'target_language'),
    )
