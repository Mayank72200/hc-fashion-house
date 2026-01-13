"""
Site Configuration API Router
Handles website control center endpoints: banners, sections, media library
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from database.connection import get_db
from services import site_config_service
from services.media_upload_service import MediaUploadService
from utils.auth_dependencies import require_admin

# Initialize media upload service
media_service = MediaUploadService()

router = APIRouter(prefix="/site-config", tags=["Site Configuration"])


# ========================
# Pydantic Models
# ========================

class BannerCreate(BaseModel):
    name: str
    placement_key: str
    image_url: Optional[str] = None
    image_public_id: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    platform_slug: Optional[str] = None
    gender: Optional[str] = None
    display_order: int = 0
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class BannerUpdate(BaseModel):
    name: Optional[str] = None
    placement_key: Optional[str] = None
    image_url: Optional[str] = None
    image_public_id: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    platform_slug: Optional[str] = None
    gender: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SectionCreate(BaseModel):
    name: str
    section_key: str
    title: Optional[str] = None
    subtitle: Optional[str] = None
    platform_slug: Optional[str] = None
    gender: Optional[str] = None
    page_type: str = 'home'
    max_products: int = 8
    display_order: int = 0
    is_active: bool = True
    auto_populate: bool = False
    auto_criteria: Optional[str] = None


class SectionUpdate(BaseModel):
    name: Optional[str] = None
    section_key: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    platform_slug: Optional[str] = None
    gender: Optional[str] = None
    page_type: Optional[str] = None
    max_products: Optional[int] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    auto_populate: Optional[bool] = None
    auto_criteria: Optional[str] = None


class SectionProductsUpdate(BaseModel):
    product_ids: List[int]


class MediaAssetCreate(BaseModel):
    name: str
    cloudinary_url: str
    cloudinary_public_id: str
    file_type: str = 'image'
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    folder_path: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    usage_type: str = 'general'
    usage_location: Optional[str] = None
    alt_text: Optional[str] = None
    tags: Optional[str] = None


class MediaAssetUpdate(BaseModel):
    name: Optional[str] = None
    usage_type: Optional[str] = None
    usage_location: Optional[str] = None
    alt_text: Optional[str] = None
    tags: Optional[str] = None


# ========================
# Banner Endpoints
# ========================

@router.get("/banners")
async def list_banners(
    placement_key: Optional[str] = None,
    platform_slug: Optional[str] = None,
    gender: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """List all banners with optional filters"""
    banners = site_config_service.list_banners(
        db, placement_key, platform_slug, gender, is_active
    )
    return [site_config_service.banner_to_dict(b) for b in banners]


@router.get("/banners/{banner_id}")
async def get_banner(
    banner_id: int,
    db: Session = Depends(get_db),
):
    """Get a single banner by ID"""
    banner = site_config_service.get_banner(db, banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    return site_config_service.banner_to_dict(banner)


@router.post("/banners")
async def create_banner(
    banner: BannerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Create a new banner"""
    new_banner = site_config_service.create_banner(db, banner.model_dump())
    return site_config_service.banner_to_dict(new_banner)


@router.put("/banners/{banner_id}")
async def update_banner(
    banner_id: int,
    banner: BannerUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Update an existing banner"""
    updated = site_config_service.update_banner(db, banner_id, banner.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Banner not found")
    return site_config_service.banner_to_dict(updated)


@router.delete("/banners/{banner_id}")
async def delete_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Delete a banner"""
    success = site_config_service.delete_banner(db, banner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"message": "Banner deleted successfully"}


# ========================
# Section Endpoints
# ========================

@router.get("/sections")
async def list_sections(
    section_key: Optional[str] = None,
    platform_slug: Optional[str] = None,
    gender: Optional[str] = None,
    page_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """List all sections with optional filters"""
    sections = site_config_service.list_sections(
        db, section_key, platform_slug, gender, page_type, is_active
    )
    return [site_config_service.section_to_dict(s) for s in sections]


@router.get("/sections/{section_id}")
async def get_section(
    section_id: int,
    include_products: bool = True,
    db: Session = Depends(get_db),
):
    """Get a single section by ID"""
    section = site_config_service.get_section(db, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return site_config_service.section_to_dict(section, include_products)


@router.post("/sections")
async def create_section(
    section: SectionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Create a new section"""
    new_section = site_config_service.create_section(db, section.model_dump())
    return site_config_service.section_to_dict(new_section)


@router.put("/sections/{section_id}")
async def update_section(
    section_id: int,
    section: SectionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Update an existing section"""
    updated = site_config_service.update_section(db, section_id, section.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Section not found")
    return site_config_service.section_to_dict(updated)


@router.delete("/sections/{section_id}")
async def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Delete a section"""
    success = site_config_service.delete_section(db, section_id)
    if not success:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"message": "Section deleted successfully"}


@router.put("/sections/{section_id}/products")
async def set_section_products(
    section_id: int,
    data: SectionProductsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Set the products for a section (replaces existing)"""
    section = site_config_service.set_section_products(db, section_id, data.product_ids)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return site_config_service.section_to_dict(section, include_products=True)


@router.post("/sections/{section_id}/products/add")
async def add_products_to_section(
    section_id: int,
    data: SectionProductsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Add products to a section"""
    section = site_config_service.add_products_to_section(db, section_id, data.product_ids)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return site_config_service.section_to_dict(section, include_products=True)


@router.post("/sections/{section_id}/products/remove")
async def remove_products_from_section(
    section_id: int,
    data: SectionProductsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Remove products from a section"""
    section = site_config_service.remove_products_from_section(db, section_id, data.product_ids)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return site_config_service.section_to_dict(section, include_products=True)


# ========================
# Media Library Endpoints
# ========================

@router.get("/media")
async def list_media_assets(
    usage_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List all media assets with optional filters"""
    assets, total = site_config_service.list_media_assets(db, usage_type, search, skip, limit)
    return {
        "items": [site_config_service.media_asset_to_dict(a) for a in assets],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/media")
async def create_media_asset(
    asset: MediaAssetCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Create a media asset entry (after upload to Cloudinary)"""
    new_asset = site_config_service.create_media_asset(db, asset.model_dump())
    return site_config_service.media_asset_to_dict(new_asset)


@router.post("/media/upload")
async def upload_media_asset(
    file: UploadFile = File(...),
    usage_type: str = Form(default='general'),
    alt_text: Optional[str] = Form(default=None),
    tags: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Upload a new media asset to R2 storage and create entry"""
    # Determine folder based on usage type
    folder_map = {
        'banner': 'banners',
        'product': 'products',
        'lifestyle': 'lifestyle',
        'icon': 'icons',
        'general': 'general',
    }
    folder = folder_map.get(usage_type, 'general')
    
    # Generate object path
    import uuid
    from datetime import datetime as dt
    timestamp = dt.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    filename = file.filename.replace(" ", "_")
    object_path = f"site-config/{folder}/{timestamp}_{unique_id}_{filename}"
    
    # Upload to R2 storage
    try:
        result = await media_service.upload_to_r2(file, object_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    # Create media asset entry
    asset_data = {
        'name': file.filename,
        'cloudinary_url': result['public_url'],
        'cloudinary_public_id': object_path,
        'folder_path': f"site-config/{folder}",
        'file_type': 'image',
        'mime_type': file.content_type,
        'usage_type': usage_type,
        'alt_text': alt_text,
        'tags': tags,
    }
    
    new_asset = site_config_service.create_media_asset(db, asset_data)
    return site_config_service.media_asset_to_dict(new_asset)


@router.put("/media/{asset_id}")
async def update_media_asset(
    asset_id: int,
    asset: MediaAssetUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Update a media asset's metadata"""
    updated = site_config_service.update_media_asset(db, asset_id, asset.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Media asset not found")
    return site_config_service.media_asset_to_dict(updated)


@router.delete("/media/{asset_id}")
async def delete_media_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Delete a media asset"""
    # TODO: Also delete from Cloudinary
    success = site_config_service.delete_media_asset(db, asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Media asset not found")
    return {"message": "Media asset deleted successfully"}


# ========================
# Public Endpoints (for frontend)
# ========================

@router.get("/public/banners")
async def get_public_banners(
    page_type: str = 'home',
    platform_slug: Optional[str] = None,
    gender: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get banners for a page (public endpoint)"""
    return site_config_service.get_banners_for_page(db, page_type, platform_slug, gender)


@router.get("/public/sections")
async def get_public_sections(
    page_type: str = 'home',
    platform_slug: Optional[str] = None,
    gender: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all sections with products for a page (public endpoint)"""
    return site_config_service.get_sections_for_page(db, page_type, platform_slug, gender)


@router.get("/public/sections/{section_key}")
async def get_public_section(
    section_key: str,
    page_type: str = 'home',
    platform_slug: Optional[str] = None,
    gender: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Get a specific section with products (public endpoint)"""
    section = site_config_service.get_section_with_products(
        db, section_key, platform_slug, gender, page_type, limit
    )
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


# ========================
# Placement Key Options
# ========================

@router.get("/placement-keys")
async def get_placement_keys():
    """Get available banner placement keys"""
    return {
        "banner_placements": [
            {"key": "hero_main", "name": "Hero Main Banner", "description": "Main hero banner on homepage"},
            {"key": "hero_secondary", "name": "Hero Secondary", "description": "Secondary hero slider images"},
            {"key": "promo_left", "name": "Promo Left", "description": "Left promotional banner"},
            {"key": "promo_right", "name": "Promo Right", "description": "Right promotional banner"},
            {"key": "promo_full", "name": "Promo Full Width", "description": "Full-width promotional banner"},
            {"key": "category_banner", "name": "Category Banner", "description": "Category page header banner"},
            {"key": "segment_hero", "name": "Segment Hero", "description": "Segment page (Men/Women) hero"},
            {"key": "footer_banner", "name": "Footer Banner", "description": "Above footer promotional"},
            {"key": "sale_banner", "name": "Sale Banner", "description": "Sale/Discount announcement"},
        ],
        "section_keys": [
            {"key": "trending", "name": "Trending", "description": "Trending products section"},
            {"key": "new_arrivals", "name": "New Arrivals", "description": "Newly added products"},
            {"key": "featured", "name": "Featured", "description": "Featured/Highlighted products"},
            {"key": "bestsellers", "name": "Bestsellers", "description": "Best selling products"},
            {"key": "sale", "name": "On Sale", "description": "Products on sale"},
            {"key": "staff_picks", "name": "Staff Picks", "description": "Staff recommended products"},
            {"key": "recently_viewed", "name": "Recently Viewed", "description": "User's recently viewed"},
        ],
        "page_types": [
            {"key": "home", "name": "Homepage"},
            {"key": "segment", "name": "Segment Page (Men/Women)"},
            {"key": "category", "name": "Category Page"},
            {"key": "all_products", "name": "All Products Page"},
        ],
        "usage_types": [
            {"key": "banner", "name": "Banner Image"},
            {"key": "product", "name": "Product Image"},
            {"key": "lifestyle", "name": "Lifestyle/Promotional"},
            {"key": "icon", "name": "Icon/Logo"},
            {"key": "general", "name": "General"},
        ],
    }
