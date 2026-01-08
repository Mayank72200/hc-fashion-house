"""
Catalogue Router Admin - Admin CRUD operations for catalogue management
Updated for new schema:
- Platform → Category → Catalogue (with gender) → Product (Color SKU) → Variant → Option

All state-changing operations: Create, Update, Delete, Bulk, Soft delete
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.catalogue_models import (
    # Platform models
    PlatformCreate, PlatformUpdate, PlatformResponse,
    # Brand models
    BrandCreate, BrandUpdate, BrandResponse,
    # Category models
    CategoryCreate, CategoryUpdate, CategoryResponse,
    # Catalogue models
    CatalogueCreate, CatalogueUpdate, CatalogueResponse,
    # Product models
    ProductCreate, ProductUpdate, ProductResponse,
    BulkProductUpload, BulkUploadResponse,
    # Variant models
    ProductVariantCreate, ProductVariantUpdate, ProductVariantResponse,
    # Option models
    VariantOptionCreate, VariantOptionUpdate, VariantOptionResponse,
    # Media models
    MediaAssetCreate, MediaAssetUpdate, MediaAssetResponse,
    # Enums
    ProductStatus, Gender
)
from services.catalogue_service import (
    PlatformService, BrandService, CategoryService, CatalogueService, ProductService,
    VariantService, VariantOptionService, MediaAssetService,
    SoftDeleteService, product_to_dict, platform_to_dict, brand_to_dict, category_to_dict, catalogue_to_dict
)

router = APIRouter(prefix="/catalogue", tags=["Catalogue Admin"])


# ========================
# Platform Admin Endpoints
# ========================

@router.get("/platforms", response_model=List[PlatformResponse])
def list_platforms(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """List all platforms (Footwear, Clothing, etc.)"""
    platforms = PlatformService.list_platforms(db, is_active, skip, limit)
    return [platform_to_dict(p) for p in platforms]


@router.get("/platforms/{platform_id}", response_model=PlatformResponse)
def get_platform(platform_id: int, db: Session = Depends(get_db)):
    """Get a platform by ID"""
    platform = PlatformService.get_platform(db, platform_id)
    return platform_to_dict(platform)


@router.post("/platforms", response_model=PlatformResponse, status_code=status.HTTP_201_CREATED)
def create_platform(
    platform_data: PlatformCreate,
    db: Session = Depends(get_db)
):
    """Create a new platform"""
    platform = PlatformService.create_platform(db, platform_data)
    return platform_to_dict(platform)


@router.put("/platforms/{platform_id}", response_model=PlatformResponse)
def update_platform(
    platform_id: int,
    platform_data: PlatformUpdate,
    db: Session = Depends(get_db)
):
    """Update a platform"""
    platform = PlatformService.update_platform(db, platform_id, platform_data)
    return platform_to_dict(platform)


@router.delete("/platforms/{platform_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_platform(platform_id: int, db: Session = Depends(get_db)):
    """Delete a platform (must have no categories)"""
    PlatformService.delete_platform(db, platform_id)
    return None


# ========================
# Brand Admin Endpoints
# ========================

@router.get("/brands", response_model=List[BrandResponse])
def list_brands(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by brand name"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """List all brands"""
    brands = BrandService.list_brands(db, is_active, search, skip, limit)
    return [brand_to_dict(b) for b in brands]


@router.get("/brands/{brand_id}", response_model=BrandResponse)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    """Get a brand by ID"""
    brand = BrandService.get_brand(db, brand_id)
    return brand_to_dict(brand)


@router.post("/brands", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
def create_brand(
    brand_data: BrandCreate,
    db: Session = Depends(get_db)
):
    """Create a new brand"""
    brand = BrandService.create_brand(db, brand_data)
    return brand_to_dict(brand)


@router.put("/brands/{brand_id}", response_model=BrandResponse)
def update_brand(
    brand_id: int,
    brand_data: BrandUpdate,
    db: Session = Depends(get_db)
):
    """Update a brand"""
    brand = BrandService.update_brand(db, brand_id, brand_data)
    return brand_to_dict(brand)


@router.delete("/brands/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    """Delete a brand (must have no products)"""
    BrandService.delete_brand(db, brand_id)
    return None


# ========================
# Category Admin Endpoints (linked to Platform)
# ========================

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    platform_id: Optional[int] = Query(None, description="Filter by platform ID"),
    parent_id: Optional[int] = Query(None, description="Filter by parent category ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """List all categories with optional filters (Admin)"""
    categories = CategoryService.list_categories(db, platform_id, parent_id, is_active, skip, limit)
    return [category_to_dict(c) for c in categories]


@router.get("/categories/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a category by ID"""
    category = CategoryService.get_category(db, category_id)
    return category_to_dict(category)


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new category (must specify platform_id)"""
    category = CategoryService.create_category(db, category_data)
    return category_to_dict(category)


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category"""
    category = CategoryService.update_category(db, category_id, category_data)
    return category_to_dict(category)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category (must have no catalogues or children)"""
    CategoryService.delete_category(db, category_id)
    return None


# ========================
# Catalogue Admin Endpoints (Catalogue = Article/Design, now with gender)
# ========================

@router.get("/catalogues", response_model=List[CatalogueResponse])
def list_catalogues(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    gender: Optional[Gender] = Query(None, description="Filter by gender"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """List all catalogues (article/designs) with optional filters (Admin)"""
    catalogues = CatalogueService.list_catalogues(
        db, is_active, category_id, 
        gender.value if gender else None, 
        skip, limit
    )
    return [catalogue_to_dict(c) for c in catalogues]


@router.get("/catalogues/{catalogue_id}", response_model=CatalogueResponse)
def get_catalogue(catalogue_id: int, db: Session = Depends(get_db)):
    """Get a catalogue by ID"""
    catalogue = CatalogueService.get_catalogue(db, catalogue_id)
    return catalogue_to_dict(catalogue)


@router.post("/catalogues", response_model=CatalogueResponse, status_code=status.HTTP_201_CREATED)
def create_catalogue(
    catalogue_data: CatalogueCreate,
    db: Session = Depends(get_db)
):
    """Create a new catalogue (article/design) with gender"""
    catalogue = CatalogueService.create_catalogue(db, catalogue_data)
    return catalogue_to_dict(catalogue)


@router.put("/catalogues/{catalogue_id}", response_model=CatalogueResponse)
def update_catalogue(
    catalogue_id: int,
    catalogue_data: CatalogueUpdate,
    db: Session = Depends(get_db)
):
    """Update a catalogue (article/design)"""
    catalogue = CatalogueService.update_catalogue(db, catalogue_id, catalogue_data)
    return catalogue_to_dict(catalogue)


@router.delete("/catalogues/{catalogue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_catalogue(catalogue_id: int, db: Session = Depends(get_db)):
    """Delete a catalogue (must have no products)"""
    CatalogueService.delete_catalogue(db, catalogue_id)
    return None


@router.get("/catalogues/{catalogue_id}/products", response_model=List[ProductResponse])
def get_catalogue_products(catalogue_id: int, db: Session = Depends(get_db)):
    """Get all products (color SKUs) in a catalogue"""
    products = CatalogueService.get_catalogue_products(db, catalogue_id)
    return [product_to_dict(p) for p in products]


# ========================
# Product Admin Endpoints (Product = Color SKU, inherits gender from Catalogue)
# ========================

@router.get("/products", response_model=dict)
def list_products(
    catalogue_id: Optional[int] = Query(None, description="Filter by catalogue (article/design) ID"),
    brand_id: Optional[int] = Query(None, description="Filter by brand ID"),
    gender: Optional[Gender] = Query(None, description="Filter by gender (from catalogue)"),
    platform_slug: Optional[str] = Query(None, description="Filter by platform slug (footwear, clothing, etc.)"),
    product_status: Optional[ProductStatus] = Query(None, alias="status", description="Filter by status"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price filter"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """List products (color SKUs) with filters and pagination (Admin)"""
    skip = (page - 1) * per_page
    products, total = ProductService.list_products(
        db,
        catalogue_id=catalogue_id,
        brand_id=brand_id,
        gender=gender.value if gender else None,
        platform_slug=platform_slug,
        status=product_status.value if product_status else None,
        is_featured=is_featured,
        min_price=min_price,
        max_price=max_price,
        skip=skip,
        limit=per_page
    )

    return {
        "items": [product_to_dict(p) for p in products],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a product by ID"""
    product = ProductService.get_product(db, product_id)
    return product_to_dict(product)


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new product (color SKU) with variants.
    catalogue_id is REQUIRED - gender is inherited from the catalogue.
    """
    product = ProductService.create_product(db, product_data)
    return product_to_dict(product)


@router.post("/products/bulk", response_model=BulkUploadResponse, status_code=status.HTTP_201_CREATED)
def bulk_upload_products(
    bulk_data: BulkProductUpload,
    db: Session = Depends(get_db)
):
    """Bulk upload multiple products"""
    return ProductService.bulk_upload_products(db, bulk_data)


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a product"""
    product = ProductService.update_product(db, product_id, product_data)
    return product_to_dict(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Hard delete a product and all related data"""
    ProductService.delete_product(db, product_id)
    return None


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
    product = SoftDeleteService.soft_delete_product(db, product_id)
    return product_to_dict(product)


@router.post("/products/{product_id}/restore", response_model=ProductResponse)
def restore_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Restore a soft-deleted product.
    The product is restored to draft status.
    """
    product = SoftDeleteService.restore_product(db, product_id)
    return product_to_dict(product)


# ========================
# Variant Admin Endpoints (Size variants - color is at Product level)
# ========================

@router.get("/products/{product_id}/variants", response_model=List[ProductVariantResponse])
def list_product_variants(product_id: int, db: Session = Depends(get_db)):
    """Get all variants for a product"""
    product = ProductService.get_product(db, product_id)
    return product.variants


@router.post("/products/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def create_variant(
    product_id: int,
    variant_data: ProductVariantCreate,
    db: Session = Depends(get_db)
):
    """Create a new size variant for a product"""
    return VariantService.create_variant(db, product_id, variant_data)


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
# Option Admin Endpoints (additional variant options)
# ========================

@router.post("/variants/{variant_id}/options", response_model=VariantOptionResponse, status_code=status.HTTP_201_CREATED)
def create_option(
    variant_id: int,
    option_data: VariantOptionCreate,
    db: Session = Depends(get_db)
):
    """Create a new option for a variant"""
    return VariantOptionService.create_option(db, variant_id, option_data)


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
# Media Admin Endpoints
# ========================

@router.post("/media", response_model=MediaAssetResponse, status_code=status.HTTP_201_CREATED)
def create_media(
    media_data: MediaAssetCreate,
    db: Session = Depends(get_db)
):
    """Create a new media asset record"""
    return MediaAssetService.create_media(db, media_data)


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

