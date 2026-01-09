/**
 * useProducts Hook - Fetches products from API with fallback to mock data
 * Provides loading states, error handling, and data transformation
 */
import { useState, useEffect, useCallback } from 'react';
import { ProductAPI, CatalogueAPI, CategoryAPI, PRODUCT_TAGS } from '@/lib/api';
import { menProducts, womenProducts, kidsProducts, segmentBrands } from '@/data/products';
import { toIndianSizes } from '@/utils/sizeConversion';

// Check if API is available
const API_ENABLED = Boolean(import.meta.env.VITE_API_URL);

// Export PRODUCT_TAGS for use in components
export { PRODUCT_TAGS };

/**
 * Transform API product to frontend format
 */
function transformProduct(apiProduct) {
  // Get tags from API or default to empty array
  const tags = apiProduct.tags || [];
  
  // API returns 'price' (selling price) and 'mrp' (original price)
  // Prices are stored in rupees in DB
  const price = apiProduct.price || 0;
  const mrp = apiProduct.mrp || price;
  
  // Handle brand - can be string, object with name, or brand_name field
  let brandName = 'HC Fashion House';
  if (typeof apiProduct.brand === 'string') {
    brandName = apiProduct.brand;
  } else if (apiProduct.brand?.name) {
    brandName = apiProduct.brand.name;
  } else if (apiProduct.brand_name) {
    brandName = apiProduct.brand_name;
  }
  
  // Convert sizes to IND format for display
  // Get size chart type from footwear_details or raw data
  const sizeChartType = apiProduct.footwear_details?.size_chart_type || 
                        apiProduct._raw?.footwear_details?.size_chart_type || 
                        apiProduct.size_chart_type || 
                        'IND';
  
  // Get gender for size conversion
  const gender = apiProduct.gender || 'men';
  
  // Convert available sizes to IND format
  let displaySizes = apiProduct.available_sizes || [];
  if (sizeChartType && sizeChartType !== 'IND') {
    displaySizes = toIndianSizes(displaySizes, sizeChartType, gender);
  }
  
  return {
    id: apiProduct.id,
    slug: apiProduct.slug,
    name: apiProduct.name,
    brand: brandName,
    price: price,
    mrp: mrp > price ? mrp : null,  // Only show MRP if different from price
    image: apiProduct.primary_image_url || apiProduct.image_url || 'https://via.placeholder.com/400x400?text=No+Image',
    images: apiProduct.images || [apiProduct.primary_image_url || 'https://via.placeholder.com/400x400?text=No+Image'],
    sizes: displaySizes, // Converted to IND sizes for display
    originalSizes: apiProduct.available_sizes || [], // Keep original sizes
    sizeChartType: sizeChartType, // Original size system
    colors: apiProduct.available_colors || [],
    color: apiProduct.color, // Primary color of this product SKU
    colorHex: apiProduct.color_hex, // Hex color code
    catalogueId: apiProduct.catalogue_id, // Article/Design ID for color grouping
    rating: apiProduct.rating || 4.5,
    reviews: apiProduct.review_count || 0,
    gender: apiProduct.gender,
    segment: apiProduct.gender, // Map gender to segment for compatibility
    category: apiProduct.gender, // Map gender to category for compatibility
    // Tags-based properties
    tags: tags,
    isNew: tags.includes('new'),
    isTrending: tags.includes('trending'),
    isFeatured: tags.includes('featured') || apiProduct.is_featured,
    isHot: tags.includes('hot'),
    isBestseller: tags.includes('bestseller'),
    isOnSale: tags.includes('sale'),
    isLimited: tags.includes('limited'),
    isExclusive: tags.includes('exclusive'),
    isPopular: tags.includes('popular'),
    // Stock and discount info
    inStock: apiProduct.in_stock !== false,
    discountPercent: apiProduct.discount_percentage || apiProduct.discount_percent || 0,
    description: apiProduct.short_description || apiProduct.description || '',
    // Keep original API data for detailed views
    _raw: apiProduct,
  };
}

/**
 * Transform mock product to ensure consistent format with tags
 */
function transformMockProduct(p, gender) {
  // Build tags array from boolean flags if tags don't exist
  const tags = p.tags || [];
  if (!p.tags) {
    if (p.isNew) tags.push('new');
    if (p.isTrending) tags.push('trending');
    if (p.isHot) tags.push('hot');
    if (p.isFeatured) tags.push('featured');
  }
  
  return {
    ...p,
    gender,
    segment: gender,
    tags,
    isNew: tags.includes('new') || p.isNew,
    isTrending: tags.includes('trending') || p.isTrending,
    isHot: tags.includes('hot') || p.isHot,
    isFeatured: tags.includes('featured') || p.isFeatured,
  };
}

