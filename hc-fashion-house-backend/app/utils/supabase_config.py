"""
Supabase Configuration
Client setup and helper functions for Supabase Auth
Uses centralized settings from configs/settings.py
"""
from typing import Optional, Dict, Any
from functools import lru_cache

from configs.settings import get_settings


@lru_cache()
def get_supabase_settings():
    """Get Supabase-related settings from centralized config"""
    return get_settings()


# Lazy initialization of Supabase client
_supabase_client = None
_supabase_admin_client = None


def get_supabase_client():
    """
    Get Supabase client (anon key - for client-side operations).
    Uses lazy initialization.
    """
    global _supabase_client

    if _supabase_client is None:
        try:
            from supabase import create_client, Client
            settings = get_supabase_settings()
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        except ImportError:
            raise ImportError("supabase package not installed. Run: pip install supabase")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Supabase client: {e}")

    return _supabase_client


def get_supabase_admin_client():
    """
    Get Supabase admin client (service role key - for server-side operations).
    USE WITH CAUTION - bypasses RLS.
    """
    global _supabase_admin_client

    if _supabase_admin_client is None:
        try:
            from supabase import create_client, Client
            settings = get_supabase_settings()
            _supabase_admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        except ImportError:
            raise ImportError("supabase package not installed. Run: pip install supabase")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Supabase admin client: {e}")

    return _supabase_admin_client


def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Supabase JWT token and extract user info.

    Args:
        token: JWT access token from Supabase

    Returns:
        Dictionary with user info if valid, None otherwise
    """
    try:
        # Use the Supabase client to verify
        client = get_supabase_client()
        user = client.auth.get_user(token)

        if user and user.user:
            return {
                "user_id": str(user.user.id),
                "email": user.user.email,
                "phone": user.user.phone,
                "role": user.user.role,
                "aud": user.user.aud,
                "created_at": str(user.user.created_at) if user.user.created_at else None
            }
        return None

    except Exception as e:
        print(f"JWT verification failed: {e}")
        return None


def decode_jwt_payload(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode JWT payload without verification (for debugging).
    DO NOT use this for authentication - use verify_jwt_token instead.
    """
    try:
        from jose import jwt
        # Decode without verification - ONLY for debugging
        payload = jwt.get_unverified_claims(token)
        return payload
    except Exception:
        return None

