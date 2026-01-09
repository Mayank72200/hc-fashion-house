"""
SQLAlchemy ORM models for E-Commerce Catalogue Database
Based on: Platform → Category → Catalogue (Article/Design) → Product (Color SKU) → Variant → Option model

Key Concepts:
- Platform: Top-level classification (Footwear, Clothing, Accessories, etc.)
- Category: Hierarchical categories under a platform (e.g., Sneakers, Formal, Boots)
- Catalogue: Article/Design grouping - represents one design that can have multiple color variants
- Product: A single color SKU of a catalogue/design
- Brand: Separate entity for brand management
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from database.connection import Base


class Platform(Base):
    """
    Top-level platform classification.
    Examples: Footwear, Clothing, Accessories, Bags, Watches
    """
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    categories = relationship("Category", back_populates="platform")


class Brand(Base):
    """
    Brand entity for products.
    Examples: Nike, Adidas, Puma, etc.
    """
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(255), nullable=False, unique=True)
    
    # Old field (deprecated, kept for backwards compatibility)
    logo_url = Column(Text, nullable=True)
    
    # New Cloudinary fields
    logo_cloudinary_url = Column(Text, nullable=True)
    logo_folder_path = Column(Text, nullable=True)
    logo_public_id = Column(String(255), nullable=True)
    logo_width = Column(Integer, nullable=True)
    logo_height = Column(Integer, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    products = relationship("Product", back_populates="brand")


class Category(Base):
    """
    Hierarchical product categories under a platform.
    Examples: Sneakers, Running Shoes, Casual Shoes (under Footwear platform)
    Categories are gender-agnostic - gender is stored at catalogue level.
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete support

    # Relationships
    platform = relationship("Platform", back_populates="categories")
    parent = relationship("Category", remote_side=[id], backref="children")
    products = relationship("Product", back_populates="category")
    catalogues = relationship("Catalogue", back_populates="category")


