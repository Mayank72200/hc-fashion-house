"""
Catalogue Service - Business logic for catalogue operations
Updated for new schema:
- Platform → Category → Catalogue (with gender) → Product (Color SKU) → Variant → Option
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from database.db_models import (
    Platform, Brand, Category, Catalogue, Product,
    ProductVariant, VariantOption, MediaAsset, FootwearDetails
)
from models.catalogue_models import (
    PlatformCreate, PlatformUpdate,
    BrandCreate, BrandUpdate,
    CategoryCreate, CategoryUpdate,
    CatalogueCreate, CatalogueUpdate,
    ProductCreate, ProductUpdate,
    ProductVariantCreate, ProductVariantUpdate,
    VariantOptionCreate, VariantOptionUpdate,
    MediaAssetCreate, MediaAssetUpdate,
    BulkProductUpload,
    generate_slug,
    ColorOption,
    ProductStatus, Gender
)

import re

# ========================
# Color Normalization Helper
# ========================

def normalize_color(color: str) -> str:
    """
    Normalize color string for filtering.
    Input formats: "White-Skyblue", "White/SkyBlue", "WHITE SKYBLUE"
    Output format: "white-skyblue" (lowercase, hyphen-separated)
    """
    if not color:
        return None
    # Replace common separators with hyphen
    normalized = re.sub(r'[\s/\\|,]+', '-', color.strip())
    # Remove consecutive hyphens
    normalized = re.sub(r'-+', '-', normalized)
    # Lowercase and strip leading/trailing hyphens
    normalized = normalized.lower().strip('-')
    return normalized


# ========================
# Helper Functions to Convert SQLAlchemy to Dict
# ========================

def platform_to_dict(platform: Platform) -> dict:
    """Convert SQLAlchemy Platform model to dictionary"""
    return {
        "id": platform.id,
        "name": platform.name,
        "slug": platform.slug,
        "is_active": platform.is_active,
        "created_at": platform.created_at,
    }


def brand_to_dict(brand: Brand) -> dict:
    """Convert SQLAlchemy Brand model to dictionary"""
    return {
        "id": brand.id,
        "name": brand.name,
        "slug": brand.slug,
        "logo_cloudinary_url": brand.logo_cloudinary_url,
        "logo_folder_path": brand.logo_folder_path,
        "logo_public_id": brand.logo_public_id,
        "logo_width": brand.logo_width,
        "logo_height": brand.logo_height,
        "is_active": brand.is_active,
        "created_at": brand.created_at,
    }


def category_to_dict(category: Category) -> dict:
    """Convert SQLAlchemy Category model to dictionary"""
    return {
        "id": category.id,
        "name": category.name,
        "slug": category.slug,
        "platform_id": category.platform_id,
        "parent_id": category.parent_id,
        "is_active": category.is_active,
        "created_at": category.created_at,
    }


def catalogue_to_dict(catalogue: Catalogue) -> dict:
    """Convert SQLAlchemy Catalogue model to dictionary"""
    return {
        "id": catalogue.id,
        "name": catalogue.name,
        "slug": catalogue.slug,
        "description": catalogue.description,
        "category_id": catalogue.category_id,
        "gender": Gender(catalogue.gender) if catalogue.gender else Gender.UNISEX,
        "banner_media_id": catalogue.banner_media_id,
        "is_active": catalogue.is_active,
        "created_at": catalogue.created_at,
    }


def product_to_dict(product: Product) -> dict:
    """Convert SQLAlchemy Product model to dictionary for Pydantic serialization"""
    # Get gender from catalogue relationship
    gender = None
    platform_slug = None
    catalogue_name = None
    if product.catalogue:
        gender = product.catalogue.gender
        catalogue_name = product.catalogue.name
        if product.catalogue.category and product.catalogue.category.platform:
            platform_slug = product.catalogue.category.platform.slug
    
    # Get media assets
    media = []
    if hasattr(product, 'media_assets') and product.media_assets:
        for m in product.media_assets:
            media.append({
                "id": m.id,
                "media_url": m.cloudinary_url,  # Use cloudinary_url from model
                "media_type": m.media_type,
                "is_primary": m.is_primary,
                "display_order": m.display_order,
                "usage_type": m.usage_type,
            })
    
    # Get category IDs and full category objects for display
    category_ids = [cat.id for cat in product.categories] if product.categories else []
    categories_list = [{"id": cat.id, "name": cat.name, "slug": cat.slug} for cat in product.categories] if product.categories else []
    
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "catalogue_id": product.catalogue_id,
        "catalogue_name": catalogue_name,  # Add catalogue name for display
        "brand_id": product.brand_id,
        "brand": brand_to_dict(product.brand) if product.brand else None,
        "category_ids": category_ids,  # Multiple categories (IDs only)
        "categories": categories_list,  # Full category objects with id, name, slug
        "color": product.color,
        "color_hex": product.color_hex,
        "color_normalized": product.color_normalized,
        "price": product.price,  # Selling price (what customer pays)
        "mrp": product.mrp,      # Maximum Retail Price (original price)
        "short_description": product.short_description,
        "long_description": product.long_description,
        "specifications": product.specifications,
        "is_featured": product.is_featured or False,
        "tags": product.get_tags_list() if hasattr(product, 'get_tags_list') else [],
        "status": ProductStatus(product.status) if product.status else ProductStatus.DRAFT,
        "meta_title": product.meta_title,
        "meta_description": product.meta_description,
        "is_active": True,  # Not in DB yet, default to True
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "variants": [variant_to_dict(v) for v in (product.variants or [])],
        "media": media,  # Add media for images
        "footwear_details": footwear_to_dict(product.footwear_details) if product.footwear_details else None,
        # Inherited from catalogue
        "gender": Gender(gender) if gender else None,
        "platform_slug": platform_slug,
    }


def variant_to_dict(variant: ProductVariant) -> dict:
    """Convert SQLAlchemy ProductVariant model to dictionary"""
    # Calculate total stock from options
    total_stock = sum(opt.stock_quantity or 0 for opt in (variant.options or []))
    # Get size from variant_name or from options
    size = variant.variant_name
    if not size and variant.options:
        size_option = next((o for o in variant.options if o.option_name == 'size'), None)
        if size_option:
            size = size_option.option_value
    
    return {
        "id": variant.id,
        "product_id": variant.product_id,
        "sku": variant.sku,
        "size": size,
        "stock_quantity": total_stock,
        "price_override": variant.price_override,
        "mrp_override": variant.mrp_override,
        "is_active": variant.is_active,
        "created_at": variant.created_at,
        "options": [option_to_dict(o) for o in (variant.options or [])],
    }


def option_to_dict(option: VariantOption) -> dict:
    """Convert SQLAlchemy VariantOption model to dictionary"""
    return {
        "id": option.id,
        "variant_id": option.variant_id,
        "option_name": option.option_name,
        "option_value": option.option_value,
        "stock_quantity": option.stock_quantity,
        "is_available": option.is_available,
    }


def footwear_to_dict(footwear: FootwearDetails) -> dict:
    """Convert SQLAlchemy FootwearDetails model to dictionary"""
    if not footwear:
        return None
    return {
        "product_id": footwear.product_id,
        "upper_material": footwear.upper_material,
        "sole_material": footwear.sole_material,
        "closure_type": footwear.closure_type,
        "toe_shape": footwear.toe_shape,
        "heel_height_mm": footwear.heel_height_mm,
        "weight_grams": footwear.weight_grams,
        "size_chart_type": footwear.size_chart_type,
    }


# ========================
# Platform Service
# ========================

class PlatformService:
    """Service for platform operations (Footwear, Clothing, etc.)"""

    @staticmethod
    def create_platform(db: Session, platform_data: PlatformCreate) -> Platform:
        """Create a new platform"""
        slug = platform_data.slug or generate_slug(platform_data.name)

        existing = db.query(Platform).filter(Platform.slug == slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Platform with slug '{slug}' already exists"
            )

        platform = Platform(
            name=platform_data.name,
            slug=slug,
            is_active=platform_data.is_active
        )
        db.add(platform)
        db.commit()
        db.refresh(platform)
        return platform

    @staticmethod
    def get_platform(db: Session, platform_id: int) -> Platform:
        """Get a platform by ID"""
        platform = db.query(Platform).filter(Platform.id == platform_id).first()
        if not platform:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Platform with ID {platform_id} not found"
            )
        return platform

    @staticmethod
    def get_platform_by_slug(db: Session, slug: str) -> Platform:
        """Get a platform by slug"""
        platform = db.query(Platform).filter(Platform.slug == slug).first()
        if not platform:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Platform with slug '{slug}' not found"
            )
        return platform

    @staticmethod
    def list_platforms(
        db: Session,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Platform]:
        """List platforms with optional filters"""
        query = db.query(Platform)

        if is_active is not None:
            query = query.filter(Platform.is_active == is_active)

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_platform(db: Session, platform_id: int, platform_data: PlatformUpdate) -> Platform:
        """Update a platform"""
        platform = PlatformService.get_platform(db, platform_id)

        update_data = platform_data.model_dump(exclude_unset=True)

        if 'slug' in update_data and update_data['slug']:
            existing = db.query(Platform).filter(
                Platform.slug == update_data['slug'],
                Platform.id != platform_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Platform with slug '{update_data['slug']}' already exists"
                )

        for key, value in update_data.items():
            setattr(platform, key, value)

        db.commit()
        db.refresh(platform)
        return platform

    @staticmethod
    def delete_platform(db: Session, platform_id: int) -> bool:
        """Delete a platform"""
        platform = PlatformService.get_platform(db, platform_id)

        # Check if platform has categories
        categories = db.query(Category).filter(Category.platform_id == platform_id).first()
        if categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete platform with associated categories"
            )

        db.delete(platform)
        db.commit()
        return True


# ========================
# Brand Service
# ========================

class BrandService:
    """Service for brand operations"""

    @staticmethod
    def create_brand(db: Session, brand_data: BrandCreate) -> Brand:
        """Create a new brand"""
        slug = brand_data.slug or generate_slug(brand_data.name)

        existing = db.query(Brand).filter(Brand.slug == slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Brand with slug '{slug}' already exists"
            )

        brand = Brand(
            name=brand_data.name,
            slug=slug,
            logo_cloudinary_url=brand_data.logo_cloudinary_url,
            logo_folder_path=brand_data.logo_folder_path,
            logo_public_id=brand_data.logo_public_id,
            logo_width=brand_data.logo_width,
            logo_height=brand_data.logo_height,
            is_active=brand_data.is_active
        )
        db.add(brand)
        db.commit()
        db.refresh(brand)
        return brand

    @staticmethod
    def get_brand(db: Session, brand_id: int) -> Brand:
        """Get a brand by ID"""
        brand = db.query(Brand).filter(Brand.id == brand_id).first()
        if not brand:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Brand with ID {brand_id} not found"
            )
        return brand

    @staticmethod
    def get_brand_by_slug(db: Session, slug: str) -> Brand:
        """Get a brand by slug"""
        brand = db.query(Brand).filter(Brand.slug == slug).first()
        if not brand:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Brand with slug '{slug}' not found"
            )
        return brand

    @staticmethod
    def list_brands(
        db: Session,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Brand]:
        """List brands with optional filters"""
        query = db.query(Brand)

        if is_active is not None:
            query = query.filter(Brand.is_active == is_active)
        
        if search:
            query = query.filter(Brand.name.ilike(f"%{search}%"))

        return query.order_by(Brand.name).offset(skip).limit(limit).all()

    @staticmethod
    def update_brand(db: Session, brand_id: int, brand_data: BrandUpdate) -> Brand:
        """Update a brand"""
        brand = BrandService.get_brand(db, brand_id)

        update_data = brand_data.model_dump(exclude_unset=True)

        if 'slug' in update_data and update_data['slug']:
            existing = db.query(Brand).filter(
                Brand.slug == update_data['slug'],
                Brand.id != brand_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Brand with slug '{update_data['slug']}' already exists"
                )

        for key, value in update_data.items():
            setattr(brand, key, value)

        db.commit()
        db.refresh(brand)
        return brand

    @staticmethod
    def delete_brand(db: Session, brand_id: int) -> bool:
        """Delete a brand"""
        brand = BrandService.get_brand(db, brand_id)

        # Check if brand has products
        products = db.query(Product).filter(Product.brand_id == brand_id).first()
        if products:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete brand with associated products"
            )

        db.delete(brand)
        db.commit()
        return True


# ========================
# Category Service
# ========================

class CategoryService:
    """Service for category operations (linked to Platform)"""

    @staticmethod
    def create_category(db: Session, category_data: CategoryCreate) -> Category:
        """Create a new category"""
        slug = category_data.slug or generate_slug(category_data.name)

        existing = db.query(Category).filter(Category.slug == slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with slug '{slug}' already exists"
            )

        # Verify platform exists
        platform = db.query(Platform).filter(Platform.id == category_data.platform_id).first()
        if not platform:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Platform with ID {category_data.platform_id} not found"
            )

        # Validate parent exists if provided
        if category_data.parent_id:
            parent = db.query(Category).filter(Category.id == category_data.parent_id).first()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Parent category with ID {category_data.parent_id} not found"
                )

        category = Category(
            name=category_data.name,
            slug=slug,
            platform_id=category_data.platform_id,
            parent_id=category_data.parent_id,
            is_active=category_data.is_active
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def get_category(db: Session, category_id: int) -> Category:
        """Get a category by ID"""
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {category_id} not found"
            )
        return category

    @staticmethod
    def get_category_by_slug(db: Session, slug: str) -> Category:
        """Get a category by slug"""
        category = db.query(Category).filter(Category.slug == slug).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with slug '{slug}' not found"
            )
        return category

    @staticmethod
    def list_categories(
        db: Session,
        platform_id: Optional[int] = None,
        parent_id: Optional[int] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Category]:
        """List categories with optional filters"""
        query = db.query(Category)

        if platform_id is not None:
            query = query.filter(Category.platform_id == platform_id)
        if parent_id is not None:
            query = query.filter(Category.parent_id == parent_id)
        if is_active is not None:
            query = query.filter(Category.is_active == is_active)

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_root_categories(db: Session, platform_id: Optional[int] = None) -> List[Category]:
        """Get all root categories (no parent)"""
        query = db.query(Category).filter(Category.parent_id.is_(None))
        if platform_id is not None:
            query = query.filter(Category.platform_id == platform_id)
        return query.all()

    @staticmethod
    def update_category(db: Session, category_id: int, category_data: CategoryUpdate) -> Category:
        """Update a category"""
        category = CategoryService.get_category(db, category_id)

        update_data = category_data.model_dump(exclude_unset=True)

        if 'slug' in update_data and update_data['slug']:
            existing = db.query(Category).filter(
                Category.slug == update_data['slug'],
                Category.id != category_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Category with slug '{update_data['slug']}' already exists"
                )

        # Validate platform if provided
        if 'platform_id' in update_data and update_data['platform_id']:
            platform = db.query(Platform).filter(Platform.id == update_data['platform_id']).first()
            if not platform:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Platform with ID {update_data['platform_id']} not found"
                )

        for key, value in update_data.items():
            setattr(category, key, value)

        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete_category(db: Session, category_id: int) -> bool:
        """Delete a category"""
        category = CategoryService.get_category(db, category_id)

        # Check if category has children
        children = db.query(Category).filter(Category.parent_id == category_id).first()
        if children:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete category with child categories"
            )

        # Check if category has catalogues
        catalogues = db.query(Catalogue).filter(Catalogue.category_id == category_id).first()
        if catalogues:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete category with associated catalogues"
            )

        db.delete(category)
        db.commit()
        return True


# ========================
# Catalogue Service
# ========================

class CatalogueService:
    """Service for catalogue (article/design) operations - now with gender"""

    @staticmethod
    def create_catalogue(db: Session, catalogue_data: CatalogueCreate) -> Catalogue:
        """Create a new catalogue (article/design)"""
        slug = catalogue_data.slug or generate_slug(catalogue_data.name)

        existing = db.query(Catalogue).filter(Catalogue.slug == slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Catalogue with slug '{slug}' already exists"
            )

        # Validate category
        category = db.query(Category).filter(Category.id == catalogue_data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {catalogue_data.category_id} not found"
            )

        catalogue = Catalogue(
            name=catalogue_data.name,
            slug=slug,
            description=catalogue_data.description,
            category_id=catalogue_data.category_id,
            gender=catalogue_data.gender.value if catalogue_data.gender else "unisex",
            banner_media_id=catalogue_data.banner_media_id,
            is_active=catalogue_data.is_active
        )
        db.add(catalogue)
        db.commit()
        db.refresh(catalogue)
        return catalogue

    @staticmethod
    def get_catalogue(db: Session, catalogue_id: int) -> Catalogue:
        """Get a catalogue by ID"""
        catalogue = db.query(Catalogue).filter(Catalogue.id == catalogue_id).first()
        if not catalogue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Catalogue with ID {catalogue_id} not found"
            )
        return catalogue

    @staticmethod
    def get_catalogue_by_slug(db: Session, slug: str) -> Catalogue:
        """Get a catalogue by slug"""
        catalogue = db.query(Catalogue).filter(Catalogue.slug == slug).first()
        if not catalogue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Catalogue with slug '{slug}' not found"
            )
        return catalogue

    @staticmethod
    def list_catalogues(
        db: Session,
        is_active: Optional[bool] = None,
        category_id: Optional[int] = None,
        gender: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Catalogue]:
        """List catalogues with optional filters"""
        query = db.query(Catalogue)

        if is_active is not None:
            query = query.filter(Catalogue.is_active == is_active)
        if category_id is not None:
            query = query.filter(Catalogue.category_id == category_id)
        if gender:
            query = query.filter(Catalogue.gender == gender)

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_catalogue(db: Session, catalogue_id: int, catalogue_data: CatalogueUpdate) -> Catalogue:
        """Update a catalogue"""
        catalogue = CatalogueService.get_catalogue(db, catalogue_id)

        update_data = catalogue_data.model_dump(exclude_unset=True)

        if 'slug' in update_data and update_data['slug']:
            existing = db.query(Catalogue).filter(
                Catalogue.slug == update_data['slug'],
                Catalogue.id != catalogue_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Catalogue with slug '{update_data['slug']}' already exists"
                )

        # Validate category if provided
        if 'category_id' in update_data and update_data['category_id']:
            category = db.query(Category).filter(Category.id == update_data['category_id']).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Category with ID {update_data['category_id']} not found"
                )

        # Handle gender enum
        if 'gender' in update_data and update_data['gender']:
            update_data['gender'] = update_data['gender'].value

        for key, value in update_data.items():
            setattr(catalogue, key, value)

        db.commit()
        db.refresh(catalogue)
        return catalogue

    @staticmethod
    def delete_catalogue(db: Session, catalogue_id: int) -> bool:
        """
        Delete a catalogue and cascade delete all associated products.
        This will also cascade delete:
        - All products in the catalogue
        - All variants of those products
        - All media assets of those products
        - All footwear details of those products
        """
        catalogue = CatalogueService.get_catalogue(db, catalogue_id)

        # Cascade delete happens automatically via SQLAlchemy relationship
        # Thanks to cascade="all, delete-orphan" on Catalogue.products
        db.delete(catalogue)
        db.commit()
        return True

    @staticmethod
    def get_catalogue_products(db: Session, catalogue_id: int) -> List[Product]:
        """Get all products (color SKUs) in a catalogue"""
        CatalogueService.get_catalogue(db, catalogue_id)
        return db.query(Product).filter(Product.catalogue_id == catalogue_id).all()


# ========================
# Product Service
# ========================

class ProductService:
    """Service for product operations - Product = Color SKU"""

    @staticmethod
    def create_product(db: Session, product_data: ProductCreate) -> Product:
        """
        Create a new product (color SKU) with variants and options.
        catalogue_id is REQUIRED.
        Products can belong to multiple categories.
        """
        print(f"[DEBUG] Creating product: {product_data.name}")
        print(f"[DEBUG] catalogue_id: {product_data.catalogue_id}, brand_id: {product_data.brand_id}")
        print(f"[DEBUG] category_ids: {product_data.category_ids}")
        
        slug = product_data.slug or generate_slug(product_data.name)
        print(f"[DEBUG] Generated slug: {slug}")

        # Check if slug already exists
        existing = db.query(Product).filter(Product.slug == slug).first()
        if existing:
            print(f"[DEBUG] Slug already exists: {slug}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with slug '{slug}' already exists"
            )

        # Verify catalogue exists (required)
        catalogue = db.query(Catalogue).filter(Catalogue.id == product_data.catalogue_id).first()
        if not catalogue:
            print(f"[DEBUG] Catalogue not found: {product_data.catalogue_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Catalogue with ID {product_data.catalogue_id} not found"
            )

        # If no categories provided, use catalogue's category
        category_ids = product_data.category_ids or []
        if not category_ids and catalogue.category_id:
            category_ids = [catalogue.category_id]
        
        if not category_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product must have at least one category"
            )

        # Verify all categories exist
        categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
        if len(categories) != len(category_ids):
            found_ids = {cat.id for cat in categories}
            missing_ids = set(category_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categories not found: {missing_ids}"
            )

        # Verify brand if provided
        if product_data.brand_id:
            brand = db.query(Brand).filter(Brand.id == product_data.brand_id).first()
            if not brand:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Brand with ID {product_data.brand_id} not found"
                )

        # Wrap entire creation in try-except for full transaction rollback
        try:
            # Normalize color for filtering
            color_normalized = normalize_color(product_data.color) if product_data.color else None
            
            # Create product
            product = Product(
                name=product_data.name,
                slug=slug,
                catalogue_id=product_data.catalogue_id,
                brand_id=product_data.brand_id,
                color=product_data.color,
                color_hex=product_data.color_hex,
                color_normalized=color_normalized,
                price=product_data.price or product_data.mrp,
                mrp=product_data.mrp,
                short_description=product_data.short_description,
                long_description=product_data.long_description,
                is_featured=product_data.is_featured or ('featured' in product_data.tags),
                tags=','.join(product_data.tags) if product_data.tags else None,
                status=product_data.status.value,
                meta_title=product_data.meta_title,
                meta_description=product_data.meta_description,
            )
            db.add(product)
            db.flush()  # Get product ID without committing
            
            # Associate product with categories
            product.categories = categories
            db.flush()

            # Create variants (sizes)
            for variant_data in product_data.variants:
                variant = ProductVariant(
                    product_id=product.id,
                    sku=variant_data.sku,
                    variant_name=variant_data.size,
                    price_override=variant_data.price_override,
                    mrp_override=variant_data.mrp_override,
                    is_active=variant_data.is_active
                )
                db.add(variant)
                db.flush()

                # Create a size option with stock quantity
                if variant_data.size:
                    size_option = VariantOption(
                        variant_id=variant.id,
                        option_name="size",
                        option_value=str(variant_data.size),
                        stock_quantity=variant_data.stock_quantity,
                        is_available=variant_data.stock_quantity > 0
                    )
                    db.add(size_option)

                # Create additional options if provided
                for option_data in variant_data.options:
                    option = VariantOption(
                        variant_id=variant.id,
                        option_name=option_data.option_name,
                        option_value=option_data.option_value,
                        stock_quantity=option_data.stock_quantity,
                        is_available=option_data.is_available
                    )
                    db.add(option)

            # Create footwear details if provided
            if product_data.footwear_details:
                footwear = FootwearDetails(
                    product_id=product.id,
                    **product_data.footwear_details.model_dump()
                )
                db.add(footwear)

            db.commit()
            db.refresh(product)
            print(f"[DEBUG] Product created successfully: {product.id}")
            return product
            
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            print(f"[DEBUG] Transaction rollback due to error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create product: {str(e)}"
            )

    @staticmethod
    def get_product(db: Session, product_id: int) -> Product:
        """Get a product by ID with all related data"""
        product = db.query(Product).options(
            joinedload(Product.categories)
        ).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )
        return product

    @staticmethod
    def get_product_by_slug(db: Session, slug: str) -> Product:
        """Get a product by slug"""
        product = db.query(Product).filter(Product.slug == slug).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with slug '{slug}' not found"
            )
        return product

    @staticmethod
    def list_products(
        db: Session,
        catalogue_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        gender: Optional[str] = None,
        platform_slug: Optional[str] = None,
        status: Optional[str] = None,
        is_featured: Optional[bool] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Product], int]:
        """List products with filters and pagination"""
        query = db.query(Product).options(
            joinedload(Product.catalogue),
            joinedload(Product.brand)
        )

        if catalogue_id is not None:
            query = query.filter(Product.catalogue_id == catalogue_id)
        
        if brand_id is not None:
            query = query.filter(Product.brand_id == brand_id)
        
        # Filter by gender (from catalogue)
        if gender:
            query = query.join(Catalogue).filter(Catalogue.gender == gender)
        
        # Filter by platform (from catalogue -> category -> platform)
        if platform_slug:
            query = query.join(Catalogue).join(Category).join(Platform).filter(Platform.slug == platform_slug)
        
        if status:
            query = query.filter(Product.status == status)
        if is_featured is not None:
            query = query.filter(Product.is_featured == is_featured)
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        total = query.count()
        products = query.offset(skip).limit(limit).all()

        return products, total

    @staticmethod
    def update_product(db: Session, product_id: int, product_data: ProductUpdate) -> Product:
        """Update a product"""
        product = ProductService.get_product(db, product_id)

        update_data = product_data.model_dump(exclude_unset=True)

        if 'slug' in update_data and update_data['slug']:
            existing = db.query(Product).filter(
                Product.slug == update_data['slug'],
                Product.id != product_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product with slug '{update_data['slug']}' already exists"
                )

        # Handle category_ids - update many-to-many relationship
        category_ids = update_data.pop('category_ids', None)
        if category_ids is not None:
            categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
            if len(categories) != len(category_ids):
                found_ids = {cat.id for cat in categories}
                missing_ids = set(category_ids) - found_ids
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Categories not found: {missing_ids}"
                )
            product.categories = categories

        # Handle status enum
        if 'status' in update_data and update_data['status']:
            update_data['status'] = update_data['status'].value
        
        # Handle tags - convert list to comma-separated string
        if 'tags' in update_data and update_data['tags'] is not None:
            update_data['tags'] = ','.join(update_data['tags']) if update_data['tags'] else None
            # Also update is_featured if 'featured' tag is present
            update_data['is_featured'] = 'featured' in (update_data['tags'] or '')

        # Handle footwear_details separately
        footwear_data = update_data.pop('footwear_details', None)
        if footwear_data:
            if product.footwear_details:
                for key, value in footwear_data.items():
                    if value is not None:
                        setattr(product.footwear_details, key, value)
            else:
                footwear = FootwearDetails(product_id=product.id, **footwear_data)
                db.add(footwear)

        for key, value in update_data.items():
            setattr(product, key, value)

        product.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        """
        Delete a product and cascade delete all related data.
        This will cascade delete:
        - All variants of the product
        - All variant options
        - All media assets
        - Footwear details
        """
        product = ProductService.get_product(db, product_id)

        # All related data will be cascade deleted via SQLAlchemy relationships
        # Thanks to cascade="all, delete-orphan" on Product relationships
        db.delete(product)
        db.commit()
        return True

    @staticmethod
    def get_color_options(db: Session, product_id: int) -> List[ColorOption]:
        """
        Get color options for a product - returns ALL products from the same catalogue.
        Includes the current product to show all available colors.
        Used for PDP color switching.
        """
        product = ProductService.get_product(db, product_id)
        
        # Get ALL products in the same catalogue (including current one)
        sibling_products = db.query(Product).filter(
            Product.catalogue_id == product.catalogue_id,
            Product.status == "live"
        ).all()
        
        color_options = []
        for p in sibling_products:
            # Get primary image URL
            primary_image = db.query(MediaAsset).filter(
                MediaAsset.product_id == p.id,
                MediaAsset.is_primary == True
            ).first()
            
            color_options.append(ColorOption(
                product_id=p.id,
                name=p.name,
                color=p.color,
                color_hex=p.color_hex,
                slug=p.slug,
                primary_image_url=primary_image.cloudinary_url if primary_image else None
            ))
        
        return color_options

    @staticmethod
    def bulk_upload_products(db: Session, bulk_data: BulkProductUpload) -> dict:
        """Bulk upload products"""
        results = {
            "total": len(bulk_data.products),
            "successful": 0,
            "failed": 0,
            "errors": []
        }

        for idx, product_data in enumerate(bulk_data.products):
            try:
                ProductService.create_product(db, product_data)
                results["successful"] += 1
            except HTTPException as e:
                results["failed"] += 1
                results["errors"].append({
                    "index": idx,
                    "product_name": product_data.name,
                    "error": e.detail
                })
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "index": idx,
                    "product_name": product_data.name,
                    "error": str(e)
                })

        return results


# ========================
# Variant Service
# ========================

class VariantService:
    """Service for product variant operations (size variants)"""

    @staticmethod
    def create_variant(db: Session, product_id: int, variant_data: ProductVariantCreate) -> ProductVariant:
        """Create a new variant for a product"""
        # Verify product exists
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )

        # Check for duplicate SKU
        if variant_data.sku:
            existing = db.query(ProductVariant).filter(ProductVariant.sku == variant_data.sku).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Variant with SKU '{variant_data.sku}' already exists"
                )

        variant = ProductVariant(
            product_id=product_id,
            sku=variant_data.sku,
            size=variant_data.size,
            stock_quantity=variant_data.stock_quantity,
            price_override=variant_data.price_override,
            mrp_override=variant_data.mrp_override,
            is_active=variant_data.is_active
        )
        db.add(variant)
        db.flush()

        # Create options
        for option_data in variant_data.options:
            option = VariantOption(
                variant_id=variant.id,
                option_name=option_data.option_name,
                option_value=option_data.option_value,
                stock_quantity=option_data.stock_quantity,
                is_available=option_data.is_available
            )
            db.add(option)

        db.commit()
        db.refresh(variant)
        return variant

    @staticmethod
    def get_variant(db: Session, variant_id: int) -> ProductVariant:
        """Get a variant by ID"""
        variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Variant with ID {variant_id} not found"
            )
        return variant

    @staticmethod
    def update_variant(db: Session, variant_id: int, variant_data: ProductVariantUpdate) -> ProductVariant:
        """Update a variant"""
        variant = VariantService.get_variant(db, variant_id)

        update_data = variant_data.model_dump(exclude_unset=True)

        if 'sku' in update_data and update_data['sku']:
            existing = db.query(ProductVariant).filter(
                ProductVariant.sku == update_data['sku'],
                ProductVariant.id != variant_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Variant with SKU '{update_data['sku']}' already exists"
                )

        # Handle stock_quantity - update on all options since stock is stored at option level
        if 'stock_quantity' in update_data:
            new_stock = update_data.pop('stock_quantity')  # Remove from update_data
            # Update all options for this variant with the new stock quantity
            for option in (variant.options or []):
                option.stock_quantity = new_stock
                option.is_available = new_stock > 0

        for key, value in update_data.items():
            if hasattr(variant, key):  # Only set attributes that exist on the model
                setattr(variant, key, value)

        db.commit()
        db.refresh(variant)
        return variant

    @staticmethod
    def delete_variant(db: Session, variant_id: int) -> bool:
        """Delete a variant and its options"""
        variant = VariantService.get_variant(db, variant_id)

        # Delete associated media
        db.query(MediaAsset).filter(MediaAsset.variant_id == variant_id).delete()

        db.delete(variant)
        db.commit()
        return True


# ========================
# Variant Option Service
# ========================

class VariantOptionService:
    """Service for variant option operations"""

    @staticmethod
    def create_option(db: Session, variant_id: int, option_data: VariantOptionCreate) -> VariantOption:
        """Create a new option for a variant"""
        variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Variant with ID {variant_id} not found"
            )

        option = VariantOption(
            variant_id=variant_id,
            option_name=option_data.option_name,
            option_value=option_data.option_value,
            stock_quantity=option_data.stock_quantity,
            is_available=option_data.is_available
        )
        db.add(option)
        db.commit()
        db.refresh(option)
        return option

    @staticmethod
    def get_option(db: Session, option_id: int) -> VariantOption:
        """Get an option by ID"""
        option = db.query(VariantOption).filter(VariantOption.id == option_id).first()
        if not option:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Option with ID {option_id} not found"
            )
        return option

    @staticmethod
    def update_option(db: Session, option_id: int, option_data: VariantOptionUpdate) -> VariantOption:
        """Update an option"""
        option = VariantOptionService.get_option(db, option_id)

        update_data = option_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(option, key, value)

        db.commit()
        db.refresh(option)
        return option

    @staticmethod
    def update_stock(db: Session, option_id: int, quantity: int) -> VariantOption:
        """Update stock quantity for an option"""
        option = VariantOptionService.get_option(db, option_id)
        option.stock_quantity = quantity
        option.is_available = quantity > 0
        db.commit()
        db.refresh(option)
        return option

    @staticmethod
    def delete_option(db: Session, option_id: int) -> bool:
        """Delete an option"""
        option = VariantOptionService.get_option(db, option_id)
        db.delete(option)
        db.commit()
        return True


# ========================
# Media Asset Service
# ========================

class MediaAssetService:
    """Service for media asset operations"""

    @staticmethod
    def create_media(db: Session, media_data: MediaAssetCreate) -> MediaAsset:
        """Create a new media asset"""
        media = MediaAsset(
            product_id=media_data.product_id,
            variant_id=media_data.variant_id,
            media_type=media_data.media_type.value,
            usage_type=media_data.usage_type.value,
            platform=media_data.platform.value if media_data.platform else None,
            cloudinary_url=media_data.cloudinary_url,
            folder_path=media_data.folder_path,
            public_id=media_data.public_id,
            width=media_data.width,
            height=media_data.height,
            aspect_ratio=media_data.aspect_ratio,
            display_order=media_data.display_order,
            is_primary=media_data.is_primary
        )
        db.add(media)
        db.commit()
        db.refresh(media)
        return media

    @staticmethod
    def get_media(db: Session, media_id: int) -> MediaAsset:
        """Get a media asset by ID"""
        media = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Media asset with ID {media_id} not found"
            )
        return media

    @staticmethod
    def list_product_media(db: Session, product_id: int) -> List[MediaAsset]:
        """List all media for a product"""
        return db.query(MediaAsset).filter(
            MediaAsset.product_id == product_id
        ).order_by(MediaAsset.display_order).all()

    @staticmethod
    def list_variant_media(db: Session, variant_id: int) -> List[MediaAsset]:
        """List all media for a variant"""
        return db.query(MediaAsset).filter(
            MediaAsset.variant_id == variant_id
        ).order_by(MediaAsset.display_order).all()

    @staticmethod
    def update_media(db: Session, media_id: int, media_data: MediaAssetUpdate) -> MediaAsset:
        """Update a media asset"""
        media = MediaAssetService.get_media(db, media_id)

        update_data = media_data.model_dump(exclude_unset=True)

        # Handle enum values
        if 'media_type' in update_data and update_data['media_type']:
            update_data['media_type'] = update_data['media_type'].value
        if 'usage_type' in update_data and update_data['usage_type']:
            update_data['usage_type'] = update_data['usage_type'].value
        if 'platform' in update_data and update_data['platform']:
            update_data['platform'] = update_data['platform'].value

        for key, value in update_data.items():
            setattr(media, key, value)

        db.commit()
        db.refresh(media)
        return media

    @staticmethod
    def delete_media(db: Session, media_id: int) -> bool:
        """Delete a media asset"""
        media = MediaAssetService.get_media(db, media_id)
        db.delete(media)
        db.commit()
        return True

    @staticmethod
    def set_primary_media(db: Session, product_id: int, media_id: int) -> MediaAsset:
        """Set a media asset as primary for a product"""
        # Reset all product media to non-primary
        db.query(MediaAsset).filter(
            MediaAsset.product_id == product_id
        ).update({"is_primary": False})

        # Set the specified media as primary
        media = MediaAssetService.get_media(db, media_id)
        if media.product_id != product_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Media asset does not belong to this product"
            )

        media.is_primary = True
        db.commit()
        db.refresh(media)
        return media


# ========================
# Product Listing Service
# ========================

class ProductListingService:
    """Service for optimized product listing with pre-joined data"""

    @staticmethod
    def get_product_listing(
        db: Session,
        category_id: Optional[int] = None,
        catalogue_id: Optional[int] = None,
        platform_slug: Optional[str] = None,
        brand_id: Optional[int] = None,
        gender: Optional[str] = None,
        is_featured: Optional[bool] = None,
        tags: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        in_stock_only: bool = False,
        skip: int = 0,
        limit: int = 20
    ) -> tuple:
        """
        Get optimized product listing with pre-joined primary image.
        Returns (items, total, filters_applied)
        """
        # Base query - exclude deleted and non-live products for public listing
        query = db.query(Product).options(
            joinedload(Product.catalogue).joinedload(Catalogue.category).joinedload(Category.platform),
            joinedload(Product.brand),
            joinedload(Product.variants).joinedload(ProductVariant.options)
        ).filter(
            Product.deleted_at.is_(None),
            Product.status == "live"
        )

        filters_applied = {}

        # Apply filters
        if category_id:
            query = query.join(Catalogue).filter(Catalogue.category_id == category_id)
            filters_applied["category_id"] = category_id

        if catalogue_id:
            query = query.filter(Product.catalogue_id == catalogue_id)
            filters_applied["catalogue_id"] = catalogue_id

        if platform_slug:
            query = query.join(Catalogue).join(Category).join(Platform).filter(Platform.slug == platform_slug)
            filters_applied["platform_slug"] = platform_slug

        if brand_id:
            query = query.filter(Product.brand_id == brand_id)
            filters_applied["brand_id"] = brand_id

        if gender:
            query = query.join(Catalogue).filter(Catalogue.gender == gender)
            filters_applied["gender"] = gender

        if is_featured is not None:
            query = query.filter(Product.is_featured == is_featured)
            filters_applied["is_featured"] = is_featured

        # Filter by tags
        if tags:
            tag_list = [tag.strip().lower() for tag in tags.split(',') if tag.strip()]
            for tag in tag_list:
                query = query.filter(Product.tags.ilike(f"%{tag}%"))
            filters_applied["tags"] = tag_list

        if min_price is not None:
            query = query.filter(Product.price >= min_price)
            filters_applied["min_price"] = min_price

        if max_price is not None:
            query = query.filter(Product.price <= max_price)
            filters_applied["max_price"] = max_price

        # Get total count
        total = query.count()

        # Get products
        products = query.order_by(Product.is_featured.desc(), Product.created_at.desc())\
            .offset(skip).limit(limit).all()

        # Build listing items with pre-joined data
        listing_items = []
        for product in products:
            # Get primary image
            primary_image = db.query(MediaAsset).filter(
                MediaAsset.product_id == product.id,
                MediaAsset.is_primary == True,
                MediaAsset.deleted_at.is_(None)
            ).first()

            primary_image_url = primary_image.cloudinary_url if primary_image else None
            primary_image_alt = product.name

            # Check stock availability and collect available sizes
            in_stock = False
            available_sizes = []
            for v in product.variants:
                if v.deleted_at is None and v.is_active:
                    variant_stock = sum(opt.stock_quantity or 0 for opt in (v.options or []))
                    if variant_stock > 0:
                        in_stock = True
                        # Get size from variant_name or first option
                        size = v.variant_name
                        if not size and v.options:
                            size_option = next((o for o in v.options if o.option_name == 'size'), None)
                            if size_option:
                                size = size_option.option_value
                        if size and size not in available_sizes:
                            available_sizes.append(size)

            # Skip out-of-stock if filter applied
            if in_stock_only and not in_stock:
                continue

            # Calculate discount percentage (mrp is the MRP, price is the selling price)
            discount_percentage = None
            if product.mrp and product.mrp > product.price:
                discount_percentage = round(((product.mrp - product.price) / product.mrp) * 100, 1)

            # Get product tags as list
            product_tags = product.get_tags_list() if hasattr(product, 'get_tags_list') else []

            # Get all available colors for this catalogue (same design, different colors)
            available_colors = []
            if product.catalogue_id:
                # Get all products in the same catalogue (same design, different colors)
                color_variants = db.query(Product).filter(
                    Product.catalogue_id == product.catalogue_id,
                    Product.deleted_at.is_(None),
                    Product.status == "live",
                    Product.color.isnot(None)
                ).all()
                
                for cv in color_variants:
                    if cv.color and cv.color not in [c['name'] for c in available_colors]:
                        available_colors.append({
                            'name': cv.color,
                            'hex': cv.color_hex,
                            'product_id': cv.id
                        })

            listing_items.append({
                "id": product.id,
                "name": product.name,
                "slug": product.slug,
                "brand_id": product.brand_id,
                "brand_name": product.brand.name if product.brand else None,
                "price": product.price,  # Selling price
                "mrp": product.mrp,       # MRP (original price)
                "discount_percentage": discount_percentage,
                "primary_image_url": primary_image_url,
                "primary_image_alt": primary_image_alt,
                "catalogue_id": product.catalogue_id,
                "category_id": product.catalogue.category_id if product.catalogue else None,
                "gender": product.gender,
                "color": product.color,
                "color_hex": product.color_hex,
                "platform_slug": product.platform.slug if product.platform else None,
                "is_featured": product.is_featured,
                "tags": product_tags,
                "status": product.status,
                "in_stock": in_stock,
                "available_sizes": available_sizes,
                "available_colors": available_colors,
                "short_description": product.short_description,
                "created_at": product.created_at
            })

        return listing_items, total, filters_applied


# ========================
# Availability Service
# ========================

class AvailabilityService:
    """Service for product and variant availability"""

    @staticmethod
    def get_product_availability(db: Session, product_id: int) -> dict:
        """Get complete availability information for a product."""
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.deleted_at.is_(None)
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )

        sizes_availability = []
        total_stock = 0
        product_available = False

        for variant in product.variants:
            if variant.deleted_at is not None or not variant.is_active:
                continue

            # Calculate stock from options (stock is stored at option level)
            variant_stock = sum(opt.stock_quantity or 0 for opt in (variant.options or []))
            # Get size from variant_name or first option
            size = variant.variant_name
            if not size and variant.options:
                size_option = next((o for o in variant.options if o.option_name == 'size'), None)
                if size_option:
                    size = size_option.option_value
            
            if variant_stock > 0:
                product_available = True
                total_stock += variant_stock

            sizes_availability.append({
                "variant_id": variant.id,
                "size": size,
                "stock_quantity": variant_stock,
                "is_available": variant_stock > 0 and variant.is_active
            })

        return {
            "product_id": product.id,
            "product_name": product.name,
            "color": product.color,
            "available": product_available,
            "total_stock": total_stock,
            "variant_count": len(sizes_availability),
            "sizes": sizes_availability
        }


# ========================
# Slug Utility Service
# ========================

class SlugService:
    """Service for generating unique slugs"""

    @staticmethod
    def generate_unique_slug(db: Session, base_slug: str, model_class, exclude_id: Optional[int] = None) -> str:
        """Generate a unique slug by appending numbers if needed."""
        slug = base_slug
        counter = 1

        while True:
            query = db.query(model_class).filter(model_class.slug == slug)
            if exclude_id:
                query = query.filter(model_class.id != exclude_id)

            if hasattr(model_class, 'deleted_at'):
                query = query.filter(model_class.deleted_at.is_(None))

            if not query.first():
                return slug

            counter += 1
            slug = f"{base_slug}-{counter}"


# ========================
# Soft Delete Service
# ========================

class SoftDeleteService:
    """Service for soft delete operations"""

    @staticmethod
    def soft_delete_product(db: Session, product_id: int) -> Product:
        """Soft delete a product"""
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.deleted_at.is_(None)
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found"
            )

        product.deleted_at = datetime.utcnow()
        product.status = "archived"

        # Also soft delete variants
        for variant in product.variants:
            variant.deleted_at = datetime.utcnow()

        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def restore_product(db: Session, product_id: int) -> Product:
        """Restore a soft-deleted product"""
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.deleted_at.isnot(None)
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Deleted product with ID {product_id} not found"
            )

        product.deleted_at = None
        product.status = "draft"

        for variant in product.variants:
            variant.deleted_at = None

        db.commit()
        db.refresh(product)
        return product



