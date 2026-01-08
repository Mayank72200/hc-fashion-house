"""
Media Router Package
"""
from .media_router_admin import router as admin_router
from .media_router import router as store_router

__all__ = ["admin_router", "store_router"]

