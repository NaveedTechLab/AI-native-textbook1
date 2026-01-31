"""
Authentication schemas for request/response validation
Supports email/password and OAuth (Google/Facebook) authentication
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime
import uuid


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    software_background: Optional[str] = None
    hardware_background: Optional[str] = None
    experience_level: Optional[str] = "Intermediate"

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    software_background: Optional[str] = None
    hardware_background: Optional[str] = None
    experience_level: Optional[str] = None

    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    """User profile response"""
    id: uuid.UUID
    email: EmailStr
    full_name: Optional[str] = None
    software_background: Optional[str] = None
    hardware_background: Optional[str] = None
    experience_level: Optional[str] = None
    oauth_provider: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserInDB(UserBase):
    id: uuid.UUID
    is_active: bool
    software_background: Optional[str] = None
    hardware_background: Optional[str] = None
    experience_level: Optional[str] = None
    oauth_provider: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = 3600
    email: Optional[str] = None  # Include email in response


class TokenData(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None


# OAuth Schemas
class OAuthRequest(BaseModel):
    """OAuth login/signup request"""
    provider: Literal["google", "facebook"]
    access_token: str  # Token from OAuth provider


class OAuthUserInfo(BaseModel):
    """User info from OAuth provider"""
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None
    provider_id: str
    provider: str


class GoogleTokenInfo(BaseModel):
    """Google token info response"""
    email: EmailStr
    email_verified: Optional[bool] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    sub: str  # Google user ID


class FacebookUserInfo(BaseModel):
    """Facebook user info response"""
    id: str
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[dict] = None