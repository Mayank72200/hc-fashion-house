from database.connection import get_db
from database.db_models import Product

# Get database session
db = next(get_db())

# Find products with 'best-seller' tag
products = db.query(Product).filter(Product.tags.like('%best-seller%')).all()

print(f"Found {len(products)} product(s) with 'best-seller' tag")

for product in products:
    print(f"\nProduct: {product.name}")
    print(f"Old tags: {product.tags}")
    
    # Replace 'best-seller' with 'bestseller'
    if product.tags:
        product.tags = product.tags.replace('best-seller', 'bestseller')
    
    print(f"New tags: {product.tags}")

# Commit changes
db.commit()
print("\nTags updated successfully!")
