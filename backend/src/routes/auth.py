"""
Authentication API routes for the AI Backend with RAG + Authentication
Implements signup, login, OAuth (Google/Facebook), and user profile endpoints
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
import logging
from typing import Optional
from uuid import UUID
import re
import httpx

from ..auth.auth import AuthHandler
from ..auth.schemas import (
    UserCreate, UserLogin, Token, UserProfile, UserUpdate,
    OAuthRequest, GoogleTokenInfo, FacebookUserInfo
)
from ..config.settings import settings
from ..config.database import get_db_session
from ..db import crud
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["authentication"])

logger = logging.getLogger(__name__)

# Initialize auth handler
auth_handler = AuthHandler()


@router.post("/signup", response_model=Token)
async def signup(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Register a new user with email and password
    """
    try:
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )

        # Check if user already exists
        existing_user = await crud.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )

        # Create new user with hashed password and profile data
        hashed_password = auth_handler.get_password_hash(user_data.password)
        db_user = await crud.create_user(
            db,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            software_background=user_data.software_background,
            hardware_background=user_data.hardware_background,
            experience_level=user_data.experience_level or "Intermediate"
        )

        # Create access token
        access_token = auth_handler.create_access_token(str(db_user.id))

        logger.info(f"New user registered: {user_data.email}")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.jwt_expires_in,
            "email": db_user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during user registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        )


@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Authenticate user and return access token
    """
    try:
        # Find user by email
        user = await crud.get_user_by_email(db, user_credentials.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if user is OAuth-only (no password)
        if user.oauth_provider and not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"This account uses {user.oauth_provider} login. Please use the {user.oauth_provider} button to sign in.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not auth_handler.verify_password(user_credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token
        access_token = auth_handler.create_access_token(str(user.id))

        logger.info(f"User logged in: {user_credentials.email}")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.jwt_expires_in,
            "email": user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during user login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )


@router.post("/oauth", response_model=Token)
async def oauth_login(
    oauth_data: OAuthRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Authenticate or register user via OAuth (Google or Facebook)
    """
    try:
        user_info = None

        if oauth_data.provider == "google":
            user_info = await verify_google_token(oauth_data.access_token)
        elif oauth_data.provider == "facebook":
            user_info = await verify_facebook_token(oauth_data.access_token)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported OAuth provider"
            )

        if not user_info or not user_info.get("email"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not verify OAuth token or get user email"
            )

        # Check if user exists by OAuth ID
        existing_user = await crud.get_user_by_oauth(
            db, oauth_data.provider, user_info["provider_id"]
        )

        if existing_user:
            # User exists, log them in
            access_token = auth_handler.create_access_token(str(existing_user.id))
            logger.info(f"OAuth user logged in: {existing_user.email}")
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": settings.jwt_expires_in,
                "email": existing_user.email
            }

        # Check if user exists by email (might have signed up with password)
        existing_email_user = await crud.get_user_by_email(db, user_info["email"])

        if existing_email_user:
            # Link OAuth to existing account
            await crud.update_user(
                db,
                existing_email_user.id,
                oauth_provider=oauth_data.provider,
                oauth_id=user_info["provider_id"],
                profile_picture=user_info.get("picture")
            )
            access_token = auth_handler.create_access_token(str(existing_email_user.id))
            logger.info(f"Linked OAuth to existing user: {existing_email_user.email}")
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": settings.jwt_expires_in,
                "email": existing_email_user.email
            }

        # Create new OAuth user
        new_user = await crud.create_user(
            db,
            email=user_info["email"],
            hashed_password=None,  # OAuth users don't have passwords
            full_name=user_info.get("name"),
            oauth_provider=oauth_data.provider,
            oauth_id=user_info["provider_id"],
            profile_picture=user_info.get("picture")
        )

        access_token = auth_handler.create_access_token(str(new_user.id))
        logger.info(f"New OAuth user registered: {new_user.email}")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.jwt_expires_in,
            "email": new_user.email
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during OAuth login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during OAuth authentication"
        )


async def verify_google_token(access_token: str) -> dict:
    """Verify Google OAuth token and get user info"""
    try:
        async with httpx.AsyncClient() as client:
            # Get user info from Google
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code != 200:
                logger.error(f"Google token verification failed: {response.text}")
                return None

            data = response.json()
            return {
                "email": data.get("email"),
                "name": data.get("name"),
                "picture": data.get("picture"),
                "provider_id": data.get("sub"),
                "provider": "google"
            }
    except Exception as e:
        logger.error(f"Error verifying Google token: {e}")
        return None


async def verify_facebook_token(access_token: str) -> dict:
    """Verify Facebook OAuth token and get user info"""
    try:
        async with httpx.AsyncClient() as client:
            # Get user info from Facebook
            response = await client.get(
                "https://graph.facebook.com/me",
                params={
                    "fields": "id,name,email,picture.type(large)",
                    "access_token": access_token
                }
            )

            if response.status_code != 200:
                logger.error(f"Facebook token verification failed: {response.text}")
                return None

            data = response.json()
            picture_url = None
            if data.get("picture") and data["picture"].get("data"):
                picture_url = data["picture"]["data"].get("url")

            return {
                "email": data.get("email"),
                "name": data.get("name"),
                "picture": picture_url,
                "provider_id": data.get("id"),
                "provider": "facebook"
            }
    except Exception as e:
        logger.error(f"Error verifying Facebook token: {e}")
        return None


@router.get("/me", response_model=UserProfile)
async def get_current_user(
    current_user_id: str = Depends(auth_handler.get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get current user profile
    """
    try:
        user = await crud.get_user_by_id(db, UUID(current_user_id))

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return UserProfile(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            software_background=user.software_background,
            hardware_background=user.hardware_background,
            experience_level=user.experience_level,
            oauth_provider=user.oauth_provider,
            profile_picture=user.profile_picture,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving user profile"
        )


@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user_id: str = Depends(auth_handler.get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get current user profile (alias for /me)
    """
    return await get_current_user(current_user_id, db)


@router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile_data: UserUpdate,
    current_user_id: str = Depends(auth_handler.get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Update current user profile
    """
    try:
        # Build update dict with only provided fields
        update_data = {}
        if profile_data.full_name is not None:
            update_data["full_name"] = profile_data.full_name
        if profile_data.software_background is not None:
            update_data["software_background"] = profile_data.software_background
        if profile_data.hardware_background is not None:
            update_data["hardware_background"] = profile_data.hardware_background
        if profile_data.experience_level is not None:
            update_data["experience_level"] = profile_data.experience_level

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        updated_user = await crud.update_user(db, UUID(current_user_id), **update_data)

        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        logger.info(f"User profile updated: {updated_user.email}")

        return UserProfile(
            id=updated_user.id,
            email=updated_user.email,
            full_name=updated_user.full_name,
            software_background=updated_user.software_background,
            hardware_background=updated_user.hardware_background,
            experience_level=updated_user.experience_level,
            oauth_provider=updated_user.oauth_provider,
            profile_picture=updated_user.profile_picture,
            is_active=updated_user.is_active,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating user profile"
        )
