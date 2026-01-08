"""
Auth Dependencies
FastAPI dependencies for JWT validation and role-based access control
Uses Supabase Postgres for user data (NOT SQLite)
"""
from typing import List, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models.auth_models import CurrentUser, RoleName
from services.auth_service import AuthService


# Security scheme for Swagger UI
security = HTTPBearer(auto_error=False)


async def get_token_from_header(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> str:
    """Extract JWT token from Authorization header"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return credentials.credentials


async def get_current_user(
    token: str = Depends(get_token_from_header)
) -> CurrentUser:
    """
    Get current authenticated user from JWT token.
    User data is fetched from Supabase Postgres.
    Use this dependency for any endpoint that requires authentication.
    """
    return AuthService.get_current_user_from_token(token)


async def get_current_active_user(
    current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """
    Get current user and verify they are active.
    Raises 403 if user is blocked or deleted.
    """
    if current_user.status.value != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {current_user.status.value}"
        )
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[CurrentUser]:
    """
    Get current user if authenticated, None otherwise.
    Use for endpoints that work for both authenticated and anonymous users.
    """
    if not credentials:
        return None

    try:
        return AuthService.get_current_user_from_token(credentials.credentials)
    except HTTPException:
        return None


def require_role(required_role: str):
    """
    Dependency factory for role-based access control.

    Usage:
        @router.get("/admin/users")
        async def get_users(user: CurrentUser = Depends(require_role("ADMIN"))):
            ...
    """
    async def role_checker(
        current_user: CurrentUser = Depends(get_current_active_user)
    ) -> CurrentUser:
        if not current_user.has_role(required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )
        return current_user

    return role_checker


def require_any_role(required_roles: List[str]):
    """
    Dependency factory for requiring any of the specified roles.

    Usage:
        @router.get("/delivery/orders")
        async def get_orders(user: CurrentUser = Depends(require_any_role(["ADMIN", "DELIVERY"]))):
            ...
    """
    async def role_checker(
        current_user: CurrentUser = Depends(get_current_active_user)
    ) -> CurrentUser:
        for role in required_roles:
            if current_user.has_role(role):
                return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"One of these roles required: {', '.join(required_roles)}"
        )

    return role_checker


def require_all_roles(required_roles: List[str]):
    """
    Dependency factory for requiring all of the specified roles.

    Usage:
        @router.get("/super-admin/settings")
        async def get_settings(user: CurrentUser = Depends(require_all_roles(["ADMIN", "SUPER_ADMIN"]))):
            ...
    """
    async def role_checker(
        current_user: CurrentUser = Depends(get_current_active_user)
    ) -> CurrentUser:
        missing_roles = [role for role in required_roles if not current_user.has_role(role)]

        if missing_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required roles: {', '.join(missing_roles)}"
            )
        return current_user

    return role_checker


# Convenience dependencies for common roles
async def require_admin(
    current_user: CurrentUser = Depends(get_current_active_user)
) -> CurrentUser:
    """Require ADMIN role"""
    if not current_user.has_role("ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def require_customer(
    current_user: CurrentUser = Depends(get_current_active_user)
) -> CurrentUser:
    """Require CUSTOMER role"""
    if not current_user.has_role("CUSTOMER"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required"
        )
    return current_user


async def require_delivery(
    current_user: CurrentUser = Depends(get_current_active_user)
) -> CurrentUser:
    """Require DELIVERY role"""
    if not current_user.has_role("DELIVERY"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Delivery access required"
        )
    return current_user


def get_client_info(request: Request) -> dict:
    """Extract client info from request for audit logging"""
    return {
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent")
    }

