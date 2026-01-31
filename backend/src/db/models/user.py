"""
User model for the AI Backend with RAG + Authentication
Supports email/password and OAuth (Google/Facebook) authentication
"""
from sqlalchemy import Column, String, Boolean, Text, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from uuid import uuid4
from datetime import datetime
from ...db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(Text, nullable=True)  # Nullable for OAuth users
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Profile fields for personalization
    software_background = Column(Text, nullable=True)
    hardware_background = Column(Text, nullable=True)
    experience_level = Column(String(50), nullable=True, default="Intermediate")

    # OAuth fields
    oauth_provider = Column(String(50), nullable=True)  # 'google', 'facebook', or None
    oauth_id = Column(String(255), nullable=True)  # Provider's user ID
    profile_picture = Column(String(500), nullable=True)  # Profile picture URL from OAuth

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    chat_histories = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', full_name='{self.full_name}', oauth_provider='{self.oauth_provider}')>"

# Create indexes
Index('idx_user_email', User.email)
Index('idx_user_oauth', User.oauth_provider, User.oauth_id)