"""
Site Configuration Service
Handles website control center operations: banners, featured sections, media library
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from database.db_models import (
    BannerPlacement, FeaturedSection, MediaAssetLibrary, SiteSettings,
    Product, section_products
)
from services.catalogue_service import product_to_dict


# ========================
# Banner Placement Service
# ========================

def create_banner(db: Session, banner_data: dict) -> BannerPlacement:
    """Create a new banner placement"""
    banner = BannerPlacement(
        name=banner_data.get('name'),
        placement_key=banner_data.get('placement_key'),
        image_url=banner_data.get('image_url'),
        image_public_id=banner_data.get('image_public_id'),
        title=banner_data.get('title'),
        subtitle=banner_data.get('subtitle'),
        button_text=banner_data.get('button_text'),
        button_link=banner_data.get('button_link'),
        platform_slug=banner_data.get('platform_slug'),
        gender=banner_data.get('gender'),
        display_order=banner_data.get('display_order', 0),
        is_active=banner_data.get('is_active', True),
        start_date=banner_data.get('start_date'),
        end_date=banner_data.get('end_date'),
    )
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner


def update_banner(db: Session, banner_id: int, banner_data: dict) -> Optional[BannerPlacement]:
    """Update an existing banner"""
    banner = db.query(BannerPlacement).filter(BannerPlacement.id == banner_id).first()
    if not banner:
        return None
    
    for key, value in banner_data.items():
        if hasattr(banner, key) and key not in ['id', 'created_at']:
            setattr(banner, key, value)
    
    banner.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(banner)
    return banner


def delete_banner(db: Session, banner_id: int) -> bool:
    """Delete a banner"""
    banner = db.query(BannerPlacement).filter(BannerPlacement.id == banner_id).first()
    if not banner:
        return False
    
    db.delete(banner)
    db.commit()
    return True


def get_banner(db: Session, banner_id: int) -> Optional[BannerPlacement]:
    """Get a single banner by ID"""
    return db.query(BannerPlacement).filter(BannerPlacement.id == banner_id).first()


def list_banners(
    db: Session,
    placement_key: Optional[str] = None,
    platform_slug: Optional[str] = None,
    gender: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[BannerPlacement]:
    """List banners with optional filters"""
    query = db.query(BannerPlacement)
    
    if placement_key:
        query = query.filter(BannerPlacement.placement_key == placement_key)
    if platform_slug:
        query = query.filter(
            or_(BannerPlacement.platform_slug == platform_slug, BannerPlacement.platform_slug.is_(None))
        )
    if gender:
        query = query.filter(
            or_(BannerPlacement.gender == gender, BannerPlacement.gender.is_(None))
        )
    if is_active is not None:
        query = query.filter(BannerPlacement.is_active == is_active)
    
    # Filter by schedule
    now = datetime.utcnow()
    query = query.filter(
        or_(BannerPlacement.start_date.is_(None), BannerPlacement.start_date <= now)
    ).filter(
        or_(BannerPlacement.end_date.is_(None), BannerPlacement.end_date >= now)
    )
    
    return query.order_by(BannerPlacement.display_order, BannerPlacement.created_at.desc()).all()


def get_banners_for_page(
    db: Session,
    page_type: str = 'home',
    platform_slug: Optional[str] = None,
    gender: Optional[str] = None,
) -> Dict[str, Any]:
    """Get all banners organized by placement for a specific page"""
    query = db.query(BannerPlacement).filter(BannerPlacement.is_active == True)
    
    # Filter by platform and gender (include null values for global banners)
    if platform_slug:
        query = query.filter(
            or_(BannerPlacement.platform_slug == platform_slug, BannerPlacement.platform_slug.is_(None))
        )
    if gender:
        query = query.filter(
            or_(BannerPlacement.gender == gender, BannerPlacement.gender.is_(None))
        )
    
    # Filter by schedule
    now = datetime.utcnow()
    query = query.filter(
        or_(BannerPlacement.start_date.is_(None), BannerPlacement.start_date <= now)
    ).filter(
        or_(BannerPlacement.end_date.is_(None), BannerPlacement.end_date >= now)
    )
    
    banners = query.order_by(BannerPlacement.display_order).all()
    
    # Organize by placement key
    result = {}
    for banner in banners:
        if banner.placement_key not in result:
            result[banner.placement_key] = []
        result[banner.placement_key].append(banner_to_dict(banner))
    
    return result


def banner_to_dict(banner: BannerPlacement) -> dict:
    """Convert banner to dictionary"""
    return {
        "id": banner.id,
        "name": banner.name,
        "placement_key": banner.placement_key,
        "image_url": banner.image_url,
        "image_public_id": banner.image_public_id,
        "title": banner.title,
        "subtitle": banner.subtitle,
        "button_text": banner.button_text,
        "button_link": banner.button_link,
        "platform_slug": banner.platform_slug,
        "gender": banner.gender,
        "display_order": banner.display_order,
        "is_active": banner.is_active,
        "start_date": banner.start_date.isoformat() if banner.start_date else None,
        "end_date": banner.end_date.isoformat() if banner.end_date else None,
        "created_at": banner.created_at.isoformat() if banner.created_at else None,
        "updated_at": banner.updated_at.isoformat() if banner.updated_at else None,
    }


# ========================
# Featured Section Service
# ========================

def create_section(db: Session, section_data: dict) -> FeaturedSection:
    """Create a new featured section"""
    section = FeaturedSection(
        name=section_data.get('name'),
        section_key=section_data.get('section_key'),
        title=section_data.get('title'),
        subtitle=section_data.get('subtitle'),
        platform_slug=section_data.get('platform_slug'),
        gender=section_data.get('gender'),
        page_type=section_data.get('page_type', 'home'),
        max_products=section_data.get('max_products', 8),
        display_order=section_data.get('display_order', 0),
        is_active=section_data.get('is_active', True),
        auto_populate=section_data.get('auto_populate', False),
        auto_criteria=section_data.get('auto_criteria'),
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


def update_section(db: Session, section_id: int, section_data: dict) -> Optional[FeaturedSection]:
    """Update an existing section"""
    section = db.query(FeaturedSection).filter(FeaturedSection.id == section_id).first()
    if not section:
        return None
    
    for key, value in section_data.items():
        if hasattr(section, key) and key not in ['id', 'created_at', 'products']:
            setattr(section, key, value)
    
    section.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(section)
    return section


def delete_section(db: Session, section_id: int) -> bool:
    """Delete a section"""
    section = db.query(FeaturedSection).filter(FeaturedSection.id == section_id).first()
    if not section:
        return False
    
    db.delete(section)
    db.commit()
    return True


def get_section(db: Session, section_id: int) -> Optional[FeaturedSection]:
    """Get a single section by ID"""
    return db.query(FeaturedSection).options(
        joinedload(FeaturedSection.products)
    ).filter(FeaturedSection.id == section_id).first()


def list_sections(
    db: Session,
    section_key: Optional[str] = None,
    platform_slug: Optional[str] = None,
    gender: Optional[str] = None,
    page_type: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[FeaturedSection]:
    """List sections with optional filters"""
    query = db.query(FeaturedSection)
    
    if section_key:
        query = query.filter(FeaturedSection.section_key == section_key)
    if platform_slug:
        query = query.filter(
            or_(FeaturedSection.platform_slug == platform_slug, FeaturedSection.platform_slug.is_(None))
        )
    if gender:
        query = query.filter(
            or_(FeaturedSection.gender == gender, FeaturedSection.gender.is_(None))
        )
    if page_type:
        query = query.filter(FeaturedSection.page_type == page_type)
    if is_active is not None:
        query = query.filter(FeaturedSection.is_active == is_active)
    
    return query.order_by(FeaturedSection.display_order, FeaturedSection.created_at.desc()).all()


def add_products_to_section(db: Session, section_id: int, product_ids: List[int]) -> Optional[FeaturedSection]:
    """Add products to a section"""
    section = db.query(FeaturedSection).filter(FeaturedSection.id == section_id).first()
    if not section:
        return None
    
    # Get current products
    current_product_ids = [p.id for p in section.products]
    
    # Add new products
    for pid in product_ids:
        if pid not in current_product_ids:
            product = db.query(Product).filter(Product.id == pid).first()
            if product:
                section.products.append(product)
    
    db.commit()
    db.refresh(section)
    return section


def remove_products_from_section(db: Session, section_id: int, product_ids: List[int]) -> Optional[FeaturedSection]:
    """Remove products from a section"""
    section = db.query(FeaturedSection).filter(FeaturedSection.id == section_id).first()
    if not section:
        return None
    
    section.products = [p for p in section.products if p.id not in product_ids]
    
    db.commit()
    db.refresh(section)
    return section


def set_section_products(db: Session, section_id: int, product_ids: List[int]) -> Optional[FeaturedSection]:
    """Replace all products in a section with a new list"""
    section = db.query(FeaturedSection).filter(FeaturedSection.id == section_id).first()
    if not section:
        return None
    
    # Clear existing products
    section.products = []
    
    # Add new products in order
    for pid in product_ids:
        product = db.query(Product).filter(Product.id == pid).first()
        if product:
            section.products.append(product)
    
    db.commit()
    db.refresh(section)
    return section


def get_section_with_products(
    db: Session,
    section_key: str,
    platform_slug: Optional[str] = None,
    gender: Optional[str] = None,
    page_type: str = 'home',
    limit: Optional[int] = None,
) -> Optional[dict]:
    """Get a section with its products for frontend display"""
    query = db.query(FeaturedSection).filter(
        FeaturedSection.section_key == section_key,
        FeaturedSection.is_active == True,
    )
    
    if platform_slug:
        query = query.filter(
            or_(FeaturedSection.platform_slug == platform_slug, FeaturedSection.platform_slug.is_(None))
        )
    if gender:
        query = query.filter(
            or_(FeaturedSection.gender == gender, FeaturedSection.gender.is_(None))
        )
    
    query = query.filter(FeaturedSection.page_type == page_type)
    
    section = query.first()
    if not section:
        return None
    
    # Get products
    products = []
    max_items = limit or section.max_products
    
    if section.auto_populate:
        # Auto-populate based on criteria
        products = get_auto_populated_products(db, section, max_items)
    else:
        # Get manually assigned products
        products = section.products[:max_items]
    
    return {
        "id": section.id,
        "section_key": section.section_key,
        "title": section.title,
        "subtitle": section.subtitle,
        "products": [product_to_dict(p) for p in products],
    }


def get_auto_populated_products(db: Session, section: FeaturedSection, limit: int) -> List[Product]:
    """Get products based on auto-populate criteria"""
    query = db.query(Product).options(
        joinedload(Product.variants),
        joinedload(Product.media_assets),
        joinedload(Product.brand),
    )
    
    # Filter by platform/gender if specified
    if section.platform_slug:
        from database.db_models import Catalogue, Category
        query = query.join(Catalogue).join(Category).filter(Category.platform.has(slug=section.platform_slug))
    
    if section.gender:
        query = query.join(Product.catalogue).filter(Catalogue.gender == section.gender)
    
    # Apply criteria
    if section.auto_criteria == 'newest':
        query = query.order_by(Product.created_at.desc())
    elif section.auto_criteria == 'bestselling':
        # TODO: Implement bestselling logic when order tracking is available
        query = query.order_by(Product.created_at.desc())
    elif section.auto_criteria == 'featured':
        query = query.filter(Product.is_featured == True)
    elif section.auto_criteria == 'random':
        query = query.order_by(func.random())
    else:
        query = query.order_by(Product.created_at.desc())
    
    return query.limit(limit).all()


def get_sections_for_page(
    db: Session,
    page_type: str = 'home',
    platform_slug: Optional[str] = None,
    gender: Optional[str] = None,
) -> List[dict]:
    """Get all sections with products for a page"""
    query = db.query(FeaturedSection).filter(
        FeaturedSection.is_active == True,
        FeaturedSection.page_type == page_type,
    )
    
    if platform_slug:
        query = query.filter(
            or_(FeaturedSection.platform_slug == platform_slug, FeaturedSection.platform_slug.is_(None))
        )
    if gender:
        query = query.filter(
            or_(FeaturedSection.gender == gender, FeaturedSection.gender.is_(None))
        )
    
    sections = query.order_by(FeaturedSection.display_order).all()
    
    result = []
    for section in sections:
        section_data = get_section_with_products(
            db, section.section_key, platform_slug, gender, page_type
        )
        if section_data:
            result.append(section_data)
    
    return result


def section_to_dict(section: FeaturedSection, include_products: bool = False) -> dict:
    """Convert section to dictionary"""
    result = {
        "id": section.id,
        "name": section.name,
        "section_key": section.section_key,
        "title": section.title,
        "subtitle": section.subtitle,
        "platform_slug": section.platform_slug,
        "gender": section.gender,
        "page_type": section.page_type,
        "max_products": section.max_products,
        "display_order": section.display_order,
        "is_active": section.is_active,
        "auto_populate": section.auto_populate,
        "auto_criteria": section.auto_criteria,
        "product_count": len(section.products) if section.products else 0,
        "created_at": section.created_at.isoformat() if section.created_at else None,
        "updated_at": section.updated_at.isoformat() if section.updated_at else None,
    }
    
    if include_products:
        result["products"] = [product_to_dict(p) for p in (section.products or [])]
    else:
        result["product_ids"] = [p.id for p in (section.products or [])]
    
    return result


# ========================
# Media Library Service
# ========================

def create_media_asset(db: Session, asset_data: dict) -> MediaAssetLibrary:
    """Create a new media asset entry"""
    asset = MediaAssetLibrary(
        name=asset_data.get('name'),
        file_type=asset_data.get('file_type', 'image'),
        mime_type=asset_data.get('mime_type'),
        file_size=asset_data.get('file_size'),
        cloudinary_url=asset_data.get('cloudinary_url'),
        cloudinary_public_id=asset_data.get('cloudinary_public_id'),
        folder_path=asset_data.get('folder_path'),
        width=asset_data.get('width'),
        height=asset_data.get('height'),
        usage_type=asset_data.get('usage_type', 'general'),
        usage_location=asset_data.get('usage_location'),
        alt_text=asset_data.get('alt_text'),
        tags=asset_data.get('tags'),
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def update_media_asset(db: Session, asset_id: int, asset_data: dict) -> Optional[MediaAssetLibrary]:
    """Update a media asset"""
    asset = db.query(MediaAssetLibrary).filter(MediaAssetLibrary.id == asset_id).first()
    if not asset:
        return None
    
    for key, value in asset_data.items():
        if hasattr(asset, key) and key not in ['id', 'created_at']:
            setattr(asset, key, value)
    
    asset.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(asset)
    return asset


def delete_media_asset(db: Session, asset_id: int) -> bool:
    """Delete a media asset"""
    asset = db.query(MediaAssetLibrary).filter(MediaAssetLibrary.id == asset_id).first()
    if not asset:
        return False
    
    db.delete(asset)
    db.commit()
    return True


def list_media_assets(
    db: Session,
    usage_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[MediaAssetLibrary], int]:
    """List media assets with filters"""
    query = db.query(MediaAssetLibrary).filter(MediaAssetLibrary.is_active == True)
    
    if usage_type and usage_type != 'all':
        query = query.filter(MediaAssetLibrary.usage_type == usage_type)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                MediaAssetLibrary.name.ilike(search_term),
                MediaAssetLibrary.tags.ilike(search_term),
                MediaAssetLibrary.alt_text.ilike(search_term),
            )
        )
    
    total = query.count()
    assets = query.order_by(MediaAssetLibrary.created_at.desc()).offset(skip).limit(limit).all()
    
    return assets, total


def media_asset_to_dict(asset: MediaAssetLibrary) -> dict:
    """Convert media asset to dictionary"""
    return {
        "id": asset.id,
        "name": asset.name,
        "file_type": asset.file_type,
        "mime_type": asset.mime_type,
        "file_size": asset.file_size,
        "cloudinary_url": asset.cloudinary_url,
        "cloudinary_public_id": asset.cloudinary_public_id,
        "folder_path": asset.folder_path,
        "width": asset.width,
        "height": asset.height,
        "usage_type": asset.usage_type,
        "usage_location": asset.usage_location,
        "alt_text": asset.alt_text,
        "tags": asset.tags,
        "created_at": asset.created_at.isoformat() if asset.created_at else None,
    }


# ========================
# Site Settings Service
# ========================

def get_setting(db: Session, key: str) -> Optional[str]:
    """Get a site setting value"""
    setting = db.query(SiteSettings).filter(SiteSettings.setting_key == key).first()
    return setting.setting_value if setting else None


def set_setting(db: Session, key: str, value: str, setting_type: str = 'string', description: str = None) -> SiteSettings:
    """Set a site setting value"""
    setting = db.query(SiteSettings).filter(SiteSettings.setting_key == key).first()
    
    if setting:
        setting.setting_value = value
        setting.setting_type = setting_type
        if description:
            setting.description = description
        setting.updated_at = datetime.utcnow()
    else:
        setting = SiteSettings(
            setting_key=key,
            setting_value=value,
            setting_type=setting_type,
            description=description,
        )
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    return setting


def get_all_settings(db: Session) -> Dict[str, Any]:
    """Get all site settings as a dictionary"""
    settings = db.query(SiteSettings).all()
    return {s.setting_key: s.setting_value for s in settings}
