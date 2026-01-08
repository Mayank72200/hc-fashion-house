import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AdminProductAPI, AdminStockAPI, AdminVariantAPI } from '../../lib/adminApi';
import {
  Package,
  RefreshCw,
  Search,
  AlertTriangle,
  Plus,
  Minus,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Edit,
  ArrowLeft,
} from 'lucide-react';

// Stock level indicator
function StockIndicator({ quantity }) {
  if (quantity <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertTriangle className="h-3 w-3" />
        Out of Stock
      </span>
    );
  }
  if (quantity <= 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertTriangle className="h-3 w-3" />
        Low Stock ({quantity})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      In Stock ({quantity})
    </span>
  );
}

// Editable stock input
function StockInput({ value, onSave, disabled }) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(parseInt(inputValue) || 0);
      setEditing(false);
    } catch (err) {
      alert('Failed to update stock: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setInputValue(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setInputValue(Math.max(0, (parseInt(inputValue) || 0) - 1))}
          className="p-1 rounded hover:bg-muted"
          disabled={disabled || saving}
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          min="0"
          className="w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={disabled || saving}
        />
        <button
          onClick={() => setInputValue((parseInt(inputValue) || 0) + 1)}
          className="p-1 rounded hover:bg-muted"
          disabled={disabled || saving}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 ml-1"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="p-1 rounded hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      disabled={disabled}
      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted transition-colors"
    >
      <span className="font-medium">{value}</span>
      <Edit className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}

// Variant row - for size-based variants (footwear model)
// In current data model: each variant IS a size, options are just metadata
function VariantRow({ product, variant, onStockUpdate }) {
  // For size-based variants, stock is on the variant itself
  const stockQuantity = variant.stock_quantity || 0;
  const sizeValue = variant.size || variant.options?.[0]?.option_value || 'N/A';

  return (
    <tr className="border-b hover:bg-muted/30">
      <td className="py-3 px-4">
        <span className="w-4" />
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">Size {sizeValue}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">{variant.sku || '-'}</td>
      <td className="py-3 px-4">
        {variant.price_override ? `₹${variant.price_override}` : '-'}
      </td>
      <td className="py-3 px-4">
        <StockIndicator quantity={stockQuantity} />
      </td>
      <td className="py-3 px-4 text-right">
        <StockInput
          value={stockQuantity}
          onSave={(newStock) =>
            onStockUpdate(product.id, variant.id, variant.options?.[0]?.id || variant.id, newStock)
          }
        />
      </td>
    </tr>
  );
}

// Product stock card
function ProductStockCard({ product, onStockUpdate, expanded, onToggle }) {
  const variants = product.variants || [];
  // For size-based variants, stock is directly on each variant
  const totalStock = variants.reduce(
    (sum, v) => sum + (v.stock_quantity || 0),
    0
  );

  // Get primary image from media array
  const primaryMedia = product.media?.find(m => m.is_primary) || product.media?.[0];
  const thumbnailUrl = product.thumbnail_url || primaryMedia?.media_url || primaryMedia?.cloudinary_url;

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{product.name}</h3>
              {product.color && (
                <div className="flex items-center gap-1">
                  {product.color_hex && (
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: product.color_hex }}
                    />
                  )}
                  <span className="text-xs text-muted-foreground">({product.color})</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {variants.length} size(s) • Total stock: {totalStock}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StockIndicator quantity={totalStock} />
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t">
          {variants.length > 0 ? (
            <table className="w-full">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 px-4 text-left w-10" />
                  <th className="py-2 px-4 text-left">Size</th>
                  <th className="py-2 px-4 text-left">SKU</th>
                  <th className="py-2 px-4 text-left">Price</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <VariantRow
                    key={variant.id || `variant-${index}`}
                    product={product}
                    variant={variant}
                    onStockUpdate={onStockUpdate}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No size variants found for this product.</p>
              <p className="text-sm mt-1">Add size variants to manage stock.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminStock() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProductId = searchParams.get('product');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, low, out
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminProductAPI.list({ perPage: 100 });
      const productList = response.items || response || [];

      // Fetch full details for each product to get variants
      const productsWithVariants = await Promise.all(
        productList.map(async (product) => {
          try {
            const response = await AdminProductAPI.get(product.id);
            // The API returns { product: {...}, availability: {...}, ... }
            // Extract the product object which contains variants
            const fullProduct = response.product || response;
            // Also merge in thumbnail from list API if not present
            if (!fullProduct.thumbnail_url && product.media && product.media.length > 0) {
              const primaryMedia = product.media.find(m => m.is_primary) || product.media[0];
              fullProduct.thumbnail_url = primaryMedia.media_url;
            }
            return fullProduct;
          } catch (e) {
            console.error('Failed to fetch product details:', e);
            return product;
          }
        })
      );

      setProducts(productsWithVariants);
      
      // If a product was specified in URL, expand it and find it
      if (selectedProductId) {
        const productIdNum = parseInt(selectedProductId);
        const product = productsWithVariants.find(p => p.id === productIdNum);
        if (product) {
          setSelectedProduct(product);
          setExpandedProducts(new Set([productIdNum]));
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockUpdate = async (productId, variantId, optionId, newStock) => {
    await AdminStockAPI.updateStock(productId, variantId, optionId, newStock);
    
    // Update local state - for size-based variants, stock is on the variant itself
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        return {
          ...product,
          variants: product.variants?.map((variant) => {
            if (variant.id !== variantId) return variant;
            return {
              ...variant,
              stock_quantity: newStock,
              // Also update options if present
              options: variant.options?.map((option) => {
                if (option.id !== optionId) return option;
                return { ...option, stock_quantity: newStock };
              }),
            };
          }),
        };
      })
    );
  };

  const toggleExpanded = (productId) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedProducts(new Set(filteredProducts.map((p) => p.id)));
  };

  const collapseAll = () => {
    setExpandedProducts(new Set());
  };

  // Calculate total stock for a product
  const getProductStock = (product) => {
    return (product.variants || []).reduce(
      (sum, v) =>
        sum +
        (v.options || []).reduce((optSum, opt) => optSum + (opt.stock_quantity || 0), 0),
      0
    );
  };

  // Filter products
  const filteredProducts = products
    .filter((product) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !product.name.toLowerCase().includes(searchLower) &&
          !product.sku?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Stock filter
      const stock = getProductStock(product);
      if (filter === 'low' && stock > 5) return false;
      if (filter === 'out' && stock > 0) return false;

      return true;
    })
    .sort((a, b) => {
      // Sort by stock level (lowest first)
      const stockA = getProductStock(a);
      const stockB = getProductStock(b);
      return stockA - stockB;
    });

  // Stats
  const stats = {
    total: products.length,
    lowStock: products.filter((p) => {
      const stock = getProductStock(p);
      return stock > 0 && stock <= 5;
    }).length,
    outOfStock: products.filter((p) => getProductStock(p) === 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedProductId && (
            <Link
              to="/admin/products"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {selectedProduct ? `Stock: ${selectedProduct.name}` : 'Stock Management'}
            </h1>
            <p className="text-muted-foreground">
              {selectedProduct 
                ? `Manage variants and stock for this product (Color: ${selectedProduct.color || 'N/A'})`
                : 'Manage inventory levels across all products'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedProductId && (
            <button
              onClick={() => {
                setSearchParams({});
                setSelectedProduct(null);
              }}
              className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              View All Products
            </button>
          )}
          <button
            onClick={fetchProducts}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border transition-colors ${
            filter === 'all' ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted'
          }`}
        >
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter('low')}
          className={`p-4 rounded-xl border transition-colors ${
            filter === 'low' ? 'bg-yellow-50 border-yellow-400' : 'bg-card hover:bg-muted'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="text-left">
              <p className="text-2xl font-bold text-yellow-700">{stats.lowStock}</p>
              <p className="text-sm text-yellow-600">Low Stock (≤5)</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter('out')}
          className={`p-4 rounded-xl border transition-colors ${
            filter === 'out' ? 'bg-red-50 border-red-400' : 'bg-card hover:bg-muted'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="text-left">
              <p className="text-2xl font-bold text-red-700">{stats.outOfStock}</p>
              <p className="text-sm text-red-600">Out of Stock</p>
            </div>
          </div>
        </button>
      </div>

      {/* Search and controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors text-sm"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors text-sm"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <p className="font-medium">Error loading products</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Products list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-4">
          {filteredProducts.map((product, index) => (
            <ProductStockCard
              key={product.id || `product-${index}`}
              product={product}
              onStockUpdate={handleStockUpdate}
              expanded={expandedProducts.has(product.id)}
              onToggle={() => toggleExpanded(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-1">No products found</h3>
          <p className="text-muted-foreground">
            {search || filter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Add products to manage stock'}
          </p>
        </div>
      )}
    </div>
  );
}
