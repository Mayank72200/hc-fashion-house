"""
Validation utilities for E-Commerce API
Common validation functions for data integrity
"""
import re
from typing import Optional


# Slug validation pattern
SLUG_PATTERN = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')

# SKU validation pattern (alphanumeric with hyphens)
SKU_PATTERN = re.compile(r'^[A-Z0-9]+(?:-[A-Z0-9]+)*$')

# Color hex code pattern
HEX_COLOR_PATTERN = re.compile(r'^#[0-9A-Fa-f]{6}$')


def validate_slug(slug: str) -> bool:
    """
    Validate that a slug follows URL-safe conventions.
    - lowercase
    - hyphen-separated
    - no spaces or special characters
    """
    if not slug:
        return False
    return bool(SLUG_PATTERN.match(slug))


def validate_sku(sku: str) -> bool:
    """
    Validate that a SKU follows the expected format.
    - uppercase alphanumeric
    - hyphen-separated segments
    """
    if not sku:
        return False
    return bool(SKU_PATTERN.match(sku.upper()))


def validate_hex_color(color: str) -> bool:
    """Validate hex color code format (#RRGGBB)"""
    if not color:
        return True  # Color is optional
    return bool(HEX_COLOR_PATTERN.match(color))


def validate_price(price: int) -> bool:
    """
    Validate price is a positive integer (in smallest currency unit).
    Prices should be >= 0 (0 for free items)
    """
    return isinstance(price, int) and price >= 0


def validate_stock_quantity(quantity: int) -> bool:
    """Validate stock quantity is non-negative"""
    return isinstance(quantity, int) and quantity >= 0


def sanitize_string(value: str, max_length: int = 255) -> str:
    """
    Sanitize string input:
    - Strip whitespace
    - Truncate to max length
    - Remove control characters
    """
    if not value:
        return value

    # Remove control characters
    value = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
    # Strip whitespace
    value = value.strip()
    # Truncate
    return value[:max_length]


def generate_slug(name: str) -> str:
    """
    Generate URL-safe slug from name.
    Rules:
    - lowercase
    - replace spaces and underscores with hyphens
    - remove special characters
    - collapse multiple hyphens
    """
    if not name:
        return ""

    slug = name.lower().strip()
    # Remove special characters except hyphens and spaces
    slug = re.sub(r'[^\w\s-]', '', slug)
    # Replace spaces and underscores with hyphens
    slug = re.sub(r'[\s_]+', '-', slug)
    # Collapse multiple hyphens
    slug = re.sub(r'-+', '-', slug)
    # Remove leading/trailing hyphens
    return slug.strip('-')


def validate_url(url: str) -> bool:
    """Basic URL validation"""
    if not url:
        return False
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return bool(url_pattern.match(url))


def validate_image_dimensions(width: int, height: int, min_width: int = 100, min_height: int = 100) -> bool:
    """Validate image dimensions meet minimum requirements"""
    return width >= min_width and height >= min_height


def calculate_discount_percentage(price: int, mrp: int) -> float:
    """Calculate discount percentage from price and MRP"""
    if not mrp or mrp <= 0:
        return 0.0
    if price >= mrp:
        return 0.0
    return round(((mrp - price) / mrp) * 100, 2)


def validate_category_hierarchy(parent_id: Optional[int], category_id: int) -> bool:
    """
    Validate that a category doesn't create a circular reference.
    A category cannot be its own parent.
    """
    if parent_id is None:
        return True
    return parent_id != category_id


class PriceValidator:
    """Price validation helper"""

    @staticmethod
    def validate_price_mrp(price: int, mrp: Optional[int]) -> bool:
        """Validate that price <= MRP if MRP is provided"""
        if mrp is None:
            return True
        return price <= mrp

    @staticmethod
    def validate_price_range(price: int, min_price: int = 0, max_price: int = 999999900) -> bool:
        """Validate price is within acceptable range (default max: ₹99,99,999)"""
        return min_price <= price <= max_price


class StockValidator:
    """Stock validation helper"""

    @staticmethod
    def validate_stock_update(current_stock: int, change: int) -> bool:
        """Validate stock update won't result in negative stock"""
        return (current_stock + change) >= 0

    @staticmethod
    def can_fulfill_order(available_stock: int, requested_quantity: int) -> bool:
        """Check if order can be fulfilled with available stock"""
        return available_stock >= requested_quantity

