"""
DEPRECATED - User & Auth Database Models

⚠️ WARNING: These SQLAlchemy models are NO LONGER USED.
User tables have been migrated to Supabase Postgres.

See: database/supabase_schema.sql for the actual table definitions.

The backend now uses Supabase client to query user data instead of SQLAlchemy.
This file is kept for reference only.
"""

# ============================================
# DEPRECATED - DO NOT USE
# These models have been migrated to Supabase Postgres
# ============================================
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Text, DateTime, Date,
    ForeignKey, PrimaryKeyConstraint
)
from sqlalchemy.orm import relationship
from database.connection import Base


class UserProfile(Base):
    """
    Business user data - linked to Supabase auth.users
    ID MUST equal auth.users.id (UUID from Supabase)
    NO password stored here
    """
    __tablename__ = "user_profile"

    id = Column(String(36), primary_key=True)  # UUID from Supabase auth.users.id
    full_name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    dob = Column(Date, nullable=True)

    status = Column(String(20), default="ACTIVE")  # ACTIVE | BLOCKED | DELETED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    auth_meta = relationship("AuthMeta", back_populates="user", uselist=False, cascade="all, delete-orphan")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("UserAuditLog", back_populates="user", cascade="all, delete-orphan")


class AuthMeta(Base):
    """
    Login metadata - tracks auth-related info
    Auth itself is handled by Supabase
    """
    __tablename__ = "auth_meta"

    user_id = Column(String(36), ForeignKey("user_profile.id"), primary_key=True)
    last_login_at = Column(DateTime, nullable=True)
    login_provider = Column(String(50), nullable=True)  # OTP | EMAIL | GOOGLE | INSTAGRAM
    failed_login_count = Column(Integer, default=0)
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)

    # Relationships
    user = relationship("UserProfile", back_populates="auth_meta")


class UserPreferences(Base):
    """
    User preferences for personalization
    """
    __tablename__ = "user_preferences"

    user_id = Column(String(36), ForeignKey("user_profile.id"), primary_key=True)
    preferred_language = Column(String(10), default="en")
    preferred_size = Column(String(20), nullable=True)
    preferred_color = Column(String(50), nullable=True)
    communication_channel = Column(String(20), default="WHATSAPP")  # WHATSAPP | INSTAGRAM | EMAIL

    # Relationships
    user = relationship("UserProfile", back_populates="preferences")


class Role(Base):
    """
    System roles for RBAC
    """
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), unique=True, nullable=False)  # ADMIN | CUSTOMER | DELIVERY

    # Relationships
    users = relationship("UserRole", back_populates="role")


class UserRole(Base):
    """
    Many-to-many mapping between users and roles
    A user can have multiple roles
    """
    __tablename__ = "user_roles"

    user_id = Column(String(36), ForeignKey("user_profile.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint('user_id', 'role_id'),
    )

    # Relationships
    user = relationship("UserProfile", back_populates="roles")
    role = relationship("Role", back_populates="users")


class UserAuditLog(Base):
    """
    Audit log for security & compliance
    Tracks user actions
    """
    __tablename__ = "user_audit_log"

    audit_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("user_profile.id"), nullable=False)
    action = Column(String(50), nullable=False)  # LOGIN | LOGOUT | PASSWORD_CHANGE | PROFILE_UPDATE
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    details = Column(Text, nullable=True)  # JSON string for additional context
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("UserProfile", back_populates="audit_logs")

