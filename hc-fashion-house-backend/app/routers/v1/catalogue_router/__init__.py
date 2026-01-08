"""
Catalogue Router Package
"""
from .catalogue_router_admin import router as admin_router
from .catalogue_router import router as store_router

__all__ = ["admin_router", "store_router"]

