"""
Catalogue Router Store - Customer-facing read-only endpoints
Updated for new schema:
- Platform → Category → Catalogue (with gender) → Product (Color SKU) → Variant → Option

Optimized for frontend product browsing and buy intent
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from database.connection import get_db
from database.db_models import Product, Catalogue, ProductVariant
from models.catalogue_models import (
    # Response models
    PlatformResponse, BrandResponse, CategoryResponse, CatalogueResponse, ProductResponse,
    ProductListingItem, ProductListingResponse, ProductAvailabilityResponse,
    MediaGroupedResponse, ColorOption,
    # Enums
    Gender
)
from services.catalogue_service import (
    PlatformService, BrandService, CategoryService, CatalogueService, ProductService,
    MediaAssetService, ProductListingService, AvailabilityService,
    product_to_dict, platform_to_dict, brand_to_dict, category_to_dict, catalogue_to_dict
)

router = APIRouter(prefix="/catalogue", tags=["Catalogue Store"])


# ========================
# Buy Intent Models
# ========================

class BuyIntentRequest(BaseModel):
    """Request model for buy intent"""
    product_id: int = Field(..., gt=0, description="Product ID")
    variant_id: int = Field(..., gt=0, description="Variant ID (size)")
    quantity: int = Field(1, ge=1, le=10, description="Quantity (max 10)")
    channel: str = Field("whatsapp", description="Channel: whatsapp | instagram")


class BuyIntentResponse(BaseModel):
    """Response model for buy intent with redirect URL"""
    success: bool
    redirect_url: str
    message: str
    product_name: str
    color: Optional[str] = None
    size: str
    quantity: int
    unit_price: int
    total_price: int
    in_stock: bool


class ProductDetailResponse(BaseModel):
    """Aggregated product detail response for frontend"""
    product: ProductResponse
    availability: ProductAvailabilityResponse
    media_grouped: MediaGroupedResponse
    color_options: List[ColorOption] = []


# ========================
# Platform Read-Only Endpoints
# ========================

@router.get("/platforms", response_model=List[PlatformResponse])
def list_active_platforms(
    db: Session = Depends(get_db)
):
    """List active platforms (Footwear, Clothing, etc.)"""
    platforms = PlatformService.list_platforms(db, is_active=True)
    return [platform_to_dict(p) for p in platforms]


@router.get("/platforms/{platform_slug}", response_model=PlatformResponse)
def get_platform_by_slug(platform_slug: str, db: Session = Depends(get_db)):
    """Get a platform by slug"""
    platform = PlatformService.get_platform_by_slug(db, platform_slug)
    if not platform.is_active:
        raise HTTPException(status_code=404, detail="Platform not found")
    return platform_to_dict(platform)


@router.get("/platforms/{platform_slug}/categories", response_model=List[CategoryResponse])
def get_platform_categories(
    platform_slug: str,
    db: Session = Depends(get_db)
):
    """Get all active categories for a platform"""
    platform = PlatformService.get_platform_by_slug(db, platform_slug)
    if not platform.is_active:
        raise HTTPException(status_code=404, detail="Platform not found")
    
    categories = CategoryService.list_categories(db, platform_id=platform.id, is_active=True)
    return [category_to_dict(c) for c in categories]


# ========================
# Brand Read-Only Endpoints
# ========================

@router.get("/brands", response_model=List[BrandResponse])
def list_active_brands(
    search: Optional[str] = Query(None, description="Search by brand name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List active brands"""
    brands = BrandService.list_brands(db, is_active=True, search=search, skip=skip, limit=limit)
    return [brand_to_dict(b) for b in brands]


@router.get("/brands/{brand_slug}", response_model=BrandResponse)
def get_brand_by_slug(brand_slug: str, db: Session = Depends(get_db)):
    """Get a brand by slug"""
    brand = BrandService.get_brand_by_slug(db, brand_slug)
    if not brand.is_active:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand_to_dict(brand)


# ========================
# Category Read-Only Endpoints
# ========================

