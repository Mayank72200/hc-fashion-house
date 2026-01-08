"""
Database Migration Script - Schema Update v2
This script migrates the database to the new schema with:
- Platform table (first-class entity)
- Brand table (separate entity)
- Gender moved from products to catalogues
- Categories linked to platforms (no gender)
- product_type and gender removed from products
- color removed from product_variants

SQLite Compatible - Uses safe migration patterns.
"""
import sqlite3
import os
from datetime import datetime

# Database path - adjust as needed
DB_PATH = os.environ.get('DATABASE_PATH', os.path.join(os.path.dirname(__file__), 'ecommerce.db'))


def get_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def run_migration():
    """Run the full migration"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        print("Starting database migration...")
        
        # Step 1: Create new tables
        print("\n1. Creating new tables...")
        
        # Create platforms table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS platforms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                slug VARCHAR(100) NOT NULL UNIQUE,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("   ✓ Created platforms table")
        
        # Create brands table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL UNIQUE,
                slug VARCHAR(255) NOT NULL UNIQUE,
                logo_url TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("   ✓ Created brands table")
        
        # Step 2: Insert seed data for platforms
        print("\n2. Inserting platform seed data...")
        platforms = [
            ('Footwear', 'footwear'),
            ('Clothing', 'clothing'),
            ('Accessories', 'accessories'),
            ('Bags', 'bags'),
            ('Watches', 'watches'),
        ]
        for name, slug in platforms:
            cursor.execute("""
                INSERT OR IGNORE INTO platforms (name, slug, is_active)
                VALUES (?, ?, 1)
            """, (name, slug))
        print(f"   ✓ Inserted {len(platforms)} platforms")
        
        # Step 3: Insert seed data for brands
        print("\n3. Inserting brand seed data...")
        brands = [
            ('Nike', 'nike'),
            ('Adidas', 'adidas'),
            ('Puma', 'puma'),
            ('Reebok', 'reebok'),
            ('New Balance', 'new-balance'),
            ('Converse', 'converse'),
            ('Vans', 'vans'),
            ('Jordan', 'jordan'),
            ('Skechers', 'skechers'),
            ('Fila', 'fila'),
            ('Under Armour', 'under-armour'),
            ('ASICS', 'asics'),
            ('Brooks', 'brooks'),
            ('Hoka', 'hoka'),
            ('Clarks', 'clarks'),
            ('Cole Haan', 'cole-haan'),
            ('Other', 'other'),
        ]
        for name, slug in brands:
            cursor.execute("""
                INSERT OR IGNORE INTO brands (name, slug, is_active)
                VALUES (?, ?, 1)
            """, (name, slug))
        print(f"   ✓ Inserted {len(brands)} brands")
        
        # Step 4: Migrate categories - add platform_id
        print("\n4. Migrating categories table...")
        
        # Check if platform_id already exists
        cursor.execute("PRAGMA table_info(categories)")
        columns = [col['name'] for col in cursor.fetchall()]
        
        if 'platform_id' not in columns:
            # Get the footwear platform ID
            cursor.execute("SELECT id FROM platforms WHERE slug = 'footwear'")
            footwear_id = cursor.fetchone()['id']
            
            # SQLite: Create new table, copy data, drop old, rename
            cursor.execute("""
                CREATE TABLE categories_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL UNIQUE,
                    platform_id INTEGER NOT NULL DEFAULT 1,
                    parent_id INTEGER,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    deleted_at DATETIME,
                    FOREIGN KEY (platform_id) REFERENCES platforms(id),
                    FOREIGN KEY (parent_id) REFERENCES categories(id)
                )
            """)
            
            # Copy data (assign all to footwear platform by default)
            cursor.execute(f"""
                INSERT INTO categories_new (id, name, slug, platform_id, parent_id, is_active, created_at, deleted_at)
                SELECT id, name, slug, {footwear_id}, parent_id, is_active, created_at, deleted_at
                FROM categories
            """)
            
            # Drop old table and rename
            cursor.execute("DROP TABLE categories")
            cursor.execute("ALTER TABLE categories_new RENAME TO categories")
            print("   ✓ Added platform_id to categories (removed genders)")
        else:
            print("   ⊘ platform_id already exists in categories")
        
        # Step 5: Migrate catalogues - add gender column
        print("\n5. Migrating catalogues table...")
        
        cursor.execute("PRAGMA table_info(catalogues)")
        columns = [col['name'] for col in cursor.fetchall()]
        
        if 'gender' not in columns:
            cursor.execute("""
                CREATE TABLE catalogues_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL UNIQUE,
                    description TEXT,
                    category_id INTEGER,
                    gender VARCHAR(20) NOT NULL DEFAULT 'unisex',
                    banner_media_id INTEGER,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    deleted_at DATETIME,
                    FOREIGN KEY (category_id) REFERENCES categories(id),
                    FOREIGN KEY (banner_media_id) REFERENCES media_assets(id)
                )
            """)
            
            # Copy data (default gender to 'unisex' or try to get from products)
            cursor.execute("""
                INSERT INTO catalogues_new (id, name, slug, description, category_id, gender, banner_media_id, is_active, created_at, deleted_at)
                SELECT id, name, slug, description, category_id, 'unisex', banner_media_id, is_active, created_at, deleted_at
                FROM catalogues
            """)
            
            cursor.execute("DROP TABLE catalogues")
            cursor.execute("ALTER TABLE catalogues_new RENAME TO catalogues")
            print("   ✓ Added gender to catalogues")
        else:
            print("   ⊘ gender already exists in catalogues")
        
        # Step 6: Migrate products - add brand_id, remove gender/product_type
        print("\n6. Migrating products table...")
        
        cursor.execute("PRAGMA table_info(products)")
        columns = [col['name'] for col in cursor.fetchall()]
        
        if 'brand_id' not in columns:
            # Get 'Other' brand ID as default
            cursor.execute("SELECT id FROM brands WHERE slug = 'other'")
            other_brand = cursor.fetchone()
            default_brand_id = other_brand['id'] if other_brand else 1
            
            cursor.execute(f"""
                CREATE TABLE products_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL UNIQUE,
                    brand_id INTEGER DEFAULT {default_brand_id},
                    category_id INTEGER NOT NULL,
                    catalogue_id INTEGER NOT NULL,
                    color VARCHAR(100),
                    price INTEGER NOT NULL,
                    mrp INTEGER,
                    short_description TEXT,
                    long_description TEXT,
                    is_featured BOOLEAN DEFAULT 0,
                    tags TEXT,
                    status VARCHAR(20) DEFAULT 'draft',
                    meta_title VARCHAR(255),
                    meta_description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME,
                    deleted_at DATETIME,
                    FOREIGN KEY (brand_id) REFERENCES brands(id),
                    FOREIGN KEY (category_id) REFERENCES categories(id),
                    FOREIGN KEY (catalogue_id) REFERENCES catalogues(id)
                )
            """)
            
            # Copy data (need to handle existing brand strings -> brand_id)
            cursor.execute(f"""
                INSERT INTO products_new (
                    id, name, slug, brand_id, category_id, catalogue_id, color,
                    price, mrp, short_description, long_description, is_featured,
                    tags, status, meta_title, meta_description, created_at, updated_at, deleted_at
                )
                SELECT 
                    p.id, p.name, p.slug, 
                    COALESCE((SELECT b.id FROM brands b WHERE LOWER(b.name) = LOWER(p.brand)), {default_brand_id}),
                    p.category_id, 
                    COALESCE(p.catalogue_id, 1),
                    p.color, p.price, p.mrp, p.short_description, p.long_description,
                    p.is_featured, p.tags, p.status, p.meta_title, p.meta_description,
                    p.created_at, p.updated_at, p.deleted_at
                FROM products p
            """)
            
            # Skip trying to update catalogues from products - just keep default 'unisex'
            # Gender can be set manually by admin later
            
            cursor.execute("DROP TABLE products")
            cursor.execute("ALTER TABLE products_new RENAME TO products")
            print("   ✓ Migrated products (added brand_id, removed gender/product_type)")
        else:
            print("   ⊘ products already migrated")
        
        # Step 7: Migrate product_variants - remove color column
        print("\n7. Migrating product_variants table...")
        
        cursor.execute("PRAGMA table_info(product_variants)")
        columns = [col['name'] for col in cursor.fetchall()]
        
        if 'color' in columns:
            cursor.execute("""
                CREATE TABLE product_variants_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    variant_name VARCHAR(255),
                    sku VARCHAR(100) UNIQUE,
                    price_override INTEGER,
                    mrp_override INTEGER,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    deleted_at DATETIME,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            """)
            
            cursor.execute("""
                INSERT INTO product_variants_new (
                    id, product_id, variant_name, sku, price_override, mrp_override,
                    is_active, created_at, deleted_at
                )
                SELECT id, product_id, variant_name, sku, price_override, mrp_override,
                       is_active, created_at, deleted_at
                FROM product_variants
            """)
            
            cursor.execute("DROP TABLE product_variants")
            cursor.execute("ALTER TABLE product_variants_new RENAME TO product_variants")
            print("   ✓ Removed color from product_variants")
        else:
            print("   ⊘ product_variants already migrated")
        
        # Step 8: Insert seed data for categories (under footwear platform)
        print("\n8. Inserting category seed data...")
        
        cursor.execute("SELECT id FROM platforms WHERE slug = 'footwear'")
        footwear_id = cursor.fetchone()['id']
        
        footwear_categories = [
            ('Sneakers', 'sneakers'),
            ('Sports Shoes', 'sports'),
            ('Running', 'running'),
            ('Casual', 'casual'),
            ('Formal', 'formal'),
            ('Loafers', 'loafers'),
            ('Boots', 'boots'),
            ('Sandals', 'sandals'),
            ('Slippers', 'slippers'),
            ('Heels', 'heels'),
            ('Flats', 'flats'),
            ('Wedges', 'wedges'),
            ('School Shoes', 'school'),
        ]
        
        for name, slug in footwear_categories:
            cursor.execute("""
                INSERT OR IGNORE INTO categories (name, slug, platform_id, is_active)
                VALUES (?, ?, ?, 1)
            """, (name, slug, footwear_id))
        print(f"   ✓ Inserted {len(footwear_categories)} footwear categories")
        
        # Commit all changes
        conn.commit()
        print("\n✓ Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ Migration failed: {e}")
        raise
    finally:
        conn.close()


def verify_migration():
    """Verify the migration was successful"""
    conn = get_connection()
    cursor = conn.cursor()
    
    print("\n--- Verification ---")
    
    # Check platforms
    cursor.execute("SELECT COUNT(*) as count FROM platforms")
    print(f"Platforms: {cursor.fetchone()['count']}")
    
    # Check brands
    cursor.execute("SELECT COUNT(*) as count FROM brands")
    print(f"Brands: {cursor.fetchone()['count']}")
    
    # Check categories
    cursor.execute("SELECT COUNT(*) as count FROM categories")
    print(f"Categories: {cursor.fetchone()['count']}")
    
    # Check catalogues has gender
    cursor.execute("PRAGMA table_info(catalogues)")
    columns = [col['name'] for col in cursor.fetchall()]
    print(f"Catalogues columns: {', '.join(columns)}")
    
    # Check products has brand_id and no gender/product_type
    cursor.execute("PRAGMA table_info(products)")
    columns = [col['name'] for col in cursor.fetchall()]
    print(f"Products columns: {', '.join(columns)}")
    
    # Check product_variants has no color
    cursor.execute("PRAGMA table_info(product_variants)")
    columns = [col['name'] for col in cursor.fetchall()]
    print(f"ProductVariants columns: {', '.join(columns)}")
    
    conn.close()


if __name__ == "__main__":
    run_migration()
    verify_migration()
