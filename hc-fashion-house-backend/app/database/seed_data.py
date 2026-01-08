"""
Seed data for HC Fashion House E-commerce Platform
Updated for new schema with Platform, Brand, and hierarchical structure
"""
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from .db_models import (
    Platform, Brand, Category, Catalogue, Product, 
    ProductVariant, VariantOption, ProductImage, FootwearDetails
)


# =============================================================================
# PLATFORM SEED DATA
# =============================================================================
PLATFORMS = [
    {"name": "Footwear", "slug": "footwear"},
    {"name": "Clothing", "slug": "clothing"},
    {"name": "Accessories", "slug": "accessories"},
    {"name": "Bags", "slug": "bags"},
    {"name": "Watches", "slug": "watches"},
]


def seed_platforms(db: Session) -> dict:
    """Seed platforms and return a dict mapping slug to platform object."""
    platform_map = {}
    
    for platform_data in PLATFORMS:
        existing = db.query(Platform).filter(Platform.slug == platform_data["slug"]).first()
        if existing:
            platform_map[platform_data["slug"]] = existing
        else:
            platform = Platform(**platform_data)
            db.add(platform)
            db.flush()
            platform_map[platform_data["slug"]] = platform
    
    db.commit()
    print(f"✓ Seeded {len(platform_map)} platforms")
    return platform_map


# =============================================================================
# BRAND SEED DATA
# =============================================================================
BRANDS = [
    {"name": "Nike", "slug": "nike"},
    {"name": "Adidas", "slug": "adidas"},
    {"name": "Puma", "slug": "puma"},
    {"name": "Reebok", "slug": "reebok"},
    {"name": "New Balance", "slug": "new-balance"},
    {"name": "Converse", "slug": "converse"},
    {"name": "Vans", "slug": "vans"},
    {"name": "Jordan", "slug": "jordan"},
    {"name": "Under Armour", "slug": "under-armour"},
    {"name": "Asics", "slug": "asics"},
    {"name": "Fila", "slug": "fila"},
    {"name": "Skechers", "slug": "skechers"},
    {"name": "Timberland", "slug": "timberland"},
    {"name": "Dr. Martens", "slug": "dr-martens"},
    {"name": "Clarks", "slug": "clarks"},
    {"name": "Steve Madden", "slug": "steve-madden"},
    {"name": "Zara", "slug": "zara"},
    {"name": "H&M", "slug": "h-and-m"},
    {"name": "Uniqlo", "slug": "uniqlo"},
    {"name": "Levi's", "slug": "levis"},
    {"name": "Tommy Hilfiger", "slug": "tommy-hilfiger"},
    {"name": "Calvin Klein", "slug": "calvin-klein"},
    {"name": "Ralph Lauren", "slug": "ralph-lauren"},
    {"name": "Gucci", "slug": "gucci"},
    {"name": "Louis Vuitton", "slug": "louis-vuitton"},
    {"name": "Prada", "slug": "prada"},
    {"name": "Balenciaga", "slug": "balenciaga"},
    {"name": "Generic", "slug": "generic"},
    {"name": "HC Fashion House", "slug": "hc-fashion-house"},
]


def seed_brands(db: Session) -> dict:
    """Seed brands and return a dict mapping slug to brand object."""
    brand_map = {}
    
    for brand_data in BRANDS:
        existing = db.query(Brand).filter(Brand.slug == brand_data["slug"]).first()
        if existing:
            brand_map[brand_data["slug"]] = existing
        else:
            brand = Brand(**brand_data)
            db.add(brand)
            db.flush()
            brand_map[brand_data["slug"]] = brand
    
    db.commit()
    print(f"✓ Seeded {len(brand_map)} brands")
    return brand_map


