"""
Media Upload Router
API endpoints for R2 (Cloudflare) media upload and management
All uploads are handled through backend - frontend never uploads directly to R2
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, File, UploadFile, Form, Query, status, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database.connection import get_db
from models.media_models import (
    MediaType, UsageType, Platform, MediaStatus,
    ProductVariantMediaUpload, CatalogueBannerUpload,
    CategoryBannerUpload, GlobalMediaUpload, MediaUpdateRequest,
    BulkDisplayOrderUpdate,
    MediaUploadResponse, MediaDeleteResponse,
    BulkUploadResponse, CloudinaryHealthResponse
)
from services.media_upload_service import MediaUploadService
from utils.exceptions import EcommerceException

router = APIRouter(prefix="/media", tags=["Media Upload"])

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
    elif isinstance(e, HTTPException):
        return JSONResponse(
            status_code=e.status_code,
            content={"error": e.detail, "error_code": "HTTP_ERROR"}
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
# Health Check
# ========================

@router.get(
    "/health",
    response_model=CloudinaryHealthResponse,
    summary="Check R2 Storage Connection",
    description="Verify that R2 storage is properly configured and accessible"
)
async def check_r2_health():
    """Check R2 connection status"""
    result = media_service.check_r2_connection()
    status_code = 200 if result.get("connected", False) else 503
    return JSONResponse(status_code=status_code, content=result)


# ========================
# Product Variant Media Upload
# ========================

@router.post(
    "/product-variant",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Product Media (Color SKU)",
    description="""
    Upload an image for a product (color SKU).
    
    ⚠️ **IMPORTANT**: Images belong to PRODUCT (color), NOT to variants (sizes)!
    All sizes of the same color share the same images.
    
    **Folder Structure**: `ecommerce/products/{platform_slug}/{catalogue_slug}/{color_slug}/{usage_type}/`
    
    **Example**: `ecommerce/products/footwear/hr-416/white-grey/catalogue/01.jpg`
    
    **Usage Types**:
    - `catalogue`: Product page images (hero, side, sole, detail shots)
    - `lifestyle`: Real-world, on-feet, lifestyle shots
    
    **Rules**:
    - One image should have `is_primary=true` for catalogue images
    - Display order is controlled by `display_order` (lower = shown first)
    - Images are shared across all size variants of the same color
    """
)
async def upload_product_variant_media(
    file: UploadFile = File(..., description="Image file to upload"),
    product_id: int = Form(..., gt=0, description="Product ID"),
    variant_id: int = Form(..., gt=0, description="Variant ID"),
    usage_type: UsageType = Form(..., description="Usage type (catalogue/lifestyle)"),
    platform: Platform = Form(Platform.WEBSITE, description="Target platform"),
    display_order: int = Form(0, ge=0, description="Display order"),
    is_primary: bool = Form(False, description="Set as primary image"),
    db: Session = Depends(get_db)
):
    """Upload media for a product variant"""
    try:
        upload_data = ProductVariantMediaUpload(
            product_id=product_id,
            variant_id=variant_id,
            usage_type=usage_type,
            platform=platform,
            display_order=display_order,
            is_primary=is_primary
        )

        media = await media_service.upload_product_variant_media(db, file, upload_data)

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
    except Exception as e:
        return handle_exception(e)


# ========================
# Catalogue Banner Upload
# ========================

@router.post(
    "/catalogue-banner",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Catalogue Banner",
    description="""
    Upload a banner image for a catalogue/collection.
    
    **Folder Structure**: `ecommerce/catalogues/{catalogue_slug}/banners/`
    
    **Rules**:
    - Setting `is_primary=true` will update the catalogue's `banner_media_id`
    - Only one banner can be primary per catalogue
    """
)
async def upload_catalogue_banner(
    file: UploadFile = File(..., description="Banner image file"),
    catalogue_id: int = Form(..., gt=0, description="Catalogue ID"),
    platform: Platform = Form(Platform.WEBSITE, description="Target platform"),
    display_order: int = Form(0, ge=0, description="Display order"),
    is_primary: bool = Form(True, description="Set as primary banner"),
    db: Session = Depends(get_db)
):
    """Upload banner for a catalogue"""
    try:
        upload_data = CatalogueBannerUpload(
            catalogue_id=catalogue_id,
            platform=platform,
            display_order=display_order,
            is_primary=is_primary
        )

        media = await media_service.upload_catalogue_banner(db, file, upload_data)

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
            product_id=None,
            variant_id=None,
            created_at=media.created_at
        )
    except EcommerceException as e:
        return handle_exception(e)
    except Exception as e:
        return handle_exception(e)


# ========================
# Category Banner Upload
# ========================

@router.post(
    "/category-banner",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Category Banner",
    description="""
    Upload a banner image for a category.
    
    **Folder Structure**: `ecommerce/categories/{category_slug}/banner/`
    """
)
async def upload_category_banner(
    file: UploadFile = File(..., description="Banner image file"),
    category_id: int = Form(..., gt=0, description="Category ID"),
    platform: Platform = Form(Platform.WEBSITE, description="Target platform"),
    display_order: int = Form(0, ge=0, description="Display order"),
    is_primary: bool = Form(True, description="Set as primary banner"),
    db: Session = Depends(get_db)
):
    """Upload banner for a category"""
    try:
        upload_data = CategoryBannerUpload(
            category_id=category_id,
            platform=platform,
            display_order=display_order,
            is_primary=is_primary
        )

        media = await media_service.upload_category_banner(db, file, upload_data)

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
            product_id=None,
            variant_id=None,
            created_at=media.created_at
        )
    except EcommerceException as e:
        return handle_exception(e)
    except Exception as e:
        return handle_exception(e)


# ========================
# Global Media Upload
# ========================

@router.post(
    "/global",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Global Media",
    description="""
    Upload global media assets (brand logos, offer banners, videos).
    
    **Folder Structure**: `ecommerce/global/{folder_type}/`
    
    **Folder Types**:
    - `brand`: Brand logos and assets
    - `offers`: Promotional banners
    - `videos`: Video content
    """
)
async def upload_global_media(
    file: UploadFile = File(..., description="Media file to upload"),
    folder_type: str = Form(..., description="Folder type (brand/offers/videos)"),
    media_type: MediaType = Form(MediaType.IMAGE, description="Media type (image/video)"),
    platform: Platform = Form(Platform.WEBSITE, description="Target platform"),
    display_order: int = Form(0, ge=0, description="Display order"),
    description: Optional[str] = Form(None, max_length=500, description="Media description"),
    db: Session = Depends(get_db)
):
    """Upload global media"""
    try:
        upload_data = GlobalMediaUpload(
            folder_type=folder_type,
            media_type=media_type,
            platform=platform,
            display_order=display_order,
            description=description
        )

        media = await media_service.upload_global_media(db, file, upload_data)

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
            product_id=None,
            variant_id=None,
            created_at=media.created_at
        )
    except EcommerceException as e:
        return handle_exception(e)
    except Exception as e:
        return handle_exception(e)


# ========================
# Get Media
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
# List Media
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
# Update Media
# ========================

@router.put(
    "/{media_id}",
    response_model=MediaUploadResponse,
    summary="Update Media Metadata",
    description="Update media metadata (display_order, is_primary, status, platform)"
)
async def update_media(
    media_id: int,
    update_data: MediaUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update media metadata"""
    try:
        media = media_service.update_media(db, media_id, update_data)

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