@router.get("/categories", response_model=List[CategoryResponse])
def list_active_categories(
    platform_id: Optional[int] = Query(None, description="Filter by platform ID"),
    parent_id: Optional[int] = Query(None, description="Filter by parent category ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List active categories only (store view)"""
    categories = CategoryService.list_categories(db, platform_id, parent_id, is_active=True, skip=skip, limit=limit)
    return [category_to_dict(c) for c in categories]


@router.get("/categories/root", response_model=List[CategoryResponse])
def get_root_categories(
    platform_id: Optional[int] = Query(None, description="Filter by platform ID"),
    db: Session = Depends(get_db)
):
    """Get all root categories (no parent)"""
    categories = CategoryService.get_root_categories(db, platform_id)
    return [category_to_dict(c) for c in categories if c.is_active]


@router.get("/categories/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a category by ID"""
    category = CategoryService.get_category(db, category_id)
    if not category.is_active:
        raise HTTPException(status_code=404, detail="Category not found")
    return category_to_dict(category)


@router.get("/categories/slug/{slug}", response_model=CategoryResponse)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get a category by slug"""
    category = CategoryService.get_category_by_slug(db, slug)
    if not category.is_active:
        raise HTTPException(status_code=404, detail="Category not found")
    return category_to_dict(category)


# ========================
# Catalogue Read-Only Endpoints
# ========================

@router.get("/catalogues", response_model=List[CatalogueResponse])
def list_active_catalogues(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    gender: Optional[Gender] = Query(None, description="Filter by gender"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List active catalogues only (store view)"""
    catalogues = CatalogueService.list_catalogues(
        db, is_active=True, category_id=category_id,
        gender=gender.value if gender else None,
        skip=skip, limit=limit
    )
    return [catalogue_to_dict(c) for c in catalogues]


@router.get("/catalogues/{catalogue_id}", response_model=CatalogueResponse)
def get_catalogue(catalogue_id: int, db: Session = Depends(get_db)):
    """Get a catalogue by ID"""
    catalogue = CatalogueService.get_catalogue(db, catalogue_id)
    if not catalogue.is_active:
        raise HTTPException(status_code=404, detail="Catalogue not found")
    return catalogue_to_dict(catalogue)


@router.get("/catalogues/slug/{slug}", response_model=CatalogueResponse)
def get_catalogue_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get a catalogue by slug"""
    catalogue = CatalogueService.get_catalogue_by_slug(db, slug)
    if not catalogue.is_active:
        raise HTTPException(status_code=404, detail="Catalogue not found")
    return catalogue_to_dict(catalogue)


@router.get("/catalogues/{catalogue_id}/products", response_model=List[ProductResponse])
def get_catalogue_products(catalogue_id: int, db: Session = Depends(get_db)):
    """Get all LIVE products (color SKUs) in a catalogue"""
    catalogue = CatalogueService.get_catalogue(db, catalogue_id)
    if not catalogue.is_active:
        raise HTTPException(status_code=404, detail="Catalogue not found")

    products = CatalogueService.get_catalogue_products(db, catalogue_id)
    return [product_to_dict(p) for p in products if p.status == "live" and p.deleted_at is None]


# ========================
# Product Read-Only Endpoints
# ========================

@router.get("/products/listing", response_model=ProductListingResponse)
def get_product_listing(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    catalogue_id: Optional[int] = Query(None, description="Filter by catalogue ID"),
    platform_slug: Optional[str] = Query(None, description="Filter by platform slug (footwear, clothing)"),
    brand_id: Optional[int] = Query(None, description="Filter by brand ID"),
    brand: Optional[str] = Query(None, description="Filter by brand name"),
    gender: Optional[Gender] = Query(None, description="Filter by gender (from catalogue)"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated, e.g., 'new,trending,featured')"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price filter"),
    in_stock_only: bool = Query(False, description="Only show in-stock products"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Optimized product listing endpoint for store frontend.

    - Only returns LIVE products
    - Gender is inherited from catalogue
    - Pre-joined primary image
    - Discount percentage calculated
    - In-stock status included
    """
    # Convert brand name to brand_id if provided
    if brand and not brand_id:
        from database.db_models import Brand
        brand_obj = db.query(Brand).filter(Brand.name == brand).first()
        if brand_obj:
            brand_id = brand_obj.id
    
    skip = (page - 1) * per_page
    items, total, filters_applied = ProductListingService.get_product_listing(
        db,
        category_id=category_id,
        catalogue_id=catalogue_id,
        platform_slug=platform_slug,
        brand_id=brand_id,
        gender=gender.value if gender else None,
        is_featured=is_featured,
        tags=tags,
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock_only,
        skip=skip,
        limit=per_page
    )

    return ProductListingResponse(
        items=[ProductListingItem(**item) for item in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page if total > 0 else 0,
        filters_applied=filters_applied
    )


@router.get("/products/slug/{slug}", response_model=ProductResponse)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get a LIVE product by slug"""
    product = ProductService.get_product_by_slug(db, slug)
    if product.status != "live" or product.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_dict(product)


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a LIVE product by ID"""
    product = ProductService.get_product(db, product_id)
    if product.status != "live" or product.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_dict(product)


@router.get("/products/{product_id}/availability", response_model=ProductAvailabilityResponse)
def get_product_availability(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Get complete availability information for a product.
    Critical for Buy Now UX.

    Returns:
    - Overall product availability status
    - Total stock across all sizes
    - Per-size breakdown with stock status
    """
    result = AvailabilityService.get_product_availability(db, product_id)
    return ProductAvailabilityResponse(**result)


@router.get("/products/{product_id}/colors", response_model=List[ColorOption])
def get_product_color_options(product_id: int, db: Session = Depends(get_db)):
    """
    Get other color options for a product (other products in same catalogue).
    Used for PDP color switching.
    """
    return ProductService.get_color_options(db, product_id)


# ========================
# Aggregated Product Detail API
# ========================

@router.get("/products/slug/{slug}/detail", response_model=ProductDetailResponse)
def get_product_detail_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """
    Aggregated product detail endpoint - FRONTEND GOLD!

    Returns everything needed for a product page in ONE call:
    - Product with variants (sizes)
    - Availability info (stock, sizes)
    - Media grouped by type
    - Color options (other products in same catalogue)

    Avoids multiple API calls from frontend.
    """
    product = ProductService.get_product_by_slug(db, slug)
    if product.status != "live" or product.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get availability
    availability = AvailabilityService.get_product_availability(db, product.id)

    # Get media grouped
    all_media = MediaAssetService.list_product_media(db, product.id)
    grouped = {"catalogue": [], "lifestyle": [], "banner": []}
    for media in all_media:
        if media.usage_type in grouped:
            grouped[media.usage_type].append(media)

    # Get color options (other products in same catalogue)
    color_options = ProductService.get_color_options(db, product.id)

    return ProductDetailResponse(
        product=product_to_dict(product),
        availability=ProductAvailabilityResponse(**availability),
        media_grouped=MediaGroupedResponse(**grouped),
        color_options=color_options
    )


@router.get("/products/{product_id}/detail", response_model=ProductDetailResponse)
def get_product_detail_by_id(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Aggregated product detail endpoint by ID.
    Same as slug version but uses product ID.
    """
    product = ProductService.get_product(db, product_id)
    if product.status != "live" or product.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get availability
    availability = AvailabilityService.get_product_availability(db, product.id)

    # Get media grouped
    all_media = MediaAssetService.list_product_media(db, product.id)
    grouped = {"catalogue": [], "lifestyle": [], "banner": []}
    for media in all_media:
        if media.usage_type in grouped:
            grouped[media.usage_type].append(media)

    # Get color options
    color_options = ProductService.get_color_options(db, product.id)

    return ProductDetailResponse(
        product=product_to_dict(product),
        availability=ProductAvailabilityResponse(**availability),
        media_grouped=MediaGroupedResponse(**grouped),
        color_options=color_options
    )


# ========================
# Buy Intent API - Core MVP Feature
# ========================

@router.post("/buy-intent", response_model=BuyIntentResponse)
def create_buy_intent(
    request: BuyIntentRequest,
    db: Session = Depends(get_db)
):
    """
    Generate WhatsApp / Instagram redirect for purchase.

    This is the core MVP selling feature:
    1. Validates product exists and is live
    2. Validates stock availability
    3. Generates redirect URL with pre-filled message

    **Channels**:
    - `whatsapp`: Generates WhatsApp URL with product details
    - `instagram`: Generates Instagram DM URL
    """
    # Get product
    product = db.query(Product).filter(
        Product.id == request.product_id,
        Product.status == "live",
        Product.deleted_at.is_(None)
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found or not available")

    # Get variant (size)
    variant = db.query(ProductVariant).filter(
        ProductVariant.id == request.variant_id,
        ProductVariant.product_id == request.product_id,
        ProductVariant.is_active == True,
        ProductVariant.deleted_at.is_(None)
    ).first()

    if not variant:
        raise HTTPException(status_code=404, detail="Size not found or not available")

    # Check stock
    in_stock = variant.stock_quantity >= request.quantity

    if not in_stock:
        return BuyIntentResponse(
            success=False,
            redirect_url="",
            message=f"Insufficient stock. Only {variant.stock_quantity} available.",
            product_name=product.name,
            color=product.color,
            size=variant.size or "Standard",
            quantity=request.quantity,
            unit_price=variant.price_override or product.price,
            total_price=(variant.price_override or product.price) * request.quantity,
            in_stock=False
        )

    # Calculate price
    unit_price = variant.price_override or product.price
    total_price = unit_price * request.quantity

    # Format price in INR (prices are in rupees)
    price_formatted = f"₹{total_price:,.0f}"

    # Build message
    message = (
        f"Hi! I want to buy:\n\n"
        f"🛍️ *{product.name}*\n"
        f"🎨 Color: {product.color or 'Standard'}\n"
        f"📏 Size: {variant.size or 'Standard'}\n"
        f"📦 Quantity: {request.quantity}\n"
        f"💰 Total: {price_formatted}\n\n"
        f"Please confirm availability and share payment details."
    )

    # URL encode message
    import urllib.parse
    from configs.settings import get_settings

    settings = get_settings()
    encoded_message = urllib.parse.quote(message)

    # Generate redirect URL based on channel
    if request.channel == "whatsapp":
        phone_number = getattr(settings, 'WHATSAPP_BUSINESS_PHONE', '919999999999')
        redirect_url = f"https://wa.me/{phone_number}?text={encoded_message}"
    elif request.channel == "instagram":
        instagram_username = getattr(settings, 'INSTAGRAM_USERNAME', 'hcfashionhouse')
        redirect_url = f"https://ig.me/m/{instagram_username}"
    else:
        raise HTTPException(status_code=400, detail="Invalid channel. Use 'whatsapp' or 'instagram'")

    return BuyIntentResponse(
        success=True,
        redirect_url=redirect_url,
        message="Redirecting to complete your purchase",
        product_name=product.name,
        color=product.color,
        size=variant.size or "Standard",
        quantity=request.quantity,
        unit_price=unit_price,
        total_price=total_price,
        in_stock=True
    )


# ========================
# Media Grouped Endpoints (Store)
# ========================

@router.get("/products/{product_id}/media/grouped", response_model=MediaGroupedResponse)
def get_product_media_grouped(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get all media for a product grouped by usage type"""
    all_media = MediaAssetService.list_product_media(db, product_id)

    grouped = {"catalogue": [], "lifestyle": [], "banner": []}
    for media in all_media:
        if media.usage_type in grouped:
            grouped[media.usage_type].append(media)

    return MediaGroupedResponse(**grouped)


@router.get("/variants/{variant_id}/media/grouped", response_model=MediaGroupedResponse)
def get_variant_media_grouped(
    variant_id: int,
    db: Session = Depends(get_db)
):
    """Get all media for a variant grouped by usage type"""
    all_media = MediaAssetService.list_variant_media(db, variant_id)

    grouped = {"catalogue": [], "lifestyle": [], "banner": []}
    for media in all_media:
        if media.usage_type in grouped:
            grouped[media.usage_type].append(media)

    return MediaGroupedResponse(**grouped)