# =============================================================================
# CATEGORY SEED DATA (organized by platform)
# =============================================================================
CATEGORIES_BY_PLATFORM = {
    "footwear": [
        {"name": "Sneakers", "slug": "sneakers"},
        {"name": "Running Shoes", "slug": "running-shoes"},
        {"name": "Casual Shoes", "slug": "casual-shoes"},
        {"name": "Formal Shoes", "slug": "formal-shoes"},
        {"name": "Boots", "slug": "boots"},
        {"name": "Sandals", "slug": "sandals"},
        {"name": "Flip Flops", "slug": "flip-flops"},
        {"name": "Loafers", "slug": "loafers"},
        {"name": "Heels", "slug": "heels"},
        {"name": "Flats", "slug": "flats"},
        {"name": "Sports Shoes", "slug": "sports-shoes"},
        {"name": "Slides", "slug": "slides"},
        {"name": "Espadrilles", "slug": "espadrilles"},
    ],
    "clothing": [
        {"name": "T-Shirts", "slug": "t-shirts"},
        {"name": "Shirts", "slug": "shirts"},
        {"name": "Jeans", "slug": "jeans"},
        {"name": "Trousers", "slug": "trousers"},
        {"name": "Shorts", "slug": "shorts"},
        {"name": "Dresses", "slug": "dresses"},
        {"name": "Skirts", "slug": "skirts"},
        {"name": "Jackets", "slug": "jackets"},
        {"name": "Hoodies", "slug": "hoodies"},
        {"name": "Sweaters", "slug": "sweaters"},
        {"name": "Suits", "slug": "suits"},
        {"name": "Activewear", "slug": "activewear"},
    ],
    "accessories": [
        {"name": "Belts", "slug": "belts"},
        {"name": "Wallets", "slug": "wallets"},
        {"name": "Sunglasses", "slug": "sunglasses"},
        {"name": "Hats & Caps", "slug": "hats-caps"},
        {"name": "Scarves", "slug": "scarves"},
        {"name": "Ties", "slug": "ties"},
        {"name": "Jewelry", "slug": "jewelry"},
        {"name": "Socks", "slug": "socks"},
    ],
    "bags": [
        {"name": "Backpacks", "slug": "backpacks"},
        {"name": "Handbags", "slug": "handbags"},
        {"name": "Shoulder Bags", "slug": "shoulder-bags"},
        {"name": "Tote Bags", "slug": "tote-bags"},
        {"name": "Clutches", "slug": "clutches"},
        {"name": "Duffel Bags", "slug": "duffel-bags"},
        {"name": "Messenger Bags", "slug": "messenger-bags"},
    ],
    "watches": [
        {"name": "Analog Watches", "slug": "analog-watches"},
        {"name": "Digital Watches", "slug": "digital-watches"},
        {"name": "Smart Watches", "slug": "smart-watches"},
        {"name": "Luxury Watches", "slug": "luxury-watches"},
        {"name": "Sports Watches", "slug": "sports-watches"},
    ],
}


def seed_categories(db: Session, platform_map: dict) -> dict:
    """Seed categories and return a dict mapping slug to category object."""
    category_map = {}
    
    for platform_slug, categories in CATEGORIES_BY_PLATFORM.items():
        platform = platform_map.get(platform_slug)
        if not platform:
            print(f"⚠ Platform '{platform_slug}' not found, skipping categories")
            continue
            
        for cat_data in categories:
            existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if existing:
                category_map[cat_data["slug"]] = existing
            else:
                category = Category(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    platform_id=platform.id
                )
                db.add(category)
                db.flush()
                category_map[cat_data["slug"]] = category
    
    db.commit()
    print(f"✓ Seeded {len(category_map)} categories")
    return category_map


# =============================================================================
# SAMPLE CATALOGUE SEED DATA
# =============================================================================
SAMPLE_CATALOGUES = [
    {
        "name": "Air Max 90",
        "slug": "air-max-90",
        "description": "The iconic Nike Air Max 90 featuring visible Air cushioning",
        "category_slug": "sneakers",
        "gender": "men",
        "is_featured": True,
    },
    {
        "name": "Classic Leather",
        "slug": "classic-leather",
        "description": "Timeless Reebok Classic Leather sneakers",
        "category_slug": "sneakers",
        "gender": "women",
        "is_featured": True,
    },
    {
        "name": "Ultraboost 22",
        "slug": "ultraboost-22",
        "description": "Adidas Ultraboost with responsive Boost cushioning",
        "category_slug": "running-shoes",
        "gender": "unisex",
        "is_featured": True,
    },
    {
        "name": "Chuck Taylor All Star",
        "slug": "chuck-taylor-all-star",
        "description": "The legendary Converse Chuck Taylor sneakers",
        "category_slug": "casual-shoes",
        "gender": "unisex",
        "is_featured": False,
    },
    {
        "name": "Old Skool",
        "slug": "old-skool",
        "description": "Classic Vans Old Skool with iconic side stripe",
        "category_slug": "casual-shoes",
        "gender": "unisex",
        "is_featured": False,
    },
]


