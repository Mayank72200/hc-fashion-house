from typing import Union

from fastapi import APIRouter, status

from configs.settings import settings
from models.error_response_model import HttpErrorResponse, HttpErrorResponseDetail

# New router structure - Admin and Store (Customer) routers
from routers.v1.catalogue_router.catalogue_router_admin import router as catalogue_admin_router
from routers.v1.catalogue_router.catalogue_router import router as catalogue_store_router
from routers.v1.media_router.media_router_admin import router as media_admin_router
from routers.v1.media_router.media_router import router as media_store_router

# Auth router
from routers.v1.auth_router import router as auth_router

# Order router
from routers.v1.order_router import router as order_router

# from auth import AzureAuth

# azure_auth = AzureAuth()

api_router = None

if settings.AUTH_SECURITY == "true":
    '''
    api_router = APIRouter(
        prefix="/api",
        dependencies=[Depends(azure_auth)],
        responses={
            status.HTTP_400_BAD_REQUEST:            {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_401_UNAUTHORIZED:           {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_403_FORBIDDEN:              {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_406_NOT_ACCEPTABLE:         {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_429_TOO_MANY_REQUESTS:      {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_500_INTERNAL_SERVER_ERROR:  {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]}
        },
    )
    '''
else:
    api_router = APIRouter(
        responses={
            status.HTTP_400_BAD_REQUEST:            {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_401_UNAUTHORIZED:           {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_403_FORBIDDEN:              {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_406_NOT_ACCEPTABLE:         {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_429_TOO_MANY_REQUESTS:      {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]},
            status.HTTP_500_INTERNAL_SERVER_ERROR:  {"model": Union[HttpErrorResponseDetail, HttpErrorResponse]}
        },
    )

# Include all routers

# Auth Router (public + authenticated endpoints)
api_router.include_router(auth_router, tags=["Authentication"])

# E-Commerce Routers - Admin (state-changing operations)
api_router.include_router(catalogue_admin_router, prefix="/admin", tags=["Catalogue Admin"])
api_router.include_router(media_admin_router, prefix="/admin", tags=["Media Admin"])

# E-Commerce Routers - Store (customer-facing read-only)
api_router.include_router(catalogue_store_router, tags=["Catalogue Store"])
api_router.include_router(media_store_router, tags=["Media Store"])

# Order Routers (customer-facing order management)
api_router.include_router(order_router, tags=["Orders"])