/**
 * Get mock products by segment/gender
 */
function getMockProductsByGender(gender) {
  switch (gender) {
    case 'men':
      return menProducts.map(p => transformMockProduct(p, 'men'));
    case 'women':
      return womenProducts.map(p => transformMockProduct(p, 'women'));
    case 'kids':
      return kidsProducts.map(p => transformMockProduct(p, 'kids'));
    default:
      return [
        ...menProducts.map(p => transformMockProduct(p, 'men')),
        ...womenProducts.map(p => transformMockProduct(p, 'women')),
        ...kidsProducts.map(p => transformMockProduct(p, 'kids')),
      ];
  }
}

/**
 * Hook for fetching product listing
 */
export function useProducts(options = {}) {
  const {
    gender,
    categoryId,
    catalogueId,
    brand,
    minPrice,
    maxPrice,
    isFeatured,
    tags,  // Can be a string (comma-separated) or array of tags
    inStockOnly,
    page = 1,
    perPage = 20,
    enabled = true,
  } = options;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProducts = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Get mock products first
      let mockProducts = getMockProductsByGender(gender);

      // Apply filters to mock data
      if (brand) {
        mockProducts = mockProducts.filter(p => p.brand === brand);
      }
      if (minPrice) {
        mockProducts = mockProducts.filter(p => p.price >= minPrice);
      }
      if (maxPrice) {
        mockProducts = mockProducts.filter(p => p.price <= maxPrice);
      }
      if (isFeatured) {
        mockProducts = mockProducts.filter(p => p.isFeatured || p.isTrending || p.isNew);
      }
      if (tags) {
        const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase());
        mockProducts = mockProducts.filter(p => {
          const productTags = p.tags || [];
          return tagList.every(tag => productTags.includes(tag));
        });
      }

      // Try to fetch from API and combine with mock data
      let apiProducts = [];
      if (API_ENABLED) {
        try {
          const response = await ProductAPI.getProductListing({
            gender,
            categoryId,
            catalogueId,
            brand,
            minPrice: minPrice ? minPrice : undefined, // Prices in rupees
            maxPrice: maxPrice ? maxPrice : undefined,
            isFeatured,
            tags,
            inStockOnly,
            page: 1,  // Get first page of API results
            perPage: 100,  // Get more results to merge
          });

          if (response?.items) {
            apiProducts = response.items.map(transformProduct);
          }
        } catch (apiErr) {
          console.warn('API fetch failed, using mock data only:', apiErr);
        }
      }

      // Combine API products with mock products
      // API products come first, then mock products (avoid duplicates by ID)
      const apiProductIds = new Set(apiProducts.map(p => p.id));
      const combinedProducts = [
        ...apiProducts,
        ...mockProducts.filter(p => !apiProductIds.has(p.id)),
      ];

      // Group products by catalogueId for color variants
      const catalogueGroups = {};
      combinedProducts.forEach(p => {
        if (p.catalogueId) {
          if (!catalogueGroups[p.catalogueId]) {
            catalogueGroups[p.catalogueId] = [];
          }
          catalogueGroups[p.catalogueId].push(p);
        }
      });

      // Add colorVariants to each product
      const productsWithVariants = combinedProducts.map(p => ({
        ...p,
        colorVariants: p.catalogueId ? catalogueGroups[p.catalogueId] || [] : [],
      }));

      // Pagination on combined results
      const startIndex = (page - 1) * perPage;
      const paginatedProducts = productsWithVariants.slice(startIndex, startIndex + perPage);

      setProducts(paginatedProducts);
      setTotal(productsWithVariants.length);
      setTotalPages(Math.ceil(productsWithVariants.length / perPage));
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err.message);

      // Fallback to mock data on error
      const mockProducts = getMockProductsByGender(gender);
      setProducts(mockProducts.slice(0, perPage));
      setTotal(mockProducts.length);
      setTotalPages(Math.ceil(mockProducts.length / perPage));
    } finally {
      setLoading(false);
    }
  }, [gender, categoryId, catalogueId, brand, minPrice, maxPrice, isFeatured, tags, inStockOnly, page, perPage, enabled]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    total,
    totalPages,
    page,
    refetch: fetchProducts,
  };
}

/**
 * Hook for fetching a single product detail
 * Returns product with color_options for color switching on PDP
 */
