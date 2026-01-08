-- Migration: Add tags column to products table
-- Description: Adds a TEXT column for product tags (comma-separated values)
-- This enables flexible product categorization for homepage sections and marketing
-- Date: 2026-01-05

-- ===========================================
-- ADD TAGS COLUMN TO PRODUCTS TABLE
-- ===========================================

-- Add the tags column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN products.tags IS 'Comma-separated product tags for categorization. Valid tags: new, trending, featured, bestseller, sale, hot, limited, exclusive, popular, seasonal, clearance';

-- ===========================================
-- MIGRATE EXISTING is_featured DATA TO TAGS
-- ===========================================
-- If is_featured is true, add 'featured' to tags

UPDATE products 
SET tags = 'featured' 
WHERE is_featured = TRUE AND (tags IS NULL OR tags = '');

UPDATE products 
SET tags = CONCAT(tags, ',featured')
WHERE is_featured = TRUE AND tags IS NOT NULL AND tags != '' AND tags NOT LIKE '%featured%';

-- ===========================================
-- CREATE INDEX FOR PERFORMANCE
-- ===========================================

-- Create a GIN index for faster tag searches (PostgreSQL specific)
-- This allows for efficient LIKE queries on the tags column
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin (to_tsvector('english', COALESCE(tags, '')));

-- Alternative B-tree index for simpler queries
CREATE INDEX IF NOT EXISTS idx_products_tags_btree ON products (tags);

-- ===========================================
-- SAMPLE DATA - ADD TAGS TO SOME PRODUCTS
-- ===========================================
-- Uncomment and modify these if you want to add sample tags

-- UPDATE products SET tags = 'new,featured' WHERE id = 1;
-- UPDATE products SET tags = 'trending,hot' WHERE id = 2;
-- UPDATE products SET tags = 'bestseller,popular' WHERE id = 3;
-- UPDATE products SET tags = 'sale,clearance' WHERE id = 4;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Verify the column was added
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name = 'tags';

-- Show products with tags
-- SELECT id, name, is_featured, tags FROM products WHERE tags IS NOT NULL LIMIT 10;

-- ===========================================
-- AVAILABLE TAGS REFERENCE
-- ===========================================
-- 
-- new        - New arrivals
-- trending   - Trending products  
-- featured   - Featured on homepage
-- bestseller - Best selling products
-- sale       - Products on sale
-- hot        - Hot/popular products
-- limited    - Limited edition
-- exclusive  - Exclusive products
-- popular    - Popular products
-- seasonal   - Seasonal collection
-- clearance  - Clearance items
--
-- Usage in API:
-- GET /products/listing?tags=new,trending  (products with both 'new' AND 'trending' tags)
-- GET /products/listing?tags=featured      (products with 'featured' tag)
--
-- ===========================================
