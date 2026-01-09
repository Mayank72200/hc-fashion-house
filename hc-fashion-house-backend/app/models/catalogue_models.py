"""
Pydantic models for HC Fashion House E-Commerce Catalogue API
Request and Response schemas for all catalogue operations

Schema Hierarchy:
- Platform → Category → Catalogue (Article/Design, with gender) → Product (Color SKU) → Variant → Option
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, field_validator, model_validator
import re


# ========================
# Enums
# ========================

class Gender(str, Enum):
    MEN = "men"
    WOMEN = "women"
    UNISEX = "unisex"
    BOYS = "boys"
    GIRLS = "girls"


class ProductStatus(str, Enum):
    DRAFT = "draft"
    LIVE = "live"
    ARCHIVED = "archived"


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"


class UsageType(str, Enum):
    CATALOGUE = "catalogue"
    LIFESTYLE = "lifestyle"
    BANNER = "banner"
    PRODUCT = "product"


class MediaPlatform(str, Enum):
    """Platform for media assets (not to be confused with Platform table)"""
    WEBSITE = "website"
    INSTAGRAM = "instagram"
    ADS = "ads"


# ========================
# Utility Functions
# ========================

def generate_slug(name: str) -> str:
    """Generate URL-safe slug from name"""
    slug = name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


# ========================
# Platform Models (Footwear, Clothing, Accessories, etc.)
# ========================

class PlatformBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Platform name (e.g., Footwear, Clothing)")
    is_active: bool = Field(True, description="Whether platform is active")


class PlatformCreate(PlatformBase):
    slug: Optional[str] = Field(None, max_length=100, description="URL-safe slug (auto-generated if not provided)")

    @field_validator('slug', mode='before')
    @classmethod
    def generate_slug_if_empty(cls, v, info):
        if not v and 'name' in info.data:
            return generate_slug(info.data['name'])
        return v


class PlatformUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class PlatformResponse(PlatformBase):
    id: int
    slug: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlatformWithCategories(PlatformResponse):
    categories: List["CategoryResponse"] = []


# ========================
# Brand Models
# ========================

class BrandBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Brand name")
    logo_cloudinary_url: Optional[str] = Field(None, description="Cloudinary logo URL")
    logo_folder_path: Optional[str] = Field(None, description="Cloudinary folder path")
    logo_public_id: Optional[str] = Field(None, description="Cloudinary public ID")
    logo_width: Optional[int] = Field(None, description="Logo width")
    logo_height: Optional[int] = Field(None, description="Logo height")
    is_active: bool = Field(True, description="Whether brand is active")


class BrandCreate(BrandBase):
    slug: Optional[str] = Field(None, max_length=255, description="URL-safe slug (auto-generated if not provided)")

    @field_validator('slug', mode='before')
    @classmethod
    def generate_slug_if_empty(cls, v, info):
        if not v and 'name' in info.data:
            return generate_slug(info.data['name'])
        return v


class BrandUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    logo_cloudinary_url: Optional[str] = None
    logo_folder_path: Optional[str] = None
    logo_public_id: Optional[str] = None
    logo_width: Optional[int] = None
    logo_height: Optional[int] = None
    is_active: Optional[bool] = None


class BrandResponse(BrandBase):
    id: int
    slug: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BrandWithProductCount(BrandResponse):
    """Brand response with product count"""
    product_count: int = Field(0, description="Number of products for this brand")


# ========================
# Category Models (linked to Platform)
# ========================

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    platform_id: int = Field(..., description="Platform this category belongs to (e.g., Footwear platform)")
    parent_id: Optional[int] = Field(None, description="Parent category ID for hierarchy")
    is_active: bool = Field(True)


class CategoryCreate(CategoryBase):
    slug: Optional[str] = Field(None, max_length=255, description="URL-safe slug (auto-generated if not provided)")

    @field_validator('slug', mode='before')
    @classmethod
    def generate_slug_if_empty(cls, v, info):
        if not v and 'name' in info.data:
            return generate_slug(info.data['name'])
        return v


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    platform_id: Optional[int] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: int
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryWithPlatform(CategoryResponse):
    platform: Optional[PlatformResponse] = None


class CategoryWithChildren(CategoryResponse):
    children: List["CategoryWithChildren"] = []


# ========================
# Catalogue Models (Article/Design - now with gender)
# ========================

class CatalogueBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Article/Design name (e.g., AirFlex Running Shoe)")
    description: Optional[str] = Field(None, description="Article description")
    category_id: int = Field(..., description="Category for this design")
    gender: Gender = Field(Gender.UNISEX, description="Target gender for this catalogue")
    is_active: bool = Field(True, description="Whether catalogue is active")


class CatalogueCreate(CatalogueBase):
    slug: Optional[str] = Field(None, max_length=255, description="URL-safe slug (auto-generated if not provided)")
    banner_media_id: Optional[int] = Field(None, description="Media asset ID for banner")

    @field_validator('slug', mode='before')
    @classmethod
    def generate_slug_if_empty(cls, v, info):
        if not v and 'name' in info.data:
            return generate_slug(info.data['name'])
        return v


class CatalogueUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    category_id: Optional[int] = None
    gender: Optional[Gender] = None
    banner_media_id: Optional[int] = None
    is_active: Optional[bool] = None


class CatalogueResponse(CatalogueBase):
    id: int
    slug: str
    banner_media_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CatalogueWithCategory(CatalogueResponse):
    category: Optional[CategoryWithPlatform] = None


class CatalogueWithProducts(CatalogueResponse):
    products: List["ProductResponse"] = []


# ========================
# Footwear Details Models
# ========================

class FootwearDetailsBase(BaseModel):
    upper_material: Optional[str] = Field(None, max_length=255)
    sole_material: Optional[str] = Field(None, max_length=255)
    closure_type: Optional[str] = Field(None, max_length=100)
    toe_shape: Optional[str] = Field(None, max_length=100)
    heel_height_mm: Optional[int] = Field(None, ge=0)
    weight_grams: Optional[int] = Field(None, ge=0)
    size_chart_type: Optional[str] = Field(None, max_length=100)


class FootwearDetailsCreate(FootwearDetailsBase):
    pass


class FootwearDetailsUpdate(FootwearDetailsBase):
    pass


class FootwearDetailsResponse(FootwearDetailsBase):
    product_id: int

    class Config:
        from_attributes = True


# ========================
# Variant Option Models (Size options for variants)
# ========================

class VariantOptionBase(BaseModel):
    option_name: str = Field(..., min_length=1, max_length=100, description="Option type (size, waist, length)")
    option_value: str = Field(..., min_length=1, max_length=100, description="Option value (9, XL, 42cm)")
    stock_quantity: int = Field(0, ge=0, description="Available stock quantity")
    is_available: bool = Field(True, description="Whether option is available")


class VariantOptionCreate(VariantOptionBase):
    pass


class VariantOptionUpdate(BaseModel):
    option_name: Optional[str] = Field(None, min_length=1, max_length=100)
    option_value: Optional[str] = Field(None, min_length=1, max_length=100)
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_available: Optional[bool] = None


class VariantOptionResponse(VariantOptionBase):
    id: int
    variant_id: int

    class Config:
        from_attributes = True


# ========================
# Product Variant Models (Size variants - color is at Product level)
# ========================

class ProductVariantBase(BaseModel):
    sku: Optional[str] = Field(None, max_length=100, description="Stock Keeping Unit")
    size: Optional[str] = Field(None, max_length=50, description="Size value (e.g., 9, XL, 42)")
    stock_quantity: int = Field(0, ge=0, description="Available stock")
    price_override: Optional[int] = Field(None, ge=0, description="Price override in smallest currency unit")
    mrp_override: Optional[int] = Field(None, ge=0, description="MRP override")
    is_active: bool = Field(True, description="Whether variant is active")


class ProductVariantCreate(ProductVariantBase):
    options: List[VariantOptionCreate] = Field([], description="Additional dimension options")

    @field_validator('sku')
    @classmethod
    def validate_sku_format(cls, v):
        """Validate and normalize SKU format - uppercase alphanumeric with hyphens"""
        if v is None:
            return v
        # Normalize: uppercase, strip, remove invalid chars
        v = re.sub(r'[^A-Z0-9-]', '', v.upper().strip())
        # Remove leading/trailing/consecutive dashes
        v = re.sub(r'-+', '-', v).strip('-')
        if not v:
            return None  # Return None if SKU becomes empty after cleanup
        return v


class ProductVariantUpdate(BaseModel):
    sku: Optional[str] = Field(None, max_length=100)
    size: Optional[str] = Field(None, max_length=50)
    stock_quantity: Optional[int] = Field(None, ge=0)
    price_override: Optional[int] = Field(None, ge=0)
    mrp_override: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int
    created_at: datetime
    options: List[VariantOptionResponse] = []

    class Config:
        from_attributes = True


# ========================
# Product Tags - Available Tags for products
# ========================
VALID_PRODUCT_TAGS = {
    "new",           # New arrivals
    "trending",      # Trending products
    "featured",      # Featured on homepage
    "bestseller",    # Best selling products
    "sale",          # Products on sale
    "hot",           # Hot/popular products
    "limited",       # Limited edition
    "exclusive",     # Exclusive products
    "popular",       # Popular products
    "seasonal",      # Seasonal collection
    "clearance",     # Clearance items
}


# ========================
# Product Models (Color SKU - inherits gender from Catalogue)
# ========================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name (e.g., AirFlex Running Shoe - Red)")
    catalogue_id: int = Field(..., description="Catalogue/Article ID (required)")
    brand_id: Optional[int] = Field(None, description="Brand ID (foreign key)")
    color: Optional[str] = Field(None, max_length=100, description="Primary color name")
    color_hex: Optional[str] = Field(None, max_length=7, description="Color hex code (e.g., #FF0000)")
    mrp: int = Field(..., ge=0, description="MRP (Maximum Retail Price) in rupees")
    price: Optional[int] = Field(None, ge=0, description="Selling price in rupees (if discounted)")
    short_description: Optional[str] = Field(None, description="Short product description")
    long_description: Optional[str] = Field(None, description="Detailed product description")
    is_featured: bool = Field(False, description="Whether product is featured")
    tags: List[str] = Field([], description="Product tags for sections (new, trending, featured, bestseller, sale, hot, etc.)")
    status: ProductStatus = Field(ProductStatus.DRAFT, description="Product status")
    meta_title: Optional[str] = Field(None, max_length=255, description="SEO meta title")
    meta_description: Optional[str] = Field(None, description="SEO meta description")
    is_active: bool = Field(True, description="Whether product is active")

    @field_validator('tags', mode='before')
    @classmethod
    def normalize_tags(cls, v):
        """Normalize tags to lowercase and remove duplicates"""
        if v is None:
            return []
        if isinstance(v, str):
            return list(set([tag.strip().lower() for tag in v.split(',') if tag.strip()]))
        return list(set([tag.strip().lower() for tag in v if tag and tag.strip()]))

    @field_validator('color_hex')
    @classmethod
    def validate_color_hex(cls, v):
        """Validate hex color format"""
        if v is None:
            return v
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('Color hex must be in format #RRGGBB')
        return v.upper()


class ProductCreate(ProductBase):
    slug: Optional[str] = Field(None, max_length=255, description="URL-safe slug (auto-generated if not provided)")
    variants: List[ProductVariantCreate] = Field([], description="Product variants (sizes)")
    footwear_details: Optional[FootwearDetailsCreate] = Field(None, description="Footwear-specific details")

    @field_validator('slug', mode='before')
    @classmethod
    def generate_slug_if_empty(cls, v, info):
        if not v and 'name' in info.data:
            return generate_slug(info.data['name'])
        return v

    @model_validator(mode='after')
    def validate_prices(self):
        """Ensure price is less than mrp if provided"""
        if self.price is not None and self.price >= self.mrp:
            raise ValueError('Selling price must be less than MRP')
        return self

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        """Validate product name is not just whitespace"""
        if v and not v.strip():
            raise ValueError('Product name cannot be empty or whitespace only')
        return v.strip()


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    catalogue_id: Optional[int] = None
    brand_id: Optional[int] = None
    color: Optional[str] = Field(None, max_length=100)
    color_hex: Optional[str] = Field(None, max_length=7)
    mrp: Optional[int] = Field(None, ge=0)
    price: Optional[int] = Field(None, ge=0)
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    is_featured: Optional[bool] = None
    tags: Optional[List[str]] = None
    status: Optional[ProductStatus] = None
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = None
    is_active: Optional[bool] = None
    footwear_details: Optional[FootwearDetailsUpdate] = None

    @field_validator('tags', mode='before')
    @classmethod
    def normalize_tags(cls, v):
        """Normalize tags to lowercase and remove duplicates"""
        if v is None:
            return None
        if isinstance(v, str):
            return list(set([tag.strip().lower() for tag in v.split(',') if tag.strip()]))
        return list(set([tag.strip().lower() for tag in v if tag and tag.strip()]))


class ProductResponse(ProductBase):
    id: int
    slug: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    variants: List[ProductVariantResponse] = []
    footwear_details: Optional[FootwearDetailsResponse] = None
    # Computed from relationships
    brand: Optional[BrandResponse] = None
    gender: Optional[Gender] = None  # Inherited from catalogue
    platform_slug: Optional[str] = None  # Inherited from catalogue -> category -> platform

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    id: int
    name: str
    slug: str
    brand_id: Optional[int] = None
    brand_name: Optional[str] = None
    catalogue_id: int
    color: Optional[str] = None
    color_hex: Optional[str] = None
    mrp: int
    price: Optional[int] = None
    primary_image_url: Optional[str] = None  # Product image URL
    is_featured: bool
    tags: List[str] = []
    status: ProductStatus
    gender: Optional[Gender] = None  # Inherited from catalogue
    in_stock: Optional[bool] = None  # Stock availability
    discount_percentage: Optional[float] = None  # Calculated discount %
    created_at: datetime

    class Config:
        from_attributes = True


# ========================
# Color Options for PDP
# ========================

class ColorOption(BaseModel):
    """Color option for product detail page - shows other colors from same catalogue"""
    product_id: int
    name: str
    color: Optional[str] = None
    color_hex: Optional[str] = None
    slug: str
    primary_image_url: Optional[str] = None


class ProductDetailResponse(ProductResponse):
    """Extended product response with color options from same catalogue"""
    color_options: List[ColorOption] = []
    catalogue: Optional[CatalogueResponse] = None
    primary_image_url: Optional[str] = None  # Main product image
    images: List[str] = []  # All product images


# ========================
# Media Asset Models
# ========================

class MediaAssetBase(BaseModel):
    media_type: MediaType = Field(..., description="Media type (image/video)")
    usage_type: UsageType = Field(..., description="Usage type (catalogue/lifestyle/banner/product)")
    platform: Optional[MediaPlatform] = Field(None, description="Target platform")
    cloudinary_url: str = Field(..., description="Cloudinary URL")
    folder_path: str = Field(..., description="Folder path in storage")
    public_id: Optional[str] = Field(None, max_length=255, description="Cloudinary public ID")
    width: Optional[int] = Field(None, ge=0)
    height: Optional[int] = Field(None, ge=0)
    aspect_ratio: Optional[str] = Field(None, max_length=20)
    display_order: int = Field(0, ge=0, description="Display order")
    is_primary: bool = Field(False, description="Whether this is the primary media")


class MediaAssetCreate(MediaAssetBase):
    product_id: Optional[int] = Field(None, description="Product ID")
    variant_id: Optional[int] = Field(None, description="Variant ID")


class MediaAssetUpdate(BaseModel):
    media_type: Optional[MediaType] = None
    usage_type: Optional[UsageType] = None
    platform: Optional[MediaPlatform] = None
    cloudinary_url: Optional[str] = None
    folder_path: Optional[str] = None
    public_id: Optional[str] = Field(None, max_length=255)
    width: Optional[int] = Field(None, ge=0)
    height: Optional[int] = Field(None, ge=0)
    aspect_ratio: Optional[str] = Field(None, max_length=20)
    display_order: Optional[int] = Field(None, ge=0)
    is_primary: Optional[bool] = None
    status: Optional[str] = None


class MediaAssetResponse(MediaAssetBase):
    id: int
    product_id: Optional[int] = None
    variant_id: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ========================
# Bulk Operations Models
# ========================

class BulkProductUpload(BaseModel):
    products: List[ProductCreate] = Field(..., description="List of products to upload")


class BulkUploadResponse(BaseModel):
    total: int
    successful: int
    failed: int
    errors: List[dict] = []


# ========================
# Pagination Models
# ========================

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")


class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    per_page: int
    pages: int


# ========================
# Optimized Listing Models
# ========================

class ProductListingItem(BaseModel):
    """Optimized product listing response with pre-joined primary image"""
    id: int
    name: str
    slug: str
    brand_id: Optional[int] = None
    brand_name: Optional[str] = None
    price: int  # Selling price (what customer pays)
    mrp: Optional[int] = None  # MRP (original price for strikethrough display)
    discount_percentage: Optional[float] = None
    primary_image_url: Optional[str] = None
    primary_image_alt: Optional[str] = None
    catalogue_id: int
    category_id: Optional[int] = None
    gender: Optional[Gender] = None  # Inherited from catalogue
    color: Optional[str] = None  # Product color name
    color_hex: Optional[str] = None  # Color hex code for swatches
    platform_slug: Optional[str] = None
    is_featured: bool = False
    tags: List[str] = []
    status: ProductStatus
    in_stock: bool = True
    available_sizes: List[str] = []  # Available sizes from variants
    available_colors: List[dict] = []  # Available colors from catalogue
    short_description: Optional[str] = None  # Product short description
    created_at: datetime

    class Config:
        from_attributes = True


class ProductListingResponse(BaseModel):
    """Paginated product listing response"""
    items: List[ProductListingItem]
    total: int
    page: int
    per_page: int
    pages: int
    filters_applied: dict = {}


# ========================
# Availability Models
# ========================

class SizeAvailability(BaseModel):
    """Size availability for a variant"""
    variant_id: int
    size: str
    stock_quantity: int
    is_available: bool


class ProductAvailabilityResponse(BaseModel):
    """Product availability summary"""
    product_id: int
    product_name: str
    color: Optional[str] = None
    available: bool
    total_stock: int
    variant_count: int
    sizes: List[SizeAvailability] = []


# ========================
# Media Grouped Response
# ========================

class MediaGroupedResponse(BaseModel):
    """Media assets grouped by usage type"""
    catalogue: List[MediaAssetResponse] = []
    lifestyle: List[MediaAssetResponse] = []
    banner: List[MediaAssetResponse] = []


# Update forward references
CategoryWithChildren.model_rebuild()
CatalogueWithProducts.model_rebuild()
PlatformWithCategories.model_rebuild()