def seed_catalogues(db: Session, category_map: dict) -> dict:
    """Seed sample catalogues and return a dict mapping slug to catalogue object."""
    catalogue_map = {}
    
    for cat_data in SAMPLE_CATALOGUES:
        category = category_map.get(cat_data["category_slug"])
        if not category:
            print(f"⚠ Category '{cat_data['category_slug']}' not found, skipping catalogue")
            continue
            
        existing = db.query(Catalogue).filter(Catalogue.slug == cat_data["slug"]).first()
        if existing:
            catalogue_map[cat_data["slug"]] = existing
        else:
            catalogue = Catalogue(
                name=cat_data["name"],
                slug=cat_data["slug"],
                description=cat_data.get("description"),
                category_id=category.id,
                gender=cat_data.get("gender", "unisex"),
                is_featured=cat_data.get("is_featured", False),
            )
            db.add(catalogue)
            db.flush()
            catalogue_map[cat_data["slug"]] = catalogue
    
    db.commit()
    print(f"✓ Seeded {len(catalogue_map)} catalogues")
    return catalogue_map


# =============================================================================
# SAMPLE PRODUCT SEED DATA
# =============================================================================
SAMPLE_PRODUCTS = [
    {
        "name": "Air Max 90 - White/Black",
        "slug": "air-max-90-white-black",
        "description": "Clean white and black colorway of the Air Max 90",
        "catalogue_slug": "air-max-90",
        "brand_slug": "nike",
        "color": "White/Black",
        "color_hex": "#FFFFFF",
        "mrp": 129.99,
        "price": None,
        "is_active": True,
    },
    {
        "name": "Air Max 90 - Triple Black",
        "slug": "air-max-90-triple-black",
        "description": "All-black colorway of the Air Max 90",
        "catalogue_slug": "air-max-90",
        "brand_slug": "nike",
        "color": "Triple Black",
        "color_hex": "#000000",
        "mrp": 129.99,
        "price": 109.99,
        "is_active": True,
    },
    {
        "name": "Ultraboost 22 - Core Black",
        "slug": "ultraboost-22-core-black",
        "description": "Core black colorway with responsive Boost",
        "catalogue_slug": "ultraboost-22",
        "brand_slug": "adidas",
        "color": "Core Black",
        "color_hex": "#1A1A1A",
        "mrp": 189.99,
        "price": None,
        "is_active": True,
    },
    {
        "name": "Chuck Taylor High - Red",
        "slug": "chuck-taylor-high-red",
        "description": "Classic red high-top Chuck Taylors",
        "catalogue_slug": "chuck-taylor-all-star",
        "brand_slug": "converse",
        "color": "Red",
        "color_hex": "#FF0000",
        "mrp": 69.99,
        "price": None,
        "is_active": True,
    },
]


def seed_products(db: Session, catalogue_map: dict, brand_map: dict) -> dict:
    """Seed sample products and return a dict mapping slug to product object."""
    product_map = {}
    
    for prod_data in SAMPLE_PRODUCTS:
        catalogue = catalogue_map.get(prod_data["catalogue_slug"])
        brand = brand_map.get(prod_data["brand_slug"])
        
        if not catalogue:
            print(f"⚠ Catalogue '{prod_data['catalogue_slug']}' not found, skipping product")
            continue
        if not brand:
            print(f"⚠ Brand '{prod_data['brand_slug']}' not found, skipping product")
            continue
            
        existing = db.query(Product).filter(Product.slug == prod_data["slug"]).first()
        if existing:
            product_map[prod_data["slug"]] = existing
        else:
            product = Product(
                name=prod_data["name"],
                slug=prod_data["slug"],
                description=prod_data.get("description"),
                catalogue_id=catalogue.id,
                brand_id=brand.id,
                color=prod_data.get("color"),
                color_hex=prod_data.get("color_hex"),
                mrp=prod_data["mrp"],
                price=prod_data.get("price"),
                is_active=prod_data.get("is_active", True),
            )
            db.add(product)
            db.flush()
            product_map[prod_data["slug"]] = product
    
    db.commit()
    print(f"✓ Seeded {len(product_map)} products")
    return product_map