export function useProductDetail(productId) {
  const [product, setProduct] = useState(null);
  const [colorOptions, setColorOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if this is a mock product ID (starts with letter) vs API product ID (numeric)
        const isMockProductId = isNaN(Number(productId)) || String(productId).match(/^[a-zA-Z]/);
        
        if (API_ENABLED && !isMockProductId) {
          const response = await ProductAPI.getProductDetail(productId);
          const apiProduct = response.product || response;
          
          // Extract images from media_grouped.catalogue or fallback options
          // API returns: media_grouped: { catalogue: [{cloudinary_url, ...}], lifestyle: [], banner: [] }
          const catalogueImages = response.media_grouped?.catalogue || [];
          const images = catalogueImages.length > 0 
            ? catalogueImages.map(m => m.cloudinary_url)
            : (apiProduct.images || [apiProduct.primary_image_url || '/placeholder.jpg']);
          const primaryImage = images[0] || '/placeholder.jpg';
          
          // Get sizes from availability.sizes if available, otherwise from variants
          // Store the original size chart type for conversion
          const sizeChartType = apiProduct.footwear_details?.size_chart_type || 'IND';
          const gender = apiProduct.gender || 'men';
          
          const availabilitySizes = response.availability?.sizes || [];
          const sizes = availabilitySizes.length > 0
            ? availabilitySizes.map(s => {
                // Convert size to IND for display
                const originalSize = s.size;
                const indSizes = toIndianSizes([originalSize], sizeChartType, gender);
                const indSize = indSizes[0] || originalSize;
                
                return {
                  ind: indSize,
                  originalSize: originalSize,
                  sizeChartType: sizeChartType,
                  inStock: s.is_available && s.stock_quantity > 0,
                  stock: s.stock_quantity,
                  variantId: s.variant_id,
                };
              })
            : (apiProduct.variants || []).map(v => {
                const originalSize = v.size;
                const indSizes = toIndianSizes([originalSize], sizeChartType, gender);
                const indSize = indSizes[0] || originalSize;
                
                return {
                  ind: indSize,
                  originalSize: originalSize,
                  sizeChartType: sizeChartType,
                  inStock: v.stock_quantity > 0,
                  stock: v.stock_quantity,
                  sku: v.sku,
                };
              });
          
          // Transform footwear_details to specifications format
          // API: footwear_details: { upper_material, sole_material, ... }
          // Frontend: specifications: { "Upper Material": "...", ... }
          const specifications = {};
          if (apiProduct.footwear_details) {
            const fd = apiProduct.footwear_details;
            if (fd.upper_material) specifications['Upper Material'] = fd.upper_material;
            if (fd.sole_material) specifications['Sole Material'] = fd.sole_material;
            if (fd.closure_type) specifications['Closure Type'] = fd.closure_type;
            if (fd.toe_shape) specifications['Toe Shape'] = fd.toe_shape;
            if (fd.heel_height_mm) specifications['Heel Height'] = `${fd.heel_height_mm}mm`;
            if (fd.weight_grams) specifications['Weight'] = `${fd.weight_grams}g`;
            if (fd.size_chart_type) specifications['Size Chart'] = fd.size_chart_type;
          }
          
          // Extract features from long_description or use defaults
          const features = apiProduct.features || 
                          (apiProduct.long_description ? 
                            apiProduct.long_description.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim()) : 
                            ['Premium quality materials', 'Comfortable fit', 'Durable construction']);
          
          // Handle brand - can be string, object, or null
          let brandName = 'HC Fashion House';
          if (typeof apiProduct.brand === 'string') {
            brandName = apiProduct.brand;
          } else if (apiProduct.brand?.name) {
            brandName = apiProduct.brand.name;
          } else if (apiProduct.brand_name) {
            brandName = apiProduct.brand_name;
          }
          
          // Transform color_options for color swatches
          // API: color_options[{ product_id, name, color, color_hex, slug, primary_image_url }]
          // Frontend: colorOptions[{ id, name, color, colorHex, slug, image }]
          const transformedColorOptions = (response.color_options || []).map(opt => ({
            id: opt.product_id,
            name: opt.name,
            color: opt.color,
            colorHex: opt.color_hex,
            slug: opt.slug,
            image: opt.primary_image_url,
          }));
          
          const transformed = {
            id: apiProduct.id,
            slug: apiProduct.slug,
            name: apiProduct.name,
            brand: brandName,
            price: apiProduct.price || apiProduct.mrp,
            mrp: apiProduct.mrp > (apiProduct.price || 0) ? apiProduct.mrp : null,
            image: primaryImage,
            images: images,
            sizes: sizes,
            sizeChartType: sizeChartType, // Original size system for conversion UI
            color: apiProduct.color,
            colorHex: apiProduct.color_hex,
            catalogueId: apiProduct.catalogue_id,
            rating: apiProduct.rating || 4.5,
            reviews: apiProduct.review_count || 0,
            gender: apiProduct.gender,
            segment: apiProduct.gender,
            description: apiProduct.short_description || apiProduct.long_description || '',
            longDescription: apiProduct.long_description || '',
            features: features,
            specifications: Object.keys(specifications).length > 0 ? specifications : null,
            tags: apiProduct.tags || [],
            isNew: (apiProduct.tags || []).includes('new'),
            isTrending: (apiProduct.tags || []).includes('trending'),
            isFeatured: apiProduct.is_featured || (apiProduct.tags || []).includes('featured'),
            inStock: sizes.some(s => s.inStock),
            discountPercent: apiProduct.discount_percentage || 0,
            colorOptions: transformedColorOptions,
            _raw: apiProduct,
          };
          
          setProduct(transformed);
          setColorOptions(transformedColorOptions);
        } else {
          // Fallback to mock data - find by id or name
          const allProducts = getMockProductsByGender(null);
          const found = allProducts.find(
            p => String(p.id) === String(productId) || p.id === productId
          );
          
          if (found) {
            // Transform mock product with all required fields
            // Mock sizes come as array of numbers [7, 8, 9] - convert to proper format
            let mockSizes;
            if (Array.isArray(found.sizes) && found.sizes.length > 0) {
              if (typeof found.sizes[0] === 'number') {
                // Convert number array to object array
                mockSizes = found.sizes.map(size => ({
                  uk: String(size),
                  eu: String(size + 33),
                  inStock: true,
                  stock: Math.floor(Math.random() * 8) + 2,
                }));
              } else {
                // Already in object format
                mockSizes = found.sizes;
              }
            } else {
              // Default sizes
              mockSizes = [
                { uk: '6', eu: '39', inStock: true, stock: 5 },
                { uk: '7', eu: '40', inStock: true, stock: 8 },
                { uk: '8', eu: '41', inStock: true, stock: 6 },
                { uk: '9', eu: '42', inStock: true, stock: 4 },
                { uk: '10', eu: '43', inStock: true, stock: 3 },
              ];
            }
            
            setProduct({
              ...found,
              images: found.images || [found.image, found.image, found.image],
              mrp: found.mrp || found.originalPrice || Math.round(found.price * 1.3),
              originalPrice: found.originalPrice || found.mrp || Math.round(found.price * 1.3),
              sizes: mockSizes,
              color: found.color || 'Black',
              description: found.description || 'Premium quality footwear crafted for comfort and style.',
              features: found.features || [
                'Premium materials',
                'Comfortable fit',
                'Durable construction',
                'Modern design',
              ],
              specifications: found.specifications || {
                'Upper Material': 'Premium Synthetic',
                'Sole Material': 'Rubber',
                'Closure Type': 'Lace-up',
                'Warranty': '6 months',
              },
              colorOptions: [],
            });
            setColorOptions([]);
          } else {
            setError('Product not found');
          }
        }
      } catch (err) {
        console.error('Failed to fetch product from API, trying mock data:', err);
        
        // Fallback to mock data on API error
        const allProducts = getMockProductsByGender(null);
        const found = allProducts.find(
          p => String(p.id) === String(productId) || p.id === productId
        );
        
        if (found) {
          // Transform mock product with all required fields
          let mockSizes;
          if (Array.isArray(found.sizes) && found.sizes.length > 0) {
            if (typeof found.sizes[0] === 'number') {
              mockSizes = found.sizes.map(size => ({
                uk: String(size),
                eu: String(size + 33),
                inStock: true,
                stock: Math.floor(Math.random() * 8) + 2,
              }));
            } else {
              mockSizes = found.sizes;
            }
          } else {
            mockSizes = [
              { uk: '6', eu: '39', inStock: true, stock: 5 },
              { uk: '7', eu: '40', inStock: true, stock: 8 },
              { uk: '8', eu: '41', inStock: true, stock: 6 },
              { uk: '9', eu: '42', inStock: true, stock: 4 },
              { uk: '10', eu: '43', inStock: true, stock: 3 },
            ];
          }
          
          setProduct({
            ...found,
            images: found.images || [found.image, found.image, found.image],
            mrp: found.mrp || found.originalPrice || Math.round(found.price * 1.3),
            originalPrice: found.originalPrice || found.mrp || Math.round(found.price * 1.3),
            sizes: mockSizes,
            color: found.color || found.colors?.[0] || 'Black',
            description: found.description || 'Premium quality footwear crafted for comfort and style.',
            features: found.features || [
              'Premium materials',
              'Comfortable fit',
              'Durable construction',
              'Modern design',
            ],
            specifications: found.specifications || {
              'Upper Material': 'Premium Synthetic',
              'Sole Material': 'Rubber',
              'Closure Type': 'Lace-up',
              'Warranty': '6 months',
            },
            colorOptions: [],
          });
          setColorOptions([]);
        } else {
          setError(err.message || 'Product not found');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, colorOptions, loading, error };
}

