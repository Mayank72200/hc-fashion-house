"""
Catalogue Router - API endpoints for e-commerce catalogue operations
Catalogue = Article/Design, Product = Color SKU
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.catalogue_models import (
    # Category models
    CategoryCreate, CategoryUpdate, CategoryResponse,
    # Catalogue models
    CatalogueCreate, CatalogueUpdate, CatalogueResponse,
    # Product models
    ProductCreate, ProductUpdate, ProductResponse, ProductDetailResponse, ColorOption,
    BulkProductUpload, BulkUploadResponse,
    # Variant models
    ProductVariantCreate, ProductVariantUpdate, ProductVariantResponse,
    # Option models
    VariantOptionCreate, VariantOptionUpdate, VariantOptionResponse,
    # Media models
    MediaAssetCreate, MediaAssetUpdate, MediaAssetResponse,
    # Listing & Availability models
    ProductListingItem, ProductListingResponse, ProductAvailabilityResponse,
    MediaGroupedResponse,
    # Enums
    ProductType, ProductStatus, Gender
)
from services.catalogue_service import (
    CategoryService, CatalogueService, ProductService,
    VariantService, VariantOptionService, MediaAssetService,
    ProductListingService, AvailabilityService, SoftDeleteService
)

router = APIRouter(prefix="/catalogue", tags=["Catalogue"])


# ========================
# Category Endpoints
# ========================

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new category"""
    return CategoryService.create_category(db, category_data)