# =============================================================================
# SAMPLE VARIANTS SEED DATA
# =============================================================================
SAMPLE_VARIANTS = [
    {
        "product_slug": "air-max-90-white-black",
        "sizes": ["7", "8", "9", "10", "11", "12"],
        "default_stock": 10,
    },
    {
        "product_slug": "air-max-90-triple-black",
        "sizes": ["7", "8", "9", "10", "11"],
        "default_stock": 8,
    },
    {
        "product_slug": "ultraboost-22-core-black",
        "sizes": ["6", "7", "8", "9", "10", "11", "12"],
        "default_stock": 5,
    },
    {
        "product_slug": "chuck-taylor-high-red",
        "sizes": ["5", "6", "7", "8", "9", "10", "11", "12"],
        "default_stock": 15,
    },
]


def seed_variants(db: Session, product_map: dict) -> None:
    """Seed sample variants for products."""
    variant_count = 0
    
    for variant_data in SAMPLE_VARIANTS:
        product = product_map.get(variant_data["product_slug"])
        if not product:
            print(f"⚠ Product '{variant_data['product_slug']}' not found, skipping variants")
            continue
        
        # Check if variants already exist for this product
        existing_count = db.query(ProductVariant).filter(
            ProductVariant.product_id == product.id
        ).count()
        
        if existing_count > 0:
            print(f"  Variants already exist for '{product.name}', skipping")
            continue
        
        for size in variant_data["sizes"]:
            sku = f"{product.slug}-{size}".upper().replace("-", "")
            variant = ProductVariant(
                product_id=product.id,
                sku=sku,
                size=size,
                stock_quantity=variant_data.get("default_stock", 10),
                is_active=True,
            )
            db.add(variant)
            variant_count += 1
    
    db.commit()
    print(f"✓ Seeded {variant_count} product variants")


# =============================================================================
# MAIN SEEDING FUNCTIONS
# =============================================================================
def seed_all(db: Session) -> None:
    """Seed all data in correct order."""
    print("\n" + "=" * 60)
    print("Starting HC Fashion House Database Seeding")
    print("=" * 60 + "\n")
    
    # Seed in order of dependencies
    platform_map = seed_platforms(db)
    brand_map = seed_brands(db)
    category_map = seed_categories(db, platform_map)
    catalogue_map = seed_catalogues(db, category_map)
    product_map = seed_products(db, catalogue_map, brand_map)
    seed_variants(db, product_map)
    
    print("\n" + "=" * 60)
    print("Database seeding completed successfully!")
    print("=" * 60 + "\n")


def seed_platforms_only(db: Session) -> dict:
    """Seed only platforms."""
    return seed_platforms(db)


def seed_brands_only(db: Session) -> dict:
    """Seed only brands."""
    return seed_brands(db)


def seed_categories_only(db: Session) -> dict:
    """Seed platforms and categories."""
    platform_map = seed_platforms(db)
    return seed_categories(db, platform_map)


def clear_all_data(db: Session) -> None:
    """Clear all data from the database (use with caution!)."""
    print("\n⚠ Clearing all data from database...")
    
    # Delete in reverse order of dependencies
    db.query(VariantOption).delete()
    db.query(ProductVariant).delete()
    db.query(FootwearDetails).delete()
    db.query(ProductImage).delete()
    db.query(Product).delete()
    db.query(Catalogue).delete()
    db.query(Category).delete()
    db.query(Brand).delete()
    db.query(Platform).delete()
    
    db.commit()
    print("✓ All data cleared\n")


# =============================================================================
# CLI ENTRY POINT
# =============================================================================
if __name__ == "__main__":
    from .connection import get_db, engine
    from .db_models import Base
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db = next(get_db())
    
    try:
        seed_all(db)
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

