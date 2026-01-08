"""
Auth & User Pydantic Models
Request/Response schemas for authentication and user management
NOTE: OTP-related models are commented out for MVP (Day 2 feature)
"""
from datetime import datetime, date
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field


# ========================
# Enums
# ========================

class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    BLOCKED = "BLOCKED"
    DELETED = "DELETED"


class LoginProvider(str, Enum):
    """Login providers - OTP is Day 2 feature"""
    EMAIL = "EMAIL"
    GOOGLE = "GOOGLE"
    INSTAGRAM = "INSTAGRAM"
    # OTP = "OTP"  # Day 2 feature


class CommunicationChannel(str, Enum):
    WHATSAPP = "WHATSAPP"
    INSTAGRAM = "INSTAGRAM"
    EMAIL = "EMAIL"


class RoleName(str, Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"
    DELIVERY = "DELIVERY"


class AuditAction(str, Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    PROFILE_UPDATE = "PROFILE_UPDATE"
    ROLE_ASSIGNED = "ROLE_ASSIGNED"
    ROLE_REMOVED = "ROLE_REMOVED"
    # OTP_SENT = "OTP_SENT"  # Day 2 feature
    # OTP_VERIFIED = "OTP_VERIFIED"  # Day 2 feature
    # OTP_FAILED = "OTP_FAILED"  # Day 2 feature


# ========================
# OTP Request/Response Models - Day 2 Feature
# ========================
# These are commented out for MVP. Uncomment when implementing OTP auth.
#
# class SendOTPRequest(BaseModel):
#     """Request to send OTP to phone"""
#     phone: str = Field(..., description="Phone number with country code")
#
# class VerifyOTPRequest(BaseModel):
#     """Request to verify OTP"""
#     phone: str
#     otp: str = Field(..., min_length=6, max_length=6)
#
# class SendOTPResponse(BaseModel):
#     """Response after sending OTP"""
#     success: bool
#     message: str
#     expires_in: int = 300
#
# class VerifyOTPResponse(BaseModel):
#     """Response after OTP verification"""
#     success: bool
#     is_new_user: bool
#     access_token: Optional[str]
#     refresh_token: Optional[str]
#     roles: List[str] = []
# ========================


# ========================
# User Profile Models
# ========================

class UserProfileBase(BaseModel):
    """Base user profile fields"""
    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    dob: Optional[date] = None


class UserProfileCreate(UserProfileBase):
    """Create user profile (internal use)"""
    id: str = Field(..., description="Supabase user ID (UUID)")
    status: UserStatus = UserStatus.ACTIVE


class UserProfileUpdate(UserProfileBase):
    """Update user profile"""
    pass


class UserProfileResponse(UserProfileBase):
    """User profile response"""
    id: str
    status: UserStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    roles: List[str] = []

    class Config:
        from_attributes = True


# ========================
# User Preferences Models
# ========================

class UserPreferencesBase(BaseModel):
    """Base preferences fields"""
    preferred_language: Optional[str] = Field("en", max_length=10)
    preferred_size: Optional[str] = Field(None, max_length=20)
    preferred_color: Optional[str] = Field(None, max_length=50)
    communication_channel: CommunicationChannel = CommunicationChannel.WHATSAPP


class UserPreferencesUpdate(UserPreferencesBase):
    """Update preferences"""
    pass


class UserPreferencesResponse(UserPreferencesBase):
    """Preferences response"""
    user_id: str

    class Config:
        from_attributes = True


# ========================
# Auth Meta Models
# ========================

class AuthMetaResponse(BaseModel):
    """Auth metadata response"""
    user_id: str
    last_login_at: Optional[datetime] = None
    login_provider: Optional[LoginProvider] = None
    failed_login_count: int = 0
    is_email_verified: bool = False
    is_phone_verified: bool = False

    class Config:
        from_attributes = True


# ========================
# Role Models
# ========================

class RoleResponse(BaseModel):
    """Role response"""
    role_id: int
    role_name: RoleName

    class Config:
        from_attributes = True


class AssignRoleRequest(BaseModel):
    """Request to assign role to user"""
    user_id: str = Field(..., description="User ID (UUID)")
    role_name: RoleName = Field(..., description="Role to assign")


class RemoveRoleRequest(BaseModel):
    """Request to remove role from user"""
    user_id: str = Field(..., description="User ID (UUID)")
    role_name: RoleName = Field(..., description="Role to remove")


# ========================
# Audit Log Models
# ========================

class AuditLogResponse(BaseModel):
    """Audit log entry response"""
    audit_id: int
    user_id: str
    action: AuditAction
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Paginated audit log response"""
    items: List[AuditLogResponse]
    total: int
    page: int
    per_page: int


# ========================
# Current User Model
# ========================

class CurrentUser(BaseModel):
    """Current authenticated user context"""
    user_id: str
    phone: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    roles: List[str] = []
    status: UserStatus = UserStatus.ACTIVE

    def has_role(self, role: str) -> bool:
        return role.upper() in [r.upper() for r in self.roles]

    def is_admin(self) -> bool:
        return self.has_role("ADMIN")

    def is_customer(self) -> bool:
        return self.has_role("CUSTOMER")


# ========================
# Error Response Models
# ========================

class AuthErrorResponse(BaseModel):
    """Auth error response"""
    error: str
    error_code: str
    details: Optional[dict] = None