@router.patch(
    "/variant/{variant_id}/primary/{media_id}",
    response_model=MediaUploadResponse,
    summary="Set Primary Media",
    description="Set a specific media as the primary image for a variant"
)
async def set_primary_media(
    variant_id: int,
    media_id: int,
    db: Session = Depends(get_db)
):
    """Set media as primary for a variant"""
    try:
        media = media_service.set_primary_media(db, variant_id, media_id)

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


@router.patch(
    "/bulk/display-order",
    response_model=List[MediaUploadResponse],
    summary="Bulk Update Display Order",
    description="Update display order for multiple media assets at once"
)
async def bulk_update_display_order(
    update_data: BulkDisplayOrderUpdate,
    db: Session = Depends(get_db)
):
    """Bulk update display order"""
    try:
        updated = media_service.bulk_update_display_order(db, update_data.media_orders)

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
            for media in updated
        ]
    except EcommerceException as e:
        return handle_exception(e)


# ========================
# Delete Media
# ========================

@router.delete(
    "/{media_id}",
    response_model=MediaDeleteResponse,
    summary="Delete Media",
    description="Delete media from both Cloudinary and database"
)
async def delete_media(media_id: int, db: Session = Depends(get_db)):
    """Delete media asset"""
    try:
        result = media_service.delete_media(db, media_id)
        return MediaDeleteResponse(**result)
    except EcommerceException as e:
        return handle_exception(e)


# ========================
# Bulk Upload (Multiple Files)
# ========================

@router.post(
    "/product-variant/bulk",
    response_model=BulkUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Bulk Upload Product Variant Media",
    description="Upload multiple images for a product variant at once"
)
async def bulk_upload_product_variant_media(
    files: List[UploadFile] = File(..., description="Image files to upload"),
    product_id: int = Form(..., gt=0, description="Product ID"),
    variant_id: int = Form(..., gt=0, description="Variant ID"),
    usage_type: UsageType = Form(..., description="Usage type (catalogue/lifestyle)"),
    platform: Platform = Form(Platform.WEBSITE, description="Target platform"),
    db: Session = Depends(get_db)
):
    """Bulk upload media for a product variant"""
    results = {
        "total": len(files),
        "successful": 0,
        "failed": 0,
        "uploaded": [],
        "errors": []
    }

    for idx, file in enumerate(files):
        try:
            upload_data = ProductVariantMediaUpload(
                product_id=product_id,
                variant_id=variant_id,
                usage_type=usage_type,
                platform=platform,
                display_order=idx,
                is_primary=(idx == 0)  # First image is primary
            )

            media = await media_service.upload_product_variant_media(db, file, upload_data)

            results["successful"] += 1
            results["uploaded"].append(MediaUploadResponse(
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
            ))

        except EcommerceException as e:
            results["failed"] += 1
            results["errors"].append({
                "index": idx,
                "filename": file.filename,
                "error": e.message,
                "error_code": e.error_code
            })
        except Exception as e:
            results["failed"] += 1
            results["errors"].append({
                "index": idx,
                "filename": file.filename,
                "error": str(e),
                "error_code": "UNKNOWN_ERROR"
            })

    return BulkUploadResponse(**results)


# ========================
# Replace Media
# ========================

@router.put(
    "/{media_id}/replace",
    response_model=MediaUploadResponse,
    summary="Replace Media File",
    description="""
    Replace an existing media file while keeping the same database record.
    
    **Use Case**: Admin corrections without breaking existing references.
    
    **Process**:
    1. Deletes old file from Cloudinary
    2. Uploads new file to the same folder
    3. Updates the database record with new URL/dimensions
    4. Keeps the same media_id, display_order, is_primary settings
    """
)
async def replace_media(
    media_id: int,
    file: UploadFile = File(..., description="New media file to upload"),
    db: Session = Depends(get_db)
):
    """Replace media file while keeping the same DB record"""
    try:
        media = await media_service.replace_media(db, media_id, file)

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
    except Exception as e:
        return handle_exception(e)


