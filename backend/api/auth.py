from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
import logging
import httpx

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer(auto_error=False)

# Import database utilities
try:
    from database.db import get_db
    from database.models import User as DBUser
    from auth.jwt_utils import hash_password, verify_password, create_access_token, get_current_user_id_from_token
    from sqlalchemy.orm import Session
    from sqlalchemy.exc import IntegrityError
    DB_ENABLED = True
except ImportError:
    DB_ENABLED = False
    get_db = None
    logging.warning("Database modules not available. Auth will use mock mode.")


# Request/Response Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    software_background: Optional[str] = None
    hardware_background: Optional[str] = None
    experience_level: Optional[str] = "Intermediate"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OAuthRequest(BaseModel):
    """OAuth login/signup request"""
    provider: Literal["google", "facebook"]
    access_token: str


class AuthResponse(BaseModel):
    user_id: str
    email: str
    access_token: str
    token_type: str = "bearer"


class UserProfileResponse(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str] = None
    software_background: Optional[str] = None
    hardware_background: Optional[str] = None
    experience_level: Optional[str] = None
    oauth_provider: Optional[str] = None
    profile_picture: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    software_background: Optional[str] = None
    hardware_background: Optional[str] = None
    experience_level: Optional[str] = None


def get_db_session():
    """Get database session or None if DB not enabled"""
    if DB_ENABLED and get_db:
        return Depends(get_db)
    return None


# OAuth Helper Functions
async def verify_google_token(access_token: str) -> dict:
    """Verify Google OAuth token and get user info"""
    try:
        async with httpx.AsyncClient() as client:
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


@router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """Handle user registration with background information"""
    try:
        if not DB_ENABLED:
            # Mock mode for testing without database
            return AuthResponse(
                user_id="mock_user_id",
                email=request.email,
                access_token="mock_access_token",
                token_type="bearer"
            )

        # Get database session
        from database.db import SessionLocal
        db = SessionLocal()

        try:
            # Validate password strength
            if len(request.password) < 8:
                raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")

            # Validate background fields
            if request.software_background and len(request.software_background) < 10:
                raise HTTPException(status_code=400, detail="Software background must be at least 10 characters")
            if request.hardware_background and len(request.hardware_background) < 10:
                raise HTTPException(status_code=400, detail="Hardware background must be at least 10 characters")

            # Hash the password
            hashed_password = hash_password(request.password)

            # Create new user in database
            db_user = DBUser(
                email=request.email,
                password_hash=hashed_password,
                software_background=request.software_background,
                hardware_background=request.hardware_background,
                experience_level=request.experience_level or "Intermediate"
            )

            db.add(db_user)
            db.commit()
            db.refresh(db_user)

            # Generate JWT token
            access_token = create_access_token(data={
                "sub": str(db_user.id),
                "email": db_user.email
            })

            return AuthResponse(
                user_id=str(db_user.id),
                email=db_user.email,
                access_token=access_token,
                token_type="bearer"
            )

        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Email already registered")
        finally:
            db.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during signup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during signup: {str(e)}")


