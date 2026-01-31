"""
CRUD operations for the AI Backend with RAG + Authentication
Implements Create, Read, Update, Delete operations for all models
"""
from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import logging

from .models.user import User
from .models.chat_history import ChatHistory
from .models.document import Document

logger = logging.getLogger(__name__)


# User CRUD Operations
async def create_user(
    db: AsyncSession,
    email: str,
    hashed_password: Optional[str] = None,
    full_name: Optional[str] = None,
    software_background: Optional[str] = None,
    hardware_background: Optional[str] = None,
    experience_level: Optional[str] = "Intermediate",
    oauth_provider: Optional[str] = None,
    oauth_id: Optional[str] = None,
    profile_picture: Optional[str] = None
) -> User:
    """Create a new user (supports both email/password and OAuth)"""
    try:
        db_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            software_background=software_background,
            hardware_background=hardware_background,
            experience_level=experience_level,
            oauth_provider=oauth_provider,
            oauth_id=oauth_id,
            profile_picture=profile_picture
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        logger.info(f"User created with email: {email}, oauth_provider: {oauth_provider}")
        return db_user
    except IntegrityError:
        await db.rollback()
        logger.warning(f"User with email {email} already exists")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating user: {e}")
        raise


async def get_user_by_oauth(db: AsyncSession, oauth_provider: str, oauth_id: str) -> Optional[User]:
    """Get a user by OAuth provider and ID"""
    try:
        result = await db.execute(
            select(User).filter(
                User.oauth_provider == oauth_provider,
                User.oauth_id == oauth_id
            )
        )
        user = result.scalar_one_or_none()
        return user
    except Exception as e:
        logger.error(f"Error getting user by OAuth: {e}")
        raise


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get a user by ID"""
    try:
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalar_one_or_none()
        return user
    except Exception as e:
        logger.error(f"Error getting user by ID: {e}")
        raise


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get a user by email"""
    try:
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalar_one_or_none()
        return user
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        raise


async def update_user(db: AsyncSession, user_id: UUID, **kwargs) -> Optional[User]:
    """Update a user"""
    try:
        query = update(User).where(User.id == user_id).values(**kwargs).returning(User)
        result = await db.execute(query)
        await db.commit()

        updated_user = result.scalar_one_or_none()
        if updated_user:
            logger.info(f"User updated with ID: {user_id}")
        return updated_user
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating user: {e}")
        raise


async def delete_user(db: AsyncSession, user_id: UUID) -> bool:
    """Delete a user"""
    try:
        result = await db.execute(delete(User).where(User.id == user_id))
        await db.commit()
        deleted_count = result.rowcount
        if deleted_count > 0:
            logger.info(f"User deleted with ID: {user_id}")
        return deleted_count > 0
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting user: {e}")
        raise