class Catalogue(Base):
    """
    Represents an Article/Design grouping.
    Each catalogue = one article design (e.g., AirFlex Running Shoe)
    Products under catalogue = different color SKUs of the same design.
    Gender is stored at catalogue level.
    NOT a marketing collection. Used for color switching on PDP.
    """
    __tablename__ = "catalogues"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)  # Article/Design name
    slug = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    gender = Column(String(20), nullable=False)  # men | women | boys | girls | unisex
    banner_media_id = Column(Integer, ForeignKey("media_assets.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete support

    # Relationships
    products = relationship("Product", back_populates="catalogue", foreign_keys="Product.catalogue_id")
    category = relationship("Category", back_populates="catalogues")
    banner_media = relationship("MediaAsset", foreign_keys=[banner_media_id])


class Product(Base):
    """
    Represents a single color SKU of an article/design.
    Product = one color only.
    Multiple products with the same catalogue_id = different colors of the same design.
    Gender and platform are inherited from catalogue → category → platform.
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)  # e.g., "AirFlex Running Shoe - Red"
    slug = Column(String(255), nullable=False, unique=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    catalogue_id = Column(Integer, ForeignKey("catalogues.id"), nullable=False)  # Required - Article/design reference
    color = Column(String(100), nullable=True)  # Display color name (e.g., "White/Skyblue")
    color_hex = Column(String(50), nullable=True)  # Hex codes (e.g., "#FFFFFF,#87CEEB" for multi-color)
    color_normalized = Column(String(100), nullable=True)  # Normalized for filtering (e.g., "white-skyblue")
    price = Column(Integer, nullable=False)  # Price in rupees
    mrp = Column(Integer, nullable=True)  # Maximum Retail Price
    short_description = Column(Text, nullable=True)
    long_description = Column(Text, nullable=True)
    is_featured = Column(Boolean, default=False)  # Deprecated: Use tags instead
    tags = Column(Text, nullable=True)  # Comma-separated tags: new,trending,featured,bestseller,sale
    status = Column(String(20), default="draft")  # draft | live | archived
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete support

    # Relationships
    brand = relationship("Brand", back_populates="products")
    category = relationship("Category", back_populates="products")
    catalogue = relationship("Catalogue", back_populates="products", foreign_keys=[catalogue_id])
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    media_assets = relationship("MediaAsset", back_populates="product")
    footwear_details = relationship("FootwearDetails", back_populates="product", uselist=False)

    def get_tags_list(self) -> list:
        """Get tags as a list"""
        if not self.tags:
            return []
        return [tag.strip().lower() for tag in self.tags.split(',') if tag.strip()]

    def has_tag(self, tag: str) -> bool:
        """Check if product has a specific tag"""
        return tag.lower() in self.get_tags_list()

    def set_tags_from_list(self, tags_list: list):
        """Set tags from a list"""
        if not tags_list:
            self.tags = None
        else:
            self.tags = ','.join([tag.strip().lower() for tag in tags_list if tag.strip()])

    @property
    def gender(self) -> str:
        """Get gender from catalogue"""
        return self.catalogue.gender if self.catalogue else None

    @property
    def platform(self):
        """Get platform from category"""
        return self.category.platform if self.category else None


class ProductVariant(Base):
    """
    Represents size/style variations of a product.
    Color is stored at Product level, not variant level.
    Each variant has its own SKU and optional price override.
    """
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_name = Column(String(255), nullable=True)  # Size 9, Size 10, etc.
    sku = Column(String(100), unique=True, nullable=True)
    price_override = Column(Integer, nullable=True)
    mrp_override = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete support

    # Relationships
    product = relationship("Product", back_populates="variants")
    options = relationship("VariantOption", back_populates="variant", cascade="all, delete-orphan")
    media_assets = relationship("MediaAsset", back_populates="variant")


class VariantOption(Base):
    """
    Represents size/fit/dimension options for a variant.
    Each option tracks its own stock quantity.
    """
    __tablename__ = "variant_options"

    id = Column(Integer, primary_key=True, autoincrement=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    option_name = Column(String(100), nullable=False)  # size | waist | length
    option_value = Column(String(100), nullable=False)  # 9 | XL | 42cm
    stock_quantity = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)

    # Relationships
    variant = relationship("ProductVariant", back_populates="options")


class MediaAsset(Base):
    """
    Stores all images, banners, and videos.
    Can be associated with products, variants, or used as catalogue banners.
    """
    __tablename__ = "media_assets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    media_type = Column(String(20), nullable=False)  # image | video
    usage_type = Column(String(50), nullable=False)  # catalogue | lifestyle | banner
    platform = Column(String(50), nullable=True)  # website | instagram | ads
    cloudinary_url = Column(Text, nullable=False)
    folder_path = Column(Text, nullable=False)
    public_id = Column(String(255), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    aspect_ratio = Column(String(20), nullable=True)
    display_order = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)
    status = Column(String(20), default="approved")
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete support

    # Relationships
    product = relationship("Product", back_populates="media_assets")
    variant = relationship("ProductVariant", back_populates="media_assets")


class FootwearDetails(Base):
    """
    Footwear-specific attributes.
    One-to-one relationship with Product.
    """
    __tablename__ = "footwear_details"

    product_id = Column(Integer, ForeignKey("products.id"), primary_key=True)
    upper_material = Column(String(255), nullable=True)
    sole_material = Column(String(255), nullable=True)
    closure_type = Column(String(100), nullable=True)
    toe_shape = Column(String(100), nullable=True)
    heel_height_mm = Column(Integer, nullable=True)
    weight_grams = Column(Integer, nullable=True)
    size_chart_type = Column(String(100), nullable=True)

    # Relationship
    product = relationship("Product", back_populates="footwear_details")


# ========================
# Order & Address Models
# ========================

class Address(Base):
    """
    User addresses for shipping/billing.
    Supports both registered users and guest checkout.
    """
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), nullable=True)  # Supabase user ID (null for guest)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False)
    email = Column(String(255), nullable=True)
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    landmark = Column(String(100), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(6), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    orders = relationship("Order", back_populates="shipping_address")


class Order(Base):
    """
    Order records - prepaid only.
    Supports both registered users and guest checkout.
    """
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_number = Column(String(50), nullable=False, unique=True)
    user_id = Column(String(255), nullable=True)  # Supabase user ID (null for guest)
    
    # Guest info (when user_id is null)
    guest_email = Column(String(255), nullable=True)
    guest_phone = Column(String(15), nullable=True)
    guest_name = Column(String(100), nullable=True)
    
    # Status
    status = Column(String(30), default="pending")  # OrderStatus enum
    payment_status = Column(String(30), default="pending")  # PaymentStatus enum
    payment_method = Column(String(30), nullable=False)  # PaymentMethod enum
    payment_transaction_id = Column(String(255), nullable=True)
    
    # Pricing (in rupees)
    subtotal = Column(Integer, nullable=False)
    shipping_charge = Column(Integer, default=0)
    discount_amount = Column(Integer, default=0)
    total_amount = Column(Integer, nullable=False)
    
    # Shipping
    shipping_address_id = Column(Integer, ForeignKey("addresses.id"), nullable=False)
    shipping_partner = Column(String(50), nullable=True)  # ShippingPartner enum
    tracking_number = Column(String(100), nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)
    
    # Video call verification
    video_call_completed = Column(Boolean, default=False)
    video_call_approved = Column(Boolean, default=False)
    
    # Notes
    order_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)

    # Relationships
    shipping_address = relationship("Address", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    return_requests = relationship("ReturnRequest", back_populates="order")


class OrderItem(Base):
    """
    Individual items in an order.
    """
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    option_id = Column(Integer, ForeignKey("variant_options.id"), nullable=True)
    
    # Denormalized product info (in case product changes/deletes)
    product_name = Column(String(255), nullable=False)
    variant_name = Column(String(255), nullable=True)
    size = Column(String(50), nullable=False)
    color = Column(String(50), nullable=True)
    image_url = Column(Text, nullable=True)
    
    # Pricing
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Integer, nullable=False)  # Price in rupees
    total_price = Column(Integer, nullable=False)  # unit_price * quantity
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    option = relationship("VariantOption")


class ReturnRequest(Base):
    """
    Return/exchange requests.
    """
    __tablename__ = "return_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    
    # Status
    status = Column(String(30), default="pending")  # pending, approved, rejected, completed
    reason = Column(String(50), nullable=False)  # ReturnReason enum
    description = Column(Text, nullable=True)
    
    # Evidence
    has_unboxing_video = Column(Boolean, default=False)
    images = Column(Text, nullable=True)  # JSON array of image URLs
    
    # Processing
    admin_notes = Column(Text, nullable=True)
    refund_amount = Column(Integer, nullable=True)
    refund_upi_id = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="return_requests")
    items = relationship("ReturnRequestItem", back_populates="return_request")


class ReturnRequestItem(Base):
    """
    Items included in a return request.
    """
    __tablename__ = "return_request_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    return_request_id = Column(Integer, ForeignKey("return_requests.id"), nullable=False)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False)

    # Relationships
    return_request = relationship("ReturnRequest", back_populates="items")
    order_item = relationship("OrderItem")


class ContactSubmission(Base):
    """
    Contact form submissions.
    """
    __tablename__ = "contact_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(15), nullable=True)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="new")  # new, read, replied, closed
    created_at = Column(DateTime, default=datetime.utcnow)
    replied_at = Column(DateTime, nullable=True)


# Future extension models (placeholders)
class ClothingDetails(Base):
    """
    Clothing-specific attributes (future implementation).
    """
    __tablename__ = "clothing_details"

    product_id = Column(Integer, ForeignKey("products.id"), primary_key=True)
    fabric = Column(String(255), nullable=True)
    fit_type = Column(String(100), nullable=True)  # slim | regular | loose
    care_instructions = Column(Text, nullable=True)
    pattern = Column(String(100), nullable=True)
    sleeve_type = Column(String(100), nullable=True)

    product = relationship("Product")


class AccessoryDetails(Base):
    """
    Accessory-specific attributes (future implementation).
    """
    __tablename__ = "accessory_details"

    product_id = Column(Integer, ForeignKey("products.id"), primary_key=True)
    material = Column(String(255), nullable=True)
    dimensions = Column(String(255), nullable=True)
    weight_grams = Column(Integer, nullable=True)

    product = relationship("Product")

