from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import hashlib
import logging
import os

# Import dependencies
try:
    from services.translation_service import TranslationService
    from services.rate_limiter import RateLimiter
    from database.db import get_db
    from database.models import Translation
    from auth.jwt_utils import get_current_user_id_from_token
    DB_ENABLED = True
except ImportError as e:
    DB_ENABLED = False
    logging.warning(f"Database or dependencies not available: {str(e)}")

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
translation_service = TranslationService()
rate_limiter = RateLimiter(limit=10, window_seconds=3600)  # 10 translations/hour

class UrduTranslationRequest(BaseModel):
    chapter_id: str
    content: str
    content_hash: str

class UrduTranslationResponse(BaseModel):
    translated_content: str
    cached: bool
    translation_id: Optional[str] = None

class TranslationRequest(BaseModel):
    """Legacy endpoint - kept for backward compatibility"""
    text: str
    source_lang: str = "en"
    target_lang: str = "ur"

class TranslationResponse(BaseModel):
    """Legacy endpoint response"""
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str

@router.post("/translate/urdu", response_model=UrduTranslationResponse)
async def translate_to_urdu(
    request: UrduTranslationRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db) if DB_ENABLED else None
):
    """
    Translate chapter content to Urdu with JWT authentication, caching, and rate limiting

    **Requirements**:
    - JWT token in Authorization header
    - Content hash must match SHA-256 of content
    - Rate limit: 10 translations per user per hour

    **Returns**:
    - translated_content: Urdu translation
    - cached: Whether result came from cache
    - translation_id: UUID of translation record
    """
    try:
        # 1. Verify JWT authentication
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

        token = authorization.replace("Bearer ", "")
        user_id = get_current_user_id_from_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        logger.info(f"Translation request from user {user_id} for chapter {request.chapter_id}")

        # 2. Validate content hash
        computed_hash = hashlib.sha256(request.content.encode('utf-8')).hexdigest()
        if computed_hash != request.content_hash:
            logger.warning(f"Content hash mismatch: expected {computed_hash}, got {request.content_hash}")
            raise HTTPException(
                status_code=400,
                detail=f"Content hash mismatch. Expected: {computed_hash}, Got: {request.content_hash}"
            )

        # 3. Check rate limit
        if not rate_limiter.check_rate_limit(user_id):
            retry_after = rate_limiter.get_retry_after(user_id)
            logger.warning(f"Rate limit exceeded for user {user_id}")
            raise HTTPException(
                status_code=429,
                detail=f"Translation rate limit exceeded. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )

        # 4. Check database cache (if enabled)
        if DB_ENABLED and db:
            from database.models import Translation as DBTranslation

            cached_translation = db.query(DBTranslation).filter(
                DBTranslation.chapter_id == request.chapter_id,
                DBTranslation.content_hash == request.content_hash,
                DBTranslation.target_language == "urdu"
            ).first()

            if cached_translation:
                logger.info(f"Cache HIT for chapter {request.chapter_id}")
                return UrduTranslationResponse(
                    translated_content=cached_translation.translated_content,
                    cached=True,
                    translation_id=str(cached_translation.id)
                )

        # 5. Cache MISS - Translate using OpenRouter
        logger.info(f"Cache MISS for chapter {request.chapter_id} - calling OpenRouter API")

        try:
            translated_text = translation_service.translate_to_urdu(request.content)
        except Exception as api_error:
            logger.error(f"OpenRouter API error: {str(api_error)}")
            # Retry once with exponential backoff
            import time
            time.sleep(2)
            try:
                translated_text = translation_service.translate_to_urdu(request.content)
            except Exception as retry_error:
                logger.error(f"Retry failed: {str(retry_error)}")
                raise HTTPException(
                    status_code=503,
                    detail="Translation service temporarily unavailable. Please try again."
                )

        # 6. Save to database (if enabled)
        translation_id = None
        if DB_ENABLED and db:
            try:
                from database.models import Translation as DBTranslation
                import uuid

                db_translation = DBTranslation(
                    id=uuid.uuid4(),
                    chapter_id=request.chapter_id,
                    content_hash=request.content_hash,
                    source_language="english",
                    target_language="urdu",
                    original_content=request.content,
                    translated_content=translated_text,
                    user_id=uuid.UUID(user_id)
                )

                db.add(db_translation)
                db.commit()
                db.refresh(db_translation)

                translation_id = str(db_translation.id)
                logger.info(f"Saved translation to database: {translation_id}")

            except IntegrityError as e:
                logger.warning(f"Duplicate translation detected (race condition): {str(e)}")
                db.rollback()
                # Query again to get existing translation
                cached_translation = db.query(DBTranslation).filter(
                    DBTranslation.chapter_id == request.chapter_id,
                    DBTranslation.content_hash == request.content_hash,
                    DBTranslation.target_language == "urdu"
                ).first()
                if cached_translation:
                    translation_id = str(cached_translation.id)

        return UrduTranslationResponse(
            translated_content=translated_text,
            cached=False,
            translation_id=translation_id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in translate_to_urdu: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Legacy endpoints - kept for backward compatibility
@router.post("/translation/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """
    Legacy translation endpoint - translate text between languages
    (Kept for backward compatibility with existing frontend)
    """
    try:
        if request.source_lang == "en" and request.target_lang == "ur":
            translated_text = translation_service.translate_to_urdu(request.text)
        elif request.source_lang == "ur" and request.target_lang == "en":
            translated_text = translation_service.translate_to_english(request.text)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported language pair: {request.source_lang} to {request.target_lang}"
            )

        return TranslationResponse(
            original_text=request.text,
            translated_text=translated_text,
            source_lang=request.source_lang,
            target_lang=request.target_lang
        )

    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during translation: {str(e)}")


@router.get("/translation/health")
async def translation_health():
    """Health check for translation service"""
    return {
        "status": "translation service is running",
        "database_enabled": DB_ENABLED,
        "rate_limiter_enabled": True
    }


@router.get("/translate/stats")
async def translation_stats(
    authorization: Optional[str] = Header(None)
):
    """Get translation statistics for current user"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing authorization header")

        token = authorization.replace("Bearer ", "")
        user_id = get_current_user_id_from_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        remaining = rate_limiter.get_remaining(user_id)
        retry_after = rate_limiter.get_retry_after(user_id) if remaining == 0 else 0

        return {
            "translations_remaining": remaining,
            "translations_limit": rate_limiter.limit,
            "window_seconds": rate_limiter.window_seconds,
            "retry_after_seconds": retry_after
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