async def list_users(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
    """List users with pagination"""
    try:
        result = await db.execute(select(User).offset(skip).limit(limit))
        users = result.scalars().all()
        return users
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise


# ChatHistory CRUD Operations
async def create_chat_history(db: AsyncSession, user_id: UUID, query: str, response: str, context_used: Optional[str] = None) -> ChatHistory:
    """Create a new chat history record"""
    try:
        db_chat_history = ChatHistory(
            user_id=user_id,
            query=query,
            response=response,
            context_used=context_used
        )
        db.add(db_chat_history)
        await db.commit()
        await db.refresh(db_chat_history)
        logger.info(f"Chat history created for user: {user_id}")
        return db_chat_history
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating chat history: {e}")
        raise


async def get_chat_history_by_id(db: AsyncSession, chat_history_id: UUID) -> Optional[ChatHistory]:
    """Get a chat history record by ID"""
    try:
        result = await db.execute(select(ChatHistory).filter(ChatHistory.id == chat_history_id))
        chat_history = result.scalar_one_or_none()
        return chat_history
    except Exception as e:
        logger.error(f"Error getting chat history by ID: {e}")
        raise


async def get_chat_histories_by_user(db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 100) -> List[ChatHistory]:
    """Get all chat histories for a user"""
    try:
        result = await db.execute(
            select(ChatHistory)
            .filter(ChatHistory.user_id == user_id)
            .order_by(ChatHistory.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        chat_histories = result.scalars().all()
        return chat_histories
    except Exception as e:
        logger.error(f"Error getting chat histories by user: {e}")
        raise


async def update_chat_history(db: AsyncSession, chat_history_id: UUID, **kwargs) -> Optional[ChatHistory]:
    """Update a chat history record"""
    try:
        query = update(ChatHistory).where(ChatHistory.id == chat_history_id).values(**kwargs).returning(ChatHistory)
        result = await db.execute(query)
        await db.commit()

        updated_chat_history = result.scalar_one_or_none()
        if updated_chat_history:
            logger.info(f"Chat history updated with ID: {chat_history_id}")
        return updated_chat_history
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating chat history: {e}")
        raise


async def delete_chat_history(db: AsyncSession, chat_history_id: UUID) -> bool:
    """Delete a chat history record"""
    try:
        result = await db.execute(delete(ChatHistory).where(ChatHistory.id == chat_history_id))
        await db.commit()
        deleted_count = result.rowcount
        if deleted_count > 0:
            logger.info(f"Chat history deleted with ID: {chat_history_id}")
        return deleted_count > 0
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting chat history: {e}")
        raise


# Document CRUD Operations
async def create_document(db: AsyncSession, user_id: UUID, title: str, content: str, content_hash: str,
                         file_path: Optional[str] = None, metadata: Optional[dict] = None) -> Document:
    """Create a new document"""
    try:
        db_document = Document(
            user_id=user_id,
            title=title,
            content=content,
            content_hash=content_hash,
            file_path=file_path,
            metadata=metadata
        )
        db.add(db_document)
        await db.commit()
        await db.refresh(db_document)
        logger.info(f"Document created for user: {user_id}, title: {title}")
        return db_document
    except IntegrityError:
        await db.rollback()
        logger.warning(f"Document with content_hash {content_hash} already exists")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document with this content already exists"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating document: {e}")
        raise


async def get_document_by_id(db: AsyncSession, document_id: UUID) -> Optional[Document]:
    """Get a document by ID"""
    try:
        result = await db.execute(select(Document).filter(Document.id == document_id))
        document = result.scalar_one_or_none()
        return document
    except Exception as e:
        logger.error(f"Error getting document by ID: {e}")
        raise


async def get_documents_by_user(db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Document]:
    """Get all documents for a user"""
    try:
        result = await db.execute(
            select(Document)
            .filter(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        documents = result.scalars().all()
        return documents
    except Exception as e:
        logger.error(f"Error getting documents by user: {e}")
        raise


async def get_document_by_hash(db: AsyncSession, content_hash: str) -> Optional[Document]:
    """Get a document by content hash"""
    try:
        result = await db.execute(select(Document).filter(Document.content_hash == content_hash))
        document = result.scalar_one_or_none()
        return document
    except Exception as e:
        logger.error(f"Error getting document by hash: {e}")
        raise


async def update_document(db: AsyncSession, document_id: UUID, **kwargs) -> Optional[Document]:
    """Update a document"""
    try:
        query = update(Document).where(Document.id == document_id).values(**kwargs).returning(Document)
        result = await db.execute(query)
        await db.commit()

        updated_document = result.scalar_one_or_none()
        if updated_document:
            logger.info(f"Document updated with ID: {document_id}")
        return updated_document
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating document: {e}")
        raise


async def delete_document(db: AsyncSession, document_id: UUID) -> bool:
    """Delete a document"""
    try:
        result = await db.execute(delete(Document).where(Document.id == document_id))
        await db.commit()
        deleted_count = result.rowcount
        if deleted_count > 0:
            logger.info(f"Document deleted with ID: {document_id}")
        return deleted_count > 0
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting document: {e}")
        raise


# Chat History CRUD Operations
async def create_chat_history_entry(db: AsyncSession, user_id: UUID, query: str, response: str, context_used: Optional[str] = None) -> ChatHistory:
    """Create a new chat history entry"""
    try:
        db_chat_history = ChatHistory(
            user_id=user_id,
            query=query,
            response=response,
            context_used=context_used
        )
        db.add(db_chat_history)
        await db.commit()
        await db.refresh(db_chat_history)
        logger.info(f"Chat history created for user: {user_id}")
        return db_chat_history
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating chat history: {e}")
        raise


async def get_chat_history_by_id(db: AsyncSession, chat_history_id: UUID) -> Optional[ChatHistory]:
    """Get a chat history record by ID"""
    try:
        result = await db.execute(select(ChatHistory).filter(ChatHistory.id == chat_history_id))
        chat_history = result.scalar_one_or_none()
        return chat_history
    except Exception as e:
        logger.error(f"Error getting chat history by ID: {e}")
        raise


async def get_chat_histories_by_user(db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 100) -> List[ChatHistory]:
    """Get all chat histories for a user"""
    try:
        result = await db.execute(
            select(ChatHistory)
            .filter(ChatHistory.user_id == user_id)
            .order_by(ChatHistory.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        chat_histories = result.scalars().all()
        return chat_histories
    except Exception as e:
        logger.error(f"Error getting chat histories by user: {e}")
        raise


async def get_user_chat_history_count(db: AsyncSession, user_id: UUID) -> int:
    """Get the count of chat history records for a user"""
    try:
        from sqlalchemy import func
        result = await db.execute(
            select(func.count(ChatHistory.id))
            .filter(ChatHistory.user_id == user_id)
        )
        count = result.scalar_one()
        return count
    except Exception as e:
        logger.error(f"Error getting chat history count for user: {e}")
        raise


async def update_chat_history(db: AsyncSession, chat_history_id: UUID, **kwargs) -> Optional[ChatHistory]:
    """Update a chat history record"""
    try:
        query = update(ChatHistory).where(ChatHistory.id == chat_history_id).values(**kwargs).returning(ChatHistory)
        result = await db.execute(query)
        await db.commit()

        updated_chat_history = result.scalar_one_or_none()
        if updated_chat_history:
            logger.info(f"Chat history updated with ID: {chat_history_id}")
        return updated_chat_history
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating chat history: {e}")
        raise


async def delete_chat_history(db: AsyncSession, chat_history_id: UUID) -> bool:
    """Delete a chat history record"""
    try:
        result = await db.execute(delete(ChatHistory).where(ChatHistory.id == chat_history_id))
        await db.commit()
        deleted_count = result.rowcount
        if deleted_count > 0:
            logger.info(f"Chat history deleted with ID: {chat_history_id}")
        return deleted_count > 0
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting chat history: {e}")
        raise


async def delete_user_chat_history(db: AsyncSession, user_id: UUID) -> bool:
    """Delete all chat history records for a user"""
    try:
        result = await db.execute(delete(ChatHistory).where(ChatHistory.user_id == user_id))
        await db.commit()
        deleted_count = result.rowcount
        if deleted_count > 0:
            logger.info(f"Deleted {deleted_count} chat history records for user: {user_id}")
        return deleted_count > 0
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting user chat history: {e}")
        raise


# Utility functions
async def get_user_with_chat_histories(db: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get a user with their chat histories"""
    try:
        result = await db.execute(
            select(User)
            .filter(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        return user
    except Exception as e:
        logger.error(f"Error getting user with chat histories: {e}")
        raise


async def get_user_with_documents(db: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get a user with their documents"""
    try:
        result = await db.execute(
            select(User)
            .filter(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        return user
    except Exception as e:
        logger.error(f"Error getting user with documents: {e}")
        raise