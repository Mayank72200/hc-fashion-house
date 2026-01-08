"""
Auth Router - Supabase Postgres Version
API endpoints for user profile and admin management
Uses Supabase Postgres for user data (NOT SQLite)
"""
from typing import List
from fastapi import APIRouter, Depends, Query, status

from models.auth_models import (
    # Request models
    UserProfileUpdate, UserPreferencesUpdate,
    AssignRoleRequest,
    # Response models
    UserProfileResponse, UserPreferencesResponse,
    RoleResponse, AuditLogResponse, AuditLogListResponse,
    CurrentUser, UserStatus
)
from services.auth_service import (
    UserService, AuditService, RoleService
)
from utils.auth_dependencies import (
    get_current_active_user,
    require_admin
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ========================
# User Profile (GET /auth/me)
# This is the main endpoint required by the checklist
# ========================

@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get Current User Profile",
    description="""
    Get profile of the currently authenticated user.
    
    **This endpoint:**
    - Verifies JWT token
    - Returns user profile from Supabase Postgres
    - Returns user roles
    
    **Requires:** Valid JWT token in Authorization header
    """
)
async def get_my_profile(
    current_user: CurrentUser = Depends(get_current_active_user)
):
    """Get current user profile"""
    user = UserService.get_user_profile(current_user.user_id)
    roles = UserService.get_user_roles(current_user.user_id)

    return UserProfileResponse(
        id=user.get("id"),
        full_name=user.get("full_name"),
        phone=user.get("phone"),
        email=user.get("email"),
        dob=user.get("dob"),
        status=UserStatus(user.get("status", "ACTIVE")),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
        roles=roles
    )


@router.put(
    "/me",
    response_model=UserProfileResponse,
    summary="Update Current User Profile",
    description="Update profile of the currently authenticated user"
)
async def update_my_profile(
    update_data: UserProfileUpdate,
    current_user: CurrentUser = Depends(get_current_active_user)
):
    """Update current user profile"""
    user = UserService.update_user_profile(current_user.user_id, update_data)
    roles = UserService.get_user_roles(current_user.user_id)

    return UserProfileResponse(
        id=user.get("id"),
        full_name=user.get("full_name"),
        phone=user.get("phone"),
        email=user.get("email"),
        dob=user.get("dob"),
        status=UserStatus(user.get("status", "ACTIVE")),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
        roles=roles
    )


# ========================
# User Preferences
# ========================

@router.get(
    "/me/preferences",
    response_model=UserPreferencesResponse,
    summary="Get User Preferences",
    description="Get preferences of the currently authenticated user"
)
async def get_my_preferences(
    current_user: CurrentUser = Depends(get_current_active_user)
):
    """Get current user preferences"""
    prefs = UserService.get_user_preferences(current_user.user_id)
    return UserPreferencesResponse(
        user_id=prefs.get("user_id"),
        preferred_language=prefs.get("preferred_language", "en"),
        preferred_size=prefs.get("preferred_size"),
        preferred_color=prefs.get("preferred_color"),
        communication_channel=prefs.get("communication_channel", "EMAIL")
    )


@router.put(
    "/me/preferences",
    response_model=UserPreferencesResponse,
    summary="Update User Preferences",
    description="Update preferences of the currently authenticated user"
)
async def update_my_preferences(
    update_data: UserPreferencesUpdate,
    current_user: CurrentUser = Depends(get_current_active_user)
):
    """Update current user preferences"""
    prefs = UserService.update_user_preferences(current_user.user_id, update_data)
    return UserPreferencesResponse(
        user_id=prefs.get("user_id"),
        preferred_language=prefs.get("preferred_language", "en"),
        preferred_size=prefs.get("preferred_size"),
        preferred_color=prefs.get("preferred_color"),
        communication_channel=prefs.get("communication_channel", "EMAIL")
    )


# ========================
# Admin - User Management
# ========================

@router.get(
    "/users/{user_id}",
    response_model=UserProfileResponse,
    summary="Get User Profile (Admin)",
    description="Get any user's profile - Admin only"
)
async def get_user_profile(
    user_id: str,
    admin: CurrentUser = Depends(require_admin)
):
    """Get user profile by ID (Admin only)"""
    user = UserService.get_user_profile(user_id)
    roles = UserService.get_user_roles(user_id)

    return UserProfileResponse(
        id=user.get("id"),
        full_name=user.get("full_name"),
        phone=user.get("phone"),
        email=user.get("email"),
        dob=user.get("dob"),
        status=UserStatus(user.get("status", "ACTIVE")),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
        roles=roles
    )


