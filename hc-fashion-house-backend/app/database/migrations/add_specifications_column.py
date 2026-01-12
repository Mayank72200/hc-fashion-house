"""
Migration: Add specifications column to products table
Date: 2026-01-12
"""

import sqlite3
import sys
from pathlib import Path

# Add parent directory to path to import settings
sys.path.append(str(Path(__file__).parent.parent.parent))
from configs.settings import settings

def run_migration():
    """Add specifications column to products table"""
    
    # Get database URL from settings
    db_url = settings.get_database_url()
    db_path = db_url.replace('sqlite:///', '')
    
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(products)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'specifications' in columns:
            print("✅ specifications column already exists")
            return
        
        # Add specifications column
        print("Adding specifications column to products table...")
        cursor.execute("""
            ALTER TABLE products 
            ADD COLUMN specifications TEXT
        """)
        
        conn.commit()
        print("✅ Migration successful: Added specifications column to products table")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
