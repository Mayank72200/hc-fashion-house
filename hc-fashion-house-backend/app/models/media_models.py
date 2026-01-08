"""
Pydantic models for Media Upload API
Request and Response schemas for Cloudinary media operations
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, field_validator


# ========================
# Enums
# ========================

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"


class UsageType(str, Enum):
    CATALOGUE = "catalogue"
    LIFESTYLE = "lifestyle"
    BANNER = "banner"


class Platform(str, Enum):
    WEBSITE = "website"
    INSTAGRAM = "instagram"
    ADS = "ads"
    MOBILE = "mobile"


class MediaStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class UploadTarget(str, Enum):
    """Target type for media upload"""
    PRODUCT_VARIANT = "product_variant"
    CATALOGUE_BANNER = "catalogue_banner"
    CATEGORY_BANNER = "category_banner"
    GLOBAL = "global"


# ========================
# Request Models
# ========================

class ProductVariantMediaUpload(BaseModel):
    """Request model for uploading media to a product variant"""
    product_id: int = Field(..., gt=0, description="Product ID")
    variant_id: int = Field(..., gt=0, description="Variant ID")
    usage_type: UsageType = Field(..., description="Usage type (catalogue/lifestyle)")
    platform: Platform = Field(Platform.WEBSITE, description="Target platform")
    display_order: int = Field(0, ge=0, description="Display order (lower = shown first)")
    is_primary: bool = Field(False, description="Whether this is the primary/hero image")

    @field_validator('usage_type')
    @classmethod
    def validate_usage_type(cls, v):
        """Only catalogue and lifestyle allowed for product variants"""
        if v not in [UsageType.CATALOGUE, UsageType.LIFESTYLE]:
            raise ValueError('Usage type for product variant must be "catalogue" or "lifestyle"')
        return v


class CatalogueBannerUpload(BaseModel):
    """Request model for uploading catalogue banner"""
    catalogue_id: int = Field(..., gt=0, description="Catalogue ID")
    platform: Platform = Field(Platform.WEBSITE, description="Target platform")
    display_order: int = Field(0, ge=0, description="Display order")
    is_primary: bool = Field(True, description="Whether this is the primary banner")


class CategoryBannerUpload(BaseModel):
    """Request model for uploading category banner"""
    category_id: int = Field(..., gt=0, description="Category ID")
    platform: Platform = Field(Platform.WEBSITE, description="Target platform")
    display_order: int = Field(0, ge=0, description="Display order")
    is_primary: bool = Field(True, description="Whether this is the primary banner")


class GlobalMediaUpload(BaseModel):
    """Request model for uploading global media (brand, offers, videos)"""
    folder_type: str = Field(..., description="Folder type (brand/offers/videos)")
    media_type: MediaType = Field(MediaType.IMAGE, description="Media type")
    platform: Platform = Field(Platform.WEBSITE, description="Target platform")
    display_order: int = Field(0, ge=0, description="Display order")
    description: Optional[str] = Field(None, max_length=500, description="Media description")

    @field_validator('folder_type')
    @classmethod
    def validate_folder_type(cls, v):
        allowed = ['brand', 'offers', 'videos']
        if v.lower() not in allowed:
            raise ValueError(f'Folder type must be one of: {", ".join(allowed)}')
        return v.lower()


class MediaUpdateRequest(BaseModel):
    """Request model for updating media metadata"""
    display_order: Optional[int] = Field(None, ge=0, description="Display order")
    is_primary: Optional[bool] = Field(None, description="Whether this is the primary media")
    status: Optional[MediaStatus] = Field(None, description="Media status")
    platform: Optional[Platform] = Field(None, description="Target platform")


class SetPrimaryMediaRequest(BaseModel):
    """Request model for setting primary media"""
    media_id: int = Field(..., gt=0, description="Media ID to set as primary")


class BulkDisplayOrderUpdate(BaseModel):
    """Request model for bulk updating display order"""
    media_orders: List[dict] = Field(..., description="List of {media_id, display_order}")

    @field_validator('media_orders')
    @classmethod
    def validate_media_orders(cls, v):
        for item in v:
            if 'media_id' not in item or 'display_order' not in item:
                raise ValueError('Each item must have media_id and display_order')
            if not isinstance(item['media_id'], int) or item['media_id'] <= 0:
                raise ValueError('media_id must be a positive integer')
            if not isinstance(item['display_order'], int) or item['display_order'] < 0:
                raise ValueError('display_order must be a non-negative integer')
        return v


# ========================
# Response Models
# ========================

class MediaUploadResponse(BaseModel):
    """Response model for successful media upload"""
    id: int = Field(..., description="Media asset ID in database")
    cloudinary_url: str = Field(..., description="Cloudinary secure URL")
    public_id: str = Field(..., description="Cloudinary public ID")
    folder_path: str = Field(..., description="Folder path in Cloudinary")
    media_type: MediaType
    usage_type: UsageType
    platform: Platform
    width: Optional[int] = None
    height: Optional[int] = None
    aspect_ratio: Optional[str] = None
    display_order: int
    is_primary: bool
    status: MediaStatus
    product_id: Optional[int] = None
    variant_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MediaListResponse(BaseModel):
    """Response model for listing media assets"""
    items: List[MediaUploadResponse]
    total: int
    page: int
    per_page: int
    pages: int


class MediaDeleteResponse(BaseModel):
    """Response model for media deletion"""
    success: bool
    message: str
    deleted_id: int
    cloudinary_deleted: bool


class BulkUploadResponse(BaseModel):
    """Response model for bulk media upload"""
    total: int
    successful: int
    failed: int
    uploaded: List[MediaUploadResponse] = []
    errors: List[dict] = []


class CloudinaryHealthResponse(BaseModel):
    """Response model for Cloudinary health check"""
    status: str
    cloud_name: str
    connected: bool
    message: Optional[str] = None


# ========================
# Error Response Models
# ========================

class MediaErrorResponse(BaseModel):
    """Standard error response for media operations"""
    error: str
    error_code: str
    details: Optional[dict] = None


class ValidationErrorResponse(BaseModel):
    """Validation error response"""
    error: str
    error_code: str = "VALIDATION_ERROR"
    field: Optional[str] = None
    details: Optional[dict] = None

