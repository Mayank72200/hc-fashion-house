"""
Cloudinary Configuration and Utility Functions
Handles Cloudinary SDK setup and helper functions for media uploads
Uses centralized settings from configs/settings.py
"""
from typing import Optional, Dict, Any
from enum import Enum
from functools import lru_cache

import cloudinary
import cloudinary.uploader
import cloudinary.api

from configs.settings import get_settings


class FolderType(str, Enum):
    """Types of folders in Cloudinary structure"""
    PRODUCT_CATALOGUE = "catalogue"
    PRODUCT_LIFESTYLE = "lifestyle"
    CATALOGUE_BANNER = "banner"
    CATEGORY_BANNER = "banner"
    GLOBAL_VIDEO = "video"
    GLOBAL_BRAND = "brand"
    GLOBAL_OFFERS = "offers"


@lru_cache()
def get_cloudinary_settings():
    """Get Cloudinary-related settings from centralized config"""
    return get_settings()


def configure_cloudinary() -> None:
    """
    Configure Cloudinary SDK with credentials from environment.
    Must be called before any Cloudinary operations.
    """
    settings = get_cloudinary_settings()
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )


def generate_product_variant_folder(
    platform_slug: str,
    brand_slug: str,
    catalogue_slug: str,
    product_slug: str,
    usage_type: str = "catalogue"
) -> str:
    """
    Generate Cloudinary folder path for product media.
    
    ⚠️ IMPORTANT: Images belong to PRODUCT (color SKU), NOT to variants (sizes)!
    
    Structure: ecommerce/products/{platform_slug}/{brand_slug}/{catalogue_slug}/{product_slug}/{usage_type}/
    
    Example: ecommerce/products/footwear/yostar/hr-416/hr-416-white-grey/catalogue/

    Args:
        platform_slug: Platform slug (footwear, clothing, accessory)
        brand_slug: Brand slug (e.g., yostar, nike, adidas)
        catalogue_slug: Catalogue/Article slug (e.g., hr-416)
        product_slug: Full product slug (e.g., hr-416-white-grey)
        usage_type: Either 'catalogue' or 'lifestyle' (default: 'catalogue')

    Returns:
        Full folder path string
    """
    return f"ecommerce/products/{platform_slug}/{brand_slug}/{catalogue_slug}/{product_slug}/{usage_type}"


def generate_color_slug(color: str) -> str:
    """
    Generate URL-safe color slug for folder naming.
    
    Args:
        color: Color name (e.g., "White/Grey", "Black")
    
    Returns:
        URL-safe color slug (e.g., "white-grey", "black")
    """
    if not color:
        return "default"
    
    import re
    # Remove special characters and spaces, convert to lowercase
    slug = re.sub(r'[^a-z0-9]+', '-', color.lower().strip())
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug or "default"


def generate_catalogue_banner_folder(catalogue_slug: str) -> str:
    """
    Generate Cloudinary folder path for catalogue banners.

    Structure: ecommerce/catalogues/{catalogue_slug}/banners/
    """
    return f"ecommerce/catalogues/{catalogue_slug}/banners"


def generate_category_banner_folder(category_slug: str) -> str:
    """
    Generate Cloudinary folder path for category banners.

    Structure: ecommerce/categories/{category_slug}/banner/
    """
    return f"ecommerce/categories/{category_slug}/banner"


def generate_brand_media_folder(brand_slug: str, usage_type: str = "logo") -> str:
    """
    Generate Cloudinary folder path for brand media assets.

    Structure: ecommerce/brands/{brand_slug}/{usage_type}/
    
    Args:
        brand_slug: Brand slug (e.g., yostar, nike, adidas)
        usage_type: Type of brand media (logo, banner, icon)
    
    Returns:
        Full folder path string
    
    Example: ecommerce/brands/yostar/logo/
    """
    return f"ecommerce/brands/{brand_slug}/{usage_type}"


def generate_global_folder(folder_type: str) -> str:
    """
    Generate Cloudinary folder path for global assets.

    Structure: ecommerce/global/{folder_type}/
    """
    return f"ecommerce/global/{folder_type}"


def get_upload_options(
    folder_path: str,
    resource_type: str = "image",
    public_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get standard Cloudinary upload options.

    Args:
        folder_path: Target folder in Cloudinary
        resource_type: 'image' or 'video'
        public_id: Optional custom public ID

    Returns:
        Dictionary of upload options
    """
    options = {
        "folder": folder_path,
        "resource_type": resource_type,
        "use_filename": True,
        "unique_filename": True,
        "overwrite": False,
    }

    if public_id:
        options["public_id"] = public_id
        options["unique_filename"] = False

    return options


def extract_media_info(upload_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract relevant media information from Cloudinary upload response.

    Args:
        upload_result: Raw response from Cloudinary upload

    Returns:
        Dictionary with extracted media information
    """
    return {
        "cloudinary_url": upload_result.get("secure_url"),
        "public_id": upload_result.get("public_id"),
        "width": upload_result.get("width"),
        "height": upload_result.get("height"),
        "format": upload_result.get("format"),
        "resource_type": upload_result.get("resource_type"),
        "bytes": upload_result.get("bytes"),
        "folder": upload_result.get("folder"),
        "original_filename": upload_result.get("original_filename"),
        "created_at": upload_result.get("created_at"),
    }


def calculate_aspect_ratio(width: int, height: int) -> str:
    """
    Calculate aspect ratio from width and height.

    Args:
        width: Image width in pixels
        height: Image height in pixels

    Returns:
        Aspect ratio string (e.g., "16:9", "1:1", "4:3")
    """
    from math import gcd

    if not width or not height:
        return "unknown"

    divisor = gcd(width, height)
    ratio_width = width // divisor
    ratio_height = height // divisor

    # Simplify common ratios
    common_ratios = {
        (16, 9): "16:9",
        (9, 16): "9:16",
        (4, 3): "4:3",
        (3, 4): "3:4",
        (1, 1): "1:1",
        (3, 2): "3:2",
        (2, 3): "2:3",
        (21, 9): "21:9",
    }

    if (ratio_width, ratio_height) in common_ratios:
        return common_ratios[(ratio_width, ratio_height)]

    # For non-standard ratios, return simplified form
    return f"{ratio_width}:{ratio_height}"


def validate_file_type(filename: str, allowed_types: list) -> bool:
    """
    Validate file extension against allowed types.

    Args:
        filename: Name of the file
        allowed_types: List of allowed extensions (without dot)

    Returns:
        True if valid, False otherwise
    """
    if not filename:
        return False

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in allowed_types


# Allowed file types
ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"]
ALLOWED_VIDEO_TYPES = ["mp4", "mov", "avi", "mkv", "webm"]


def get_allowed_types(media_type: str) -> list:
    """Get allowed file extensions for a media type."""
    if media_type == "image":
        return ALLOWED_IMAGE_TYPES
    elif media_type == "video":
        return ALLOWED_VIDEO_TYPES
    return []