@router.post(
    "/users/{user_id}/block",
    response_model=UserProfileResponse,
    summary="Block User (Admin)",
    description="Block a user account - Admin only"
)
async def block_user(
    user_id: str,
    admin: CurrentUser = Depends(require_admin)
):
    """Block user account (Admin only)"""
    user = UserService.block_user(user_id)
    roles = UserService.get_user_roles(user_id)

    return UserProfileResponse(
        id=user.get("id"),
        full_name=user.get("full_name"),
        phone=user.get("phone"),
        email=user.get("email"),
        dob=user.get("dob"),
        status=UserStatus(user.get("status", "BLOCKED")),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
        roles=roles
    )


@router.post(
    "/users/{user_id}/unblock",
    response_model=UserProfileResponse,
    summary="Unblock User (Admin)",
    description="Unblock a user account - Admin only"
)
async def unblock_user(
    user_id: str,
    admin: CurrentUser = Depends(require_admin)
):
    """Unblock user account (Admin only)"""
    user = UserService.unblock_user(user_id)
    roles = UserService.get_user_roles(user_id)

    return UserProfileResponse(
        id=user.get("id"),
        full_name=user.get("full_name"),
        phone=user.get("phone"),
        email=user.get("email"),
        dob=user.get("dob"),
        status=UserStatus(user.get("status", "ACTIVE")),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
        roles=roles
    )


# ========================
# Admin - Role Management
# ========================

@router.get(
    "/roles",
    response_model=List[RoleResponse],
    summary="List Roles (Admin)",
    description="List all available roles - Admin only"
)
async def list_roles(
    admin: CurrentUser = Depends(require_admin)
):
    """List all roles (Admin only)"""
    roles = RoleService.get_all_roles()
    return [RoleResponse(role_id=r.get("role_id"), role_name=r.get("role_name")) for r in roles]


@router.post(
    "/users/{user_id}/roles",
    status_code=status.HTTP_201_CREATED,
    summary="Assign Role (Admin)",
    description="Assign a role to a user - Admin only"
)
async def assign_role(
    user_id: str,
    request: AssignRoleRequest,
    admin: CurrentUser = Depends(require_admin)
):
    """Assign role to user (Admin only)"""
    success = UserService.assign_role(user_id, request.role_name.value)
    return {"success": success, "message": f"Role {request.role_name.value} assigned" if success else "Role already assigned"}


@router.delete(
    "/users/{user_id}/roles/{role_name}",
    status_code=status.HTTP_200_OK,
    summary="Remove Role (Admin)",
    description="Remove a role from a user - Admin only"
)
async def remove_role(
    user_id: str,
    role_name: str,
    admin: CurrentUser = Depends(require_admin)
):
    """Remove role from user (Admin only)"""
    success = UserService.remove_role(user_id, role_name)
    return {"success": success, "message": f"Role {role_name} removed" if success else "User doesn't have this role"}


# ========================
# Admin - Audit Logs
# ========================

@router.get(
    "/users/{user_id}/audit-logs",
    response_model=AuditLogListResponse,
    summary="Get User Audit Logs (Admin)",
    description="Get audit logs for a user - Admin only"
)
async def get_user_audit_logs(
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: CurrentUser = Depends(require_admin)
):
    """Get user audit logs (Admin only)"""
    skip = (page - 1) * per_page
    logs, total = AuditService.get_user_audit_logs(user_id, skip, per_page)

    return AuditLogListResponse(
        items=[AuditLogResponse(
            audit_id=log.get("audit_id"),
            user_id=log.get("user_id"),
            action=log.get("action"),
            ip_address=log.get("ip_address"),
            user_agent=log.get("user_agent"),
            details=log.get("details"),
            created_at=log.get("created_at")
        ) for log in logs],
        total=total,
        page=page,
        per_page=per_page
    )


@router.get(
    "/me/audit-logs",
    response_model=AuditLogListResponse,
    summary="Get My Audit Logs",
    description="Get audit logs for the current user"
)
async def get_my_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_active_user)
):
    """Get current user's audit logs"""
    skip = (page - 1) * per_page
    logs, total = AuditService.get_user_audit_logs(current_user.user_id, skip, per_page)

    return AuditLogListResponse(
        items=[AuditLogResponse(
            audit_id=log.get("audit_id"),
            user_id=log.get("user_id"),
            action=log.get("action"),
            ip_address=log.get("ip_address"),
            user_agent=log.get("user_agent"),
            details=log.get("details"),
            created_at=log.get("created_at")
        ) for log in logs],
        total=total,
        page=page,
        per_page=per_page
    )

