"""
Auth Service - Supabase Postgres Version
Handles user management via Supabase Postgres (NOT SQLite)
NO passwords stored - Supabase handles all auth
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status

from models.auth_models import (
    UserStatus, AuditAction, RoleName,
    UserProfileUpdate,
    UserPreferencesUpdate, CurrentUser
)
from utils.supabase_config import (
    get_supabase_client, get_supabase_admin_client, verify_jwt_token
)


class AuthService:
    """
    Service for authentication operations via Supabase.
    All user data is stored in Supabase Postgres, NOT SQLite.
    """

    @staticmethod
    def get_current_user_from_token(token: str) -> CurrentUser:
        """
        Validate JWT token and get current user context.
        Auto-creates user profile if first login (via Supabase trigger).
        """
        user_info = verify_jwt_token(token)

        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"}
            )

        user_id = user_info.get("user_id")

        # Get user profile from Supabase
        client = get_supabase_admin_client()

        # Fetch user profile
        result = client.table("user_profile").select("*").eq("id", user_id).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found. Please try logging in again."
            )

        user_profile = result.data[0]

        if user_profile.get("status") != UserStatus.ACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User account is {user_profile.get('status')}"
            )

        # Get user roles
        roles = UserService.get_user_roles(user_id)

        return CurrentUser(
            user_id=user_id,
            phone=user_profile.get("phone"),
            email=user_profile.get("email"),
            full_name=user_profile.get("full_name"),
            roles=roles,
            status=UserStatus(user_profile.get("status", "ACTIVE"))
        )


class UserService:
    """Service for user profile operations via Supabase Postgres"""

    @staticmethod
    def get_user_profile(user_id: str) -> Dict[str, Any]:
        """Get user profile by ID from Supabase"""
        client = get_supabase_admin_client()

        result = client.table("user_profile").select("*").eq("id", user_id).neq("status", "DELETED").execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return result.data[0]

    @staticmethod
    def update_user_profile(user_id: str, update_data: UserProfileUpdate) -> Dict[str, Any]:
        """Update user profile in Supabase"""
        client = get_supabase_admin_client()

        # Build update dict excluding None values
        update_dict = {k: v for k, v in update_data.model_dump(exclude_unset=True).items() if v is not None}

        if not update_dict:
            return UserService.get_user_profile(user_id)

        # Convert date to string if present
        if "dob" in update_dict and update_dict["dob"]:
            update_dict["dob"] = str(update_dict["dob"])

        update_dict["updated_at"] = datetime.utcnow().isoformat()

        result = client.table("user_profile").update(update_dict).eq("id", user_id).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return result.data[0]

    @staticmethod
    def get_user_preferences(user_id: str) -> Dict[str, Any]:
        """Get user preferences from Supabase"""
        client = get_supabase_admin_client()

        result = client.table("user_preferences").select("*").eq("user_id", user_id).execute()

        if not result.data or len(result.data) == 0:
            # Create default preferences
            new_prefs = {"user_id": user_id}
            insert_result = client.table("user_preferences").insert(new_prefs).execute()
            return insert_result.data[0] if insert_result.data else new_prefs

        return result.data[0]

    @staticmethod
    def update_user_preferences(user_id: str, update_data: UserPreferencesUpdate) -> Dict[str, Any]:
        """Update user preferences in Supabase"""
        client = get_supabase_admin_client()

        update_dict = {}
        for k, v in update_data.model_dump(exclude_unset=True).items():
            if v is not None:
                # Handle enum values
                update_dict[k] = v.value if hasattr(v, 'value') else v

        if not update_dict:
            return UserService.get_user_preferences(user_id)

        result = client.table("user_preferences").update(update_dict).eq("user_id", user_id).execute()

        if not result.data or len(result.data) == 0:
            # Try insert if update failed (record doesn't exist)
            update_dict["user_id"] = user_id
            result = client.table("user_preferences").insert(update_dict).execute()

        return result.data[0] if result.data else update_dict

    @staticmethod
    def get_user_roles(user_id: str) -> List[str]:
        """Get list of role names for a user from Supabase"""
        client = get_supabase_admin_client()

        # Join user_roles with roles to get role names
        result = client.table("user_roles").select("role_id, roles(role_name)").eq("user_id", user_id).execute()

        roles = []
        if result.data:
            for ur in result.data:
                if ur.get("roles") and ur["roles"].get("role_name"):
                    roles.append(ur["roles"]["role_name"])

        return roles

    @staticmethod
    def assign_role(user_id: str, role_name: str) -> bool:
        """Assign a role to user in Supabase"""
        client = get_supabase_admin_client()

        # Get role_id
        role_result = client.table("roles").select("role_id").eq("role_name", role_name.upper()).execute()

        if not role_result.data or len(role_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role '{role_name}' not found"
            )

        role_id = role_result.data[0]["role_id"]

        # Check if already assigned
        existing = client.table("user_roles").select("*").eq("user_id", user_id).eq("role_id", role_id).execute()

        if existing.data and len(existing.data) > 0:
            return False  # Already has role

        # Assign role
        client.table("user_roles").insert({"user_id": user_id, "role_id": role_id}).execute()

        return True

    @staticmethod
    def remove_role(user_id: str, role_name: str) -> bool:
        """Remove a role from user in Supabase"""
        client = get_supabase_admin_client()

        # Get role_id
        role_result = client.table("roles").select("role_id").eq("role_name", role_name.upper()).execute()

        if not role_result.data or len(role_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role '{role_name}' not found"
            )

        role_id = role_result.data[0]["role_id"]

        # Delete role assignment
        result = client.table("user_roles").delete().eq("user_id", user_id).eq("role_id", role_id).execute()

        return len(result.data) > 0 if result.data else False

    @staticmethod
    def block_user(user_id: str) -> Dict[str, Any]:
        """Block a user account in Supabase"""
        client = get_supabase_admin_client()

        result = client.table("user_profile").update({
            "status": UserStatus.BLOCKED.value,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return result.data[0]

    @staticmethod
    def unblock_user(user_id: str) -> Dict[str, Any]:
        """Unblock a user account in Supabase"""
        client = get_supabase_admin_client()

        result = client.table("user_profile").update({
            "status": UserStatus.ACTIVE.value,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()

        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return result.data[0]


class AuditService:
    """Service for audit logging in Supabase"""

    @staticmethod
    def log_action(
        user_id: str,
        action: AuditAction,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[str] = None
    ) -> Dict[str, Any]:
        """Log a user action to Supabase"""
        client = get_supabase_admin_client()

        log_entry = {
            "user_id": user_id,
            "action": action.value if isinstance(action, AuditAction) else action,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "details": details
        }

        result = client.table("user_audit_log").insert(log_entry).execute()

        return result.data[0] if result.data else log_entry

    @staticmethod
    def get_user_audit_logs(user_id: str, skip: int = 0, limit: int = 50) -> tuple:
        """Get audit logs for a user from Supabase"""
        client = get_supabase_admin_client()

        # Get total count
        count_result = client.table("user_audit_log").select("audit_id", count="exact").eq("user_id", user_id).execute()
        total = count_result.count if count_result.count else 0

        # Get paginated logs
        result = client.table("user_audit_log").select("*").eq("user_id", user_id).order("created_at", desc=True).range(skip, skip + limit - 1).execute()

        return result.data or [], total


class RoleService:
    """Service for role management in Supabase"""

    @staticmethod
    def get_all_roles() -> List[Dict[str, Any]]:
        """Get all roles from Supabase"""
        client = get_supabase_admin_client()

        result = client.table("roles").select("*").execute()

        return result.data or []

