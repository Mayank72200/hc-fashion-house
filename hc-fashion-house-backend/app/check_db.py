import sqlite3
from database.connection import get_db
from database.db_models import Product, Category
from services.catalogue_service import product_to_dict

# Check database tables
db_path = 'database/ecom.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print('=== ALL TABLES ===')
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
for table in tables:
    print(f'  {table[0]}')

# Check if product_categories exists
print('\n=== PRODUCT_CATEGORIES TABLE ===')
try:
    cursor.execute('SELECT * FROM product_categories')
    rows = cursor.fetchall()
    print(f'  Rows: {len(rows)}')
    for row in rows:
        print(f'  {row}')
except Exception as e:
    print(f'  Error: {e}')

# Check categories table
print('\n=== CATEGORIES TABLE ===')
try:
    cursor.execute('SELECT id, name, slug FROM categories LIMIT 10')
    rows = cursor.fetchall()
    for row in rows:
        print(f'  ID: {row[0]}, Name: {row[1]}, Slug: {row[2]}')
except Exception as e:
    print(f'  Error: {e}')

conn.close()

# Check via ORM
print('\n=== PRODUCT 11 VIA ORM ===')
db = next(get_db())
try:
    from sqlalchemy.orm import joinedload
    product = db.query(Product).options(joinedload(Product.categories)).filter(Product.id == 11).first()
    if product:
        print(f'  Product: {product.name}')
        print(f'  Categories relationship: {product.categories}')
        print(f'  Category objects: {[(c.id, c.name) for c in product.categories] if product.categories else "None"}')
        
        result = product_to_dict(product)
        print(f'  product_to_dict result:')
        print(f'    category_ids: {result.get("category_ids")}')
except Exception as e:
    print(f'  Error: {e}')
    import traceback
    traceback.print_exc()
finally:
    db.close()
