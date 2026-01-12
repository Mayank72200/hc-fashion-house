"""
Migration: Add product_categories association table for many-to-many relationship
Allows products to belong to multiple categories
"""
import sqlite3
from pathlib import Path

def migrate():
    """Run the migration"""
    db_path = Path(__file__).parent.parent / "ecommerce.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create the association table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_categories (
                product_id INTEGER NOT NULL,
                category_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (product_id, category_id),
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        """)
        
        # Migrate existing data from products.category_id to product_categories
        cursor.execute("""
            INSERT INTO product_categories (product_id, category_id)
            SELECT id, category_id 
            FROM products 
            WHERE category_id IS NOT NULL
        """)
        
        # Note: We're NOT dropping the category_id column yet for backward compatibility
        # It can be dropped in a future migration after ensuring everything works
        
        conn.commit()
        print("✅ Migration successful: Created product_categories association table")
        print(f"✅ Migrated existing category relationships to association table")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
