from fastapi import APIRouter

from routers.v1.api import api_router

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(api_router)