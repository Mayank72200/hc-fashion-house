"""
Media Router - Store/Customer read-only endpoints
Read-only media access for frontend product pages
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database.connection import get_db
from models.media_models import (
    MediaType, UsageType, Platform, MediaStatus,
    MediaUploadResponse
)
from models.catalogue_models import MediaGroupedResponse
from services.media_upload_service import MediaUploadService
from services.catalogue_service import MediaAssetService
from utils.exceptions import EcommerceException

router = APIRouter(prefix="/media", tags=["Media Store"])

# Initialize service
media_service = MediaUploadService()


# ========================
# Exception Handler Helper
# ========================

def handle_exception(e: Exception) -> JSONResponse:
    """Convert exceptions to appropriate JSON responses"""
    if isinstance(e, EcommerceException):
        return JSONResponse(
            status_code=e.status_code,
            content=e.to_dict()
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "error_code": "INTERNAL_ERROR",
                "details": {"message": str(e)}
            }
        )


# ========================
# Get Media by ID
# ========================

@router.get(
    "/{media_id}",
    response_model=MediaUploadResponse,
    summary="Get Media by ID",
    description="Retrieve a specific media asset by its ID"
)
async def get_media(media_id: int, db: Session = Depends(get_db)):
    """Get media asset by ID"""
    try:
        media = media_service.get_media_by_id(db, media_id)

        return MediaUploadResponse(
            id=media.id,
            cloudinary_url=media.cloudinary_url,
            public_id=media.public_id,
            folder_path=media.folder_path,
            media_type=MediaType(media.media_type),
            usage_type=UsageType(media.usage_type),
            platform=Platform(media.platform),
            width=media.width,
            height=media.height,
            aspect_ratio=media.aspect_ratio,
            display_order=media.display_order,
            is_primary=media.is_primary,
            status=MediaStatus(media.status),
            product_id=media.product_id,
            variant_id=media.variant_id,
            created_at=media.created_at
        )
    except EcommerceException as e:
        return handle_exception(e)


# ========================
# List Product Media
# ========================

@router.get(
    "/product/{product_id}",
    response_model=List[MediaUploadResponse],
    summary="List Product Media",
    description="Get all media for a product, ordered by display_order"
)
async def list_product_media(
    product_id: int,
    usage_type: Optional[UsageType] = Query(None, description="Filter by usage type"),
    db: Session = Depends(get_db)
):
    """List all media for a product"""
    try:
        media_list = media_service.list_product_media(
            db, product_id,
            usage_type.value if usage_type else None
        )

        return [
            MediaUploadResponse(
                id=media.id,
                cloudinary_url=media.cloudinary_url,
                public_id=media.public_id,
                folder_path=media.folder_path,
                media_type=MediaType(media.media_type),
                usage_type=UsageType(media.usage_type),
                platform=Platform(media.platform),
                width=media.width,
                height=media.height,
                aspect_ratio=media.aspect_ratio,
                display_order=media.display_order,
                is_primary=media.is_primary,
                status=MediaStatus(media.status),
                product_id=media.product_id,
                variant_id=media.variant_id,
                created_at=media.created_at
            )
            for media in media_list
        ]
    except EcommerceException as e:
        return handle_exception(e)


# ========================
# List Variant Media
# ========================

@router.get(
    "/variant/{variant_id}",
    response_model=List[MediaUploadResponse],
    summary="List Variant Media",
    description="Get all media for a variant, ordered by display_order"
)
async def list_variant_media(
    variant_id: int,
    usage_type: Optional[UsageType] = Query(None, description="Filter by usage type"),
    db: Session = Depends(get_db)
):
    """List all media for a variant"""
    try:
        media_list = media_service.list_variant_media(
            db, variant_id,
            usage_type.value if usage_type else None
        )

        return [
            MediaUploadResponse(
                id=media.id,
                cloudinary_url=media.cloudinary_url,
                public_id=media.public_id,
                folder_path=media.folder_path,
                media_type=MediaType(media.media_type),
                usage_type=UsageType(media.usage_type),
                platform=Platform(media.platform),
                width=media.width,
                height=media.height,
                aspect_ratio=media.aspect_ratio,
                display_order=media.display_order,
                is_primary=media.is_primary,
                status=MediaStatus(media.status),
                product_id=media.product_id,
                variant_id=media.variant_id,
                created_at=media.created_at
            )
            for media in media_list
        ]
    except EcommerceException as e:
        return handle_exception(e)


# ========================
# List Catalogue Banners
# ========================

@router.get(
    "/catalogue/{catalogue_id}/banners",
    response_model=List[MediaUploadResponse],
    summary="List Catalogue Banners",
    description="Get all banners for a catalogue"
)
async def list_catalogue_banners(
    catalogue_id: int,
    db: Session = Depends(get_db)
):
    """List all banners for a catalogue"""
    try:
        media_list = media_service.list_catalogue_banners(db, catalogue_id)

        return [
            MediaUploadResponse(
                id=media.id,
                cloudinary_url=media.cloudinary_url,
                public_id=media.public_id,
                folder_path=media.folder_path,
                media_type=MediaType(media.media_type),
                usage_type=UsageType(media.usage_type),
                platform=Platform(media.platform),
                width=media.width,
                height=media.height,
                aspect_ratio=media.aspect_ratio,
                display_order=media.display_order,
                is_primary=media.is_primary,
                status=MediaStatus(media.status),
                product_id=media.product_id,
                variant_id=media.variant_id,
                created_at=media.created_at
            )
            for media in media_list
        ]
    except EcommerceException as e:
        return handle_exception(e)


# ========================
# Grouped Media Endpoints
# ========================

@router.get(
    "/product/{product_id}/grouped",
    response_model=MediaGroupedResponse,
    summary="Get Product Media Grouped",
    description="Get all media for a product grouped by usage type (catalogue/lifestyle/banner)"
)
async def get_product_media_grouped(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get media grouped by usage type for a product"""
    try:
        all_media = MediaAssetService.list_product_media(db, product_id)

        grouped = {
            "catalogue": [],
            "lifestyle": [],
            "banner": []
        }

        for media in all_media:
            usage = media.usage_type
            if usage in grouped:
                grouped[usage].append(media)

        return MediaGroupedResponse(**grouped)
    except Exception as e:
        return handle_exception(e)


@router.get(
    "/variant/{variant_id}/grouped",
    response_model=MediaGroupedResponse,
    summary="Get Variant Media Grouped",
    description="Get all media for a variant grouped by usage type"
)
async def get_variant_media_grouped(
    variant_id: int,
    db: Session = Depends(get_db)
):
    """Get media grouped by usage type for a variant"""
    try:
        all_media = MediaAssetService.list_variant_media(db, variant_id)

        grouped = {
            "catalogue": [],
            "lifestyle": [],
            "banner": []
        }

        for media in all_media:
            usage = media.usage_type
            if usage in grouped:
                grouped[usage].append(media)

        return MediaGroupedResponse(**grouped)
    except Exception as e:
        return handle_exception(e)