@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    parent_id: Optional[int] = Query(None, description="Filter by parent category ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """List all categories with optional filters"""
    return CategoryService.list_categories(db, parent_id, is_active, skip, limit)


@router.get("/categories/root", response_model=List[CategoryResponse])
def get_root_categories(db: Session = Depends(get_db)):
    """Get all root categories (no parent)"""
    return CategoryService.get_root_categories(db)


@router.get("/categories/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a category by ID"""
    return CategoryService.get_category(db, category_id)


@router.get("/categories/slug/{slug}", response_model=CategoryResponse)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get a category by slug"""
    return CategoryService.get_category_by_slug(db, slug)


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category"""
    return CategoryService.update_category(db, category_id, category_data)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category"""
    CategoryService.delete_category(db, category_id)
    return None


# ========================
# Catalogue (Collection) Endpoints
# ========================

@router.post("/catalogues", response_model=CatalogueResponse, status_code=status.HTTP_201_CREATED)
def create_catalogue(
    catalogue_data: CatalogueCreate,
    db: Session = Depends(get_db)
):
    """Create a new catalogue/collection"""
    return CatalogueService.create_catalogue(db, catalogue_data)


@router.get("/catalogues", response_model=List[CatalogueResponse])
def list_catalogues(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """List all catalogues with optional filters"""
    return CatalogueService.list_catalogues(db, is_active, skip, limit)


@router.get("/catalogues/{catalogue_id}", response_model=CatalogueResponse)
def get_catalogue(catalogue_id: int, db: Session = Depends(get_db)):
    """Get a catalogue by ID"""
    return CatalogueService.get_catalogue(db, catalogue_id)


@router.get("/catalogues/slug/{slug}", response_model=CatalogueResponse)
def get_catalogue_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get a catalogue by slug"""
    return CatalogueService.get_catalogue_by_slug(db, slug)


@router.put("/catalogues/{catalogue_id}", response_model=CatalogueResponse)
def update_catalogue(
    catalogue_id: int,
    catalogue_data: CatalogueUpdate,
    db: Session = Depends(get_db)
):
    """Update a catalogue"""
    return CatalogueService.update_catalogue(db, catalogue_id, catalogue_data)


@router.delete("/catalogues/{catalogue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_catalogue(catalogue_id: int, db: Session = Depends(get_db)):
    """Delete a catalogue"""
    CatalogueService.delete_catalogue(db, catalogue_id)
    return None


@router.get("/catalogues/{catalogue_id}/products", response_model=List[ProductResponse])
def get_catalogue_products(catalogue_id: int, db: Session = Depends(get_db)):
    """Get all products (color SKUs) in a catalogue (article/design)"""
    return CatalogueService.get_catalogue_products(db, catalogue_id)


# ========================
# Product Endpoints
# ========================

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new product with variants and options"""
    return ProductService.create_product(db, product_data)


@router.post("/products/bulk", response_model=BulkUploadResponse, status_code=status.HTTP_201_CREATED)
def bulk_upload_products(
    bulk_data: BulkProductUpload,
    db: Session = Depends(get_db)
):
    """Bulk upload multiple products"""
    return ProductService.bulk_upload_products(db, bulk_data)


@router.get("/products", response_model=dict)
def list_products(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    product_type: Optional[ProductType] = Query(None, description="Filter by product type"),
    brand: Optional[str] = Query(None, description="Filter by brand name"),
    gender: Optional[Gender] = Query(None, description="Filter by gender"),
    status: Optional[ProductStatus] = Query(None, description="Filter by status"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price filter"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """List products with filters and pagination"""
    skip = (page - 1) * per_page
    products, total = ProductService.list_products(
        db,
        category_id=category_id,
        product_type=product_type.value if product_type else None,
        brand=brand,
        gender=gender.value if gender else None,
        status=status.value if status else None,
        is_featured=is_featured,
        min_price=min_price,
        max_price=max_price,
        skip=skip,
        limit=per_page
    )

    return {
        "items": products,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a product by ID with all details"""
    return ProductService.get_product(db, product_id)


@router.get("/products/{product_id}/detail", response_model=ProductDetailResponse)
def get_product_detail(product_id: int, db: Session = Depends(get_db)):
    """
    Get a product by ID with all details and color options.
    Color options are ALL products from the same catalogue (article/design).
    Used for PDP color switching.
    """
    product = ProductService.get_product(db, product_id)
    color_options = ProductService.get_color_options(db, product_id)
    
    # Get images for this product from MediaAsset
    from database.db_models import MediaAsset
    media_assets = db.query(MediaAsset).filter(
        MediaAsset.product_id == product_id
    ).order_by(MediaAsset.display_order, MediaAsset.is_primary.desc()).all()
    
    # Extract image URLs
    images = [m.cloudinary_url for m in media_assets if m.cloudinary_url]
    primary_image = next((m.cloudinary_url for m in media_assets if m.is_primary), None)
    if not primary_image and images:
        primary_image = images[0]
    
    # Build response with color options and images
    product_dict = {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "brand": product.brand,
        "category_id": product.category_id,
        "catalogue_id": product.catalogue_id,
        "color": product.color,
        "color_hex": product.color_hex,
        "product_type": product.product_type,
        "price": product.price,
        "mrp": product.mrp,
        "short_description": product.short_description,
        "long_description": product.long_description,
        "gender": product.gender,
        "is_featured": product.is_featured,
        "tags": product.get_tags_list(),
        "status": product.status,
        "meta_title": product.meta_title,
        "meta_description": product.meta_description,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "variants": product.variants,
        "footwear_details": product.footwear_details,
        "color_options": color_options,
        "primary_image_url": primary_image,
        "images": images,
    }
    
    return product_dict


@router.get("/products/slug/{slug}", response_model=ProductResponse)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get a product by slug"""
    return ProductService.get_product_by_slug(db, slug)


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a product"""
    return ProductService.update_product(db, product_id, product_data)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product and all related data"""
    ProductService.delete_product(db, product_id)
    return None


# ========================
# Product Variant Endpoints
# ========================

@router.post("/products/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def create_variant(
    product_id: int,
    variant_data: ProductVariantCreate,
    db: Session = Depends(get_db)
):
    """Create a new variant for a product"""
    return VariantService.create_variant(db, product_id, variant_data)


@router.get("/variants/{variant_id}", response_model=ProductVariantResponse)
def get_variant(variant_id: int, db: Session = Depends(get_db)):
    """Get a variant by ID"""
    return VariantService.get_variant(db, variant_id)


@router.put("/variants/{variant_id}", response_model=ProductVariantResponse)
def update_variant(
    variant_id: int,
    variant_data: ProductVariantUpdate,
    db: Session = Depends(get_db)
):
    """Update a variant"""
    return VariantService.update_variant(db, variant_id, variant_data)


@router.delete("/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variant(variant_id: int, db: Session = Depends(get_db)):
    """Delete a variant"""
    VariantService.delete_variant(db, variant_id)
    return None


# ========================
# Variant Option Endpoints
# ========================

@router.post("/variants/{variant_id}/options", response_model=VariantOptionResponse, status_code=status.HTTP_201_CREATED)
def create_option(
    variant_id: int,
    option_data: VariantOptionCreate,
    db: Session = Depends(get_db)
):
    """Create a new option for a variant"""
    return VariantOptionService.create_option(db, variant_id, option_data)


@router.get("/options/{option_id}", response_model=VariantOptionResponse)
def get_option(option_id: int, db: Session = Depends(get_db)):
    """Get an option by ID"""
    return VariantOptionService.get_option(db, option_id)


@router.put("/options/{option_id}", response_model=VariantOptionResponse)
def update_option(
    option_id: int,
    option_data: VariantOptionUpdate,
    db: Session = Depends(get_db)
):
    """Update an option"""
    return VariantOptionService.update_option(db, option_id, option_data)


@router.patch("/options/{option_id}/stock", response_model=VariantOptionResponse)
def update_stock(
    option_id: int,
    quantity: int = Query(..., ge=0, description="New stock quantity"),
    db: Session = Depends(get_db)
):
    """Update stock quantity for an option"""
    return VariantOptionService.update_stock(db, option_id, quantity)


@router.delete("/options/{option_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_option(option_id: int, db: Session = Depends(get_db)):
    """Delete an option"""
    VariantOptionService.delete_option(db, option_id)
    return None


# ========================
# Media Asset Endpoints
# ========================

@router.post("/media", response_model=MediaAssetResponse, status_code=status.HTTP_201_CREATED)
def create_media(
    media_data: MediaAssetCreate,
    db: Session = Depends(get_db)
):
    """Create a new media asset"""
    return MediaAssetService.create_media(db, media_data)


@router.get("/media/{media_id}", response_model=MediaAssetResponse)
def get_media(media_id: int, db: Session = Depends(get_db)):
    """Get a media asset by ID"""
    return MediaAssetService.get_media(db, media_id)


@router.get("/products/{product_id}/media", response_model=List[MediaAssetResponse])
def list_product_media(product_id: int, db: Session = Depends(get_db)):
    """List all media for a product"""
    return MediaAssetService.list_product_media(db, product_id)


@router.get("/variants/{variant_id}/media", response_model=List[MediaAssetResponse])
def list_variant_media(variant_id: int, db: Session = Depends(get_db)):
    """List all media for a variant"""
    return MediaAssetService.list_variant_media(db, variant_id)


@router.put("/media/{media_id}", response_model=MediaAssetResponse)
def update_media(
    media_id: int,
    media_data: MediaAssetUpdate,
    db: Session = Depends(get_db)
):
    """Update a media asset"""
    return MediaAssetService.update_media(db, media_id, media_data)


@router.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(media_id: int, db: Session = Depends(get_db)):
    """Delete a media asset"""
    MediaAssetService.delete_media(db, media_id)
    return None


@router.patch("/products/{product_id}/media/{media_id}/primary", response_model=MediaAssetResponse)
def set_primary_media(
    product_id: int,
    media_id: int,
    db: Session = Depends(get_db)
):
    """Set a media asset as primary for a product"""
    return MediaAssetService.set_primary_media(db, product_id, media_id)


# ========================
# Optimized Listing Endpoints
# ========================

@router.get("/products/listing", response_model=ProductListingResponse)
def get_product_listing(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    catalogue_id: Optional[int] = Query(None, description="Filter by catalogue ID"),
    product_type: Optional[ProductType] = Query(None, description="Filter by product type"),
    brand: Optional[str] = Query(None, description="Filter by brand name"),
    gender: Optional[Gender] = Query(None, description="Filter by gender"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated, e.g., 'new,trending')"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price filter"),
    in_stock_only: bool = Query(False, description="Only show in-stock products"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Optimized product listing endpoint with pre-joined primary image.

    This endpoint is optimized for:
    - Homepage product grids
    - Catalogue/category pages
    - Infinite scroll listings
    - Search results

    Available tags: new, trending, featured, bestseller, sale, hot, limited, exclusive, popular, seasonal, clearance
    
    Returns product data with primary_image_url pre-joined to avoid N+1 queries.
    """
    skip = (page - 1) * per_page
    items, total, filters_applied = ProductListingService.get_product_listing(
        db,
        category_id=category_id,
        catalogue_id=catalogue_id,
        product_type=product_type.value if product_type else None,
        brand=brand,
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


# ========================
# Availability Endpoints
# ========================

@router.get("/products/{product_id}/availability", response_model=ProductAvailabilityResponse)
def get_product_availability(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Get complete availability information for a product.

    Returns:
    - Overall product availability status
    - Total stock across all variants
    - Per-variant breakdown with:
        - Stock status
        - Available sizes
        - Primary image URL

    This is critical for Buy Now UX.
    """
    result = AvailabilityService.get_product_availability(db, product_id)
    return ProductAvailabilityResponse(**result)


# ========================
# Media Grouped Endpoint
# ========================

@router.get("/products/{product_id}/media/grouped", response_model=MediaGroupedResponse)
def get_product_media_grouped(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all media for a product grouped by usage type.

    Returns:
    - catalogue: Product page images
    - lifestyle: Real-world shots
    - banner: Promotional banners
    """
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


@router.get("/variants/{variant_id}/media/grouped", response_model=MediaGroupedResponse)
def get_variant_media_grouped(
    variant_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all media for a variant grouped by usage type.
    """
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


# ========================
# Soft Delete Endpoints
# ========================

@router.delete("/products/{product_id}/soft", response_model=ProductResponse)
def soft_delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Soft delete a product.

    The product is marked as deleted but not removed from database.
    Can be restored later using the restore endpoint.
    """
    return SoftDeleteService.soft_delete_product(db, product_id)


@router.post("/products/{product_id}/restore", response_model=ProductResponse)
def restore_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Restore a soft-deleted product.

    The product is restored to draft status.
    """
    return SoftDeleteService.restore_product(db, product_id)


@router.delete("/categories/{category_id}/soft", response_model=CategoryResponse)
def soft_delete_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """
    Soft delete a category.

    Cannot delete if category has active products.
    """
    return SoftDeleteService.soft_delete_category(db, category_id)


@router.delete("/catalogues/{catalogue_id}/soft", response_model=CatalogueResponse)
def soft_delete_catalogue(
    catalogue_id: int,
    db: Session = Depends(get_db)
):
    """
    Soft delete a catalogue.

    Products remain but are no longer associated with this catalogue.
    """
    return SoftDeleteService.soft_delete_catalogue(db, catalogue_id)