/**
 * Hook for fetching featured products (products with 'featured' tag)
 */
export function useFeaturedProducts(limit = 8) {
  return useProducts({
    tags: 'featured',
    perPage: limit,
  });
}

/**
 * Hook for fetching products by specific tags
 * @param {string|string[]} tags - Tags to filter by (e.g., 'new' or ['new', 'trending'])
 * @param {number} limit - Maximum number of products to fetch
 */
export function useProductsByTags(tags, limit = 20) {
  return useProducts({
    tags: Array.isArray(tags) ? tags.join(',') : tags,
    perPage: limit,
  });
}

/**
 * Hook for fetching new arrivals (products with 'new' tag)
 */
export function useNewArrivals(limit = 8) {
  return useProducts({
    tags: 'new',
    perPage: limit,
  });
}

/**
 * Hook for fetching trending products (products with 'trending' tag)
 */
export function useTrendingProducts(limit = 8) {
  return useProducts({
    tags: 'trending',
    perPage: limit,
  });
}

/**
 * Hook for fetching bestseller products (products with 'bestseller' tag)
 */
export function useBestsellerProducts(limit = 8) {
  return useProducts({
    tags: 'bestseller',
    perPage: limit,
  });
}

/**
 * Hook for fetching sale products (products with 'sale' tag)
 */
