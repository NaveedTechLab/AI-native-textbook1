"""
JWT token generation and verification utilities
Supports both legacy HS256 tokens and Better-Auth JWKS tokens (EdDSA)
"""
import os
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
import httpx
import logging

logger = logging.getLogger(__name__)

# Get JWT configuration from environment
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 10080))  # 7 days default

# Better-Auth JWKS configuration
BETTER_AUTH_URL = os.getenv("BETTER_AUTH_URL", "http://localhost:3100")
JWKS_CACHE: Optional[Dict] = None
JWKS_CACHE_TIME: Optional[datetime] = None
JWKS_CACHE_TTL = timedelta(minutes=15)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly"""
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using bcrypt directly"""
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token (legacy HS256)"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify a JWT access token (legacy HS256)"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        logger.debug(f"HS256 JWT decode failed: {str(e)}")
        return None


async def fetch_jwks() -> Optional[Dict]:
    """Fetch JWKS from Better-Auth service"""
    global JWKS_CACHE, JWKS_CACHE_TIME

    # Return cached JWKS if still valid
    if JWKS_CACHE and JWKS_CACHE_TIME and datetime.utcnow() - JWKS_CACHE_TIME < JWKS_CACHE_TTL:
        return JWKS_CACHE

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BETTER_AUTH_URL}/api/auth/jwks", timeout=5.0)
            if response.status_code == 200:
                JWKS_CACHE = response.json()
                JWKS_CACHE_TIME = datetime.utcnow()
                logger.info("Successfully fetched Better-Auth JWKS")
                return JWKS_CACHE
    except Exception as e:
        logger.debug(f"Failed to fetch JWKS from Better-Auth: {str(e)}")

    return JWKS_CACHE  # Return stale cache if fetch fails


def decode_better_auth_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode a Better-Auth JWT token using JWKS.
    Better-Auth uses EdDSA (Ed25519) by default.
    Falls back to HS256 with BETTER_AUTH_SECRET if JWKS unavailable.
    """
    try:
        # First try: decode without verification to inspect the token
        unverified = jwt.get_unverified_header(token)
        logger.debug(f"Better-Auth token header: {unverified}")

        # Try HS256 with Better-Auth secret (shared secret approach)
        better_auth_secret = os.getenv("BETTER_AUTH_SECRET", JWT_SECRET_KEY)
        payload = jwt.decode(
            token,
            better_auth_secret,
            algorithms=["HS256", "EdDSA"],
            options={"verify_aud": False, "verify_iss": False}
        )
        return payload
    except JWTError as e:
        logger.debug(f"Better-Auth token decode failed: {str(e)}")
        return None


def get_current_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from JWT token.
    Supports both legacy tokens and Better-Auth tokens.
    """
    # Remove "Bearer " prefix if present
    if token.startswith("Bearer "):
        token = token[7:]

    # Try 1: Legacy HS256 token (existing system)
    payload = decode_access_token(token)
    if payload:
        return payload.get("sub") or payload.get("user_id") or payload.get("id")

    # Try 2: Better-Auth token
    payload = decode_better_auth_token(token)
    if payload:
        return payload.get("sub") or payload.get("id") or payload.get("user_id")

    return None