@router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Handle user login"""
    try:
        if not DB_ENABLED:
            # Mock mode for testing without database
            return AuthResponse(
                user_id="mock_user_id",
                email=request.email,
                access_token="mock_access_token",
                token_type="bearer"
            )

        # Get database session
        from database.db import SessionLocal
        db = SessionLocal()

        try:
            # Find user by email
            user = db.query(DBUser).filter(DBUser.email == request.email).first()
            if not user:
                raise HTTPException(status_code=401, detail="Invalid credentials")

            # Check if user is OAuth-only
            if user.oauth_provider and not user.password_hash:
                raise HTTPException(
                    status_code=401,
                    detail=f"This account uses {user.oauth_provider} login. Please use the {user.oauth_provider} button to sign in."
                )

            # Verify password
            if not verify_password(request.password, user.password_hash):
                raise HTTPException(status_code=401, detail="Invalid credentials")

            # Generate JWT token
            access_token = create_access_token(data={
                "sub": str(user.id),
                "email": user.email
            })

            return AuthResponse(
                user_id=str(user.id),
                email=user.email,
                access_token=access_token,
                token_type="bearer"
            )

        finally:
            db.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="Error during login")


@router.post("/auth/oauth", response_model=AuthResponse)
async def oauth_login(request: OAuthRequest):
    """Handle OAuth login/signup (Google or Facebook)"""
    try:
        if not DB_ENABLED:
            # Mock mode for testing
            return AuthResponse(
                user_id="mock_oauth_user_id",
                email="oauth@example.com",
                access_token="mock_oauth_access_token",
                token_type="bearer"
            )

        # Verify OAuth token
        user_info = None
        if request.provider == "google":
            user_info = await verify_google_token(request.access_token)
        elif request.provider == "facebook":
            user_info = await verify_facebook_token(request.access_token)
        else:
            raise HTTPException(status_code=400, detail="Unsupported OAuth provider")

        if not user_info or not user_info.get("email"):
            raise HTTPException(status_code=401, detail="Could not verify OAuth token or get user email")

        # Get database session
        from database.db import SessionLocal
        db = SessionLocal()

        try:
            # Check if user exists by OAuth ID
            existing_user = db.query(DBUser).filter(
                DBUser.oauth_provider == request.provider,
                DBUser.oauth_id == user_info["provider_id"]
            ).first()

            if existing_user:
                # User exists, log them in
                access_token = create_access_token(data={
                    "sub": str(existing_user.id),
                    "email": existing_user.email
                })
                logger.info(f"OAuth user logged in: {existing_user.email}")
                return AuthResponse(
                    user_id=str(existing_user.id),
                    email=existing_user.email,
                    access_token=access_token,
                    token_type="bearer"
                )

            # Check if user exists by email
            existing_email_user = db.query(DBUser).filter(DBUser.email == user_info["email"]).first()

            if existing_email_user:
                # Link OAuth to existing account
                existing_email_user.oauth_provider = request.provider
                existing_email_user.oauth_id = user_info["provider_id"]
                if user_info.get("picture"):
                    existing_email_user.profile_picture = user_info["picture"]
                if user_info.get("name") and not existing_email_user.full_name:
                    existing_email_user.full_name = user_info["name"]
                db.commit()

                access_token = create_access_token(data={
                    "sub": str(existing_email_user.id),
                    "email": existing_email_user.email
                })
                logger.info(f"Linked OAuth to existing user: {existing_email_user.email}")
                return AuthResponse(
                    user_id=str(existing_email_user.id),
                    email=existing_email_user.email,
                    access_token=access_token,
                    token_type="bearer"
                )

            # Create new OAuth user
            new_user = DBUser(
                email=user_info["email"],
                password_hash=None,  # OAuth users don't have passwords
                full_name=user_info.get("name"),
                oauth_provider=request.provider,
                oauth_id=user_info["provider_id"],
                profile_picture=user_info.get("picture")
            )

            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            access_token = create_access_token(data={
                "sub": str(new_user.id),
                "email": new_user.email
            })
            logger.info(f"New OAuth user registered: {new_user.email}")

            return AuthResponse(
                user_id=str(new_user.id),
                email=new_user.email,
                access_token=access_token,
                token_type="bearer"
            )

        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Error creating user account")
        finally:
            db.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during OAuth login: {str(e)}")
        raise HTTPException(status_code=500, detail="Error during OAuth authentication")


@router.get("/auth/profile", response_model=UserProfileResponse)
async def get_profile(
    authorization: Optional[str] = Header(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Get user profile information"""
    try:
        if not DB_ENABLED:
            # Mock mode for testing without database
            return UserProfileResponse(
                user_id="mock_user_id",
                email="mock@example.com",
                full_name="Mock User",
                software_background="Python, JavaScript",
                hardware_background="Arduino, Raspberry Pi",
                experience_level="Intermediate",
                oauth_provider=None,
                profile_picture=None
            )

        # Get token from Authorization header or credentials
        token = None
        if credentials:
            token = credentials.credentials
        elif authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")

        if not token:
            raise HTTPException(status_code=401, detail="Authorization token required")

        # Decode token and get user ID
        user_id = get_current_user_id_from_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        # Get database session
        from database.db import SessionLocal
        db = SessionLocal()

        try:
            # Get user from database
            user = db.query(DBUser).filter(DBUser.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            return UserProfileResponse(
                user_id=str(user.id),
                email=user.email,
                full_name=getattr(user, 'full_name', None),
                software_background=user.software_background,
                hardware_background=user.hardware_background,
                experience_level=user.experience_level,
                oauth_provider=getattr(user, 'oauth_provider', None),
                profile_picture=getattr(user, 'profile_picture', None)
            )
        finally:
            db.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving profile")


@router.put("/auth/profile", response_model=UserProfileResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    authorization: Optional[str] = Header(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """Update user profile information"""
    try:
        if not DB_ENABLED:
            # Mock mode
            return UserProfileResponse(
                user_id="mock_user_id",
                email="mock@example.com",
                full_name=request.full_name,
                software_background=request.software_background,
                hardware_background=request.hardware_background,
                experience_level=request.experience_level,
                oauth_provider=None,
                profile_picture=None
            )

        # Get token
        token = None
        if credentials:
            token = credentials.credentials
        elif authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")

        if not token:
            raise HTTPException(status_code=401, detail="Authorization token required")

        # Decode token and get user ID
        user_id = get_current_user_id_from_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        # Get database session
        from database.db import SessionLocal
        db = SessionLocal()

        try:
            # Get user from database
            user = db.query(DBUser).filter(DBUser.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Update fields if provided
            if request.full_name is not None:
                user.full_name = request.full_name
            if request.software_background is not None:
                user.software_background = request.software_background
            if request.hardware_background is not None:
                user.hardware_background = request.hardware_background
            if request.experience_level is not None:
                user.experience_level = request.experience_level

            db.commit()
            db.refresh(user)

            logger.info(f"User profile updated: {user.email}")

            return UserProfileResponse(
                user_id=str(user.id),
                email=user.email,
                full_name=getattr(user, 'full_name', None),
                software_background=user.software_background,
                hardware_background=user.hardware_background,
                experience_level=user.experience_level,
                oauth_provider=getattr(user, 'oauth_provider', None),
                profile_picture=getattr(user, 'profile_picture', None)
            )
        finally:
            db.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating profile")


@router.get("/auth/health")
async def auth_health():
    """Health check for auth service"""
    return {
        "status": "auth service is running",
        "database_enabled": DB_ENABLED,
        "oauth_providers": ["google", "facebook"]
    }