export function useSaleProducts(limit = 8) {
  return useProducts({
    tags: 'sale',
    perPage: limit,
  });
}

/**
 * Hook for fetching categories
 */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        if (API_ENABLED) {
          const response = await CategoryAPI.getCategories();
          setCategories(response);
        } else {
          // Mock categories
          setCategories([
            { id: 1, name: 'Running', slug: 'running' },
            { id: 2, name: 'Casual', slug: 'casual' },
            { id: 3, name: 'Formal', slug: 'formal' },
            { id: 4, name: 'Sports', slug: 'sports' },
          ]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

/**
 * Hook for fetching catalogues
 */
export function useCatalogues() {
  const [catalogues, setCatalogues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCatalogues = async () => {
      setLoading(true);
      try {
        if (API_ENABLED) {
          const response = await CatalogueAPI.getCatalogues();
          setCatalogues(response);
        } else {
          // Mock catalogues
          setCatalogues([
            { id: 1, name: 'New Arrivals', slug: 'new-arrivals' },
            { id: 2, name: 'Best Sellers', slug: 'best-sellers' },
            { id: 3, name: 'Summer Collection', slug: 'summer-collection' },
          ]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogues();
  }, []);

  return { catalogues, loading, error };
}

/**
 * Get brands for a segment
 */
export function getBrandsForSegment(segment) {
  return segmentBrands[segment] || segmentBrands.men;
}

/**
 * Helper function to check if product has a specific tag
 */
export function hasTag(product, tag) {
  if (!product || !product.tags) return false;
  return product.tags.includes(tag.toLowerCase());
}

/**
 * Helper function to get badge info based on product tags
 * Returns the first matching badge for display
 */
export function getProductBadge(product) {
  if (!product || !product.tags) return null;
  
  const badgeConfig = {
    new: { label: 'New', color: 'bg-green-500' },
    hot: { label: 'Hot', color: 'bg-red-500' },
    trending: { label: 'Trending', color: 'bg-blue-500' },
    bestseller: { label: 'Bestseller', color: 'bg-purple-500' },
    sale: { label: 'Sale', color: 'bg-orange-500' },
    limited: { label: 'Limited', color: 'bg-yellow-500' },
    exclusive: { label: 'Exclusive', color: 'bg-pink-500' },
  };
  
  for (const [tag, config] of Object.entries(badgeConfig)) {
    if (product.tags.includes(tag)) {
      return config;
    }
  }
  
  return null;
}

export default {
  useProducts,
  useProductDetail,
  useFeaturedProducts,
  useProductsByTags,
  useNewArrivals,
  useTrendingProducts,
  useBestsellerProducts,
  useSaleProducts,
  useCategories,
  useCatalogues,
  getBrandsForSegment,
  hasTag,
  getProductBadge,
  PRODUCT_TAGS,
};
