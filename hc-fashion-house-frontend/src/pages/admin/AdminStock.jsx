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
  Copy,
  CheckCircle,
} from 'lucide-react';

// Low stock threshold
const LOW_STOCK_LIMIT = 5;

// Stock level indicator
function StockIndicator({ quantity }) {
  if (quantity <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        <AlertTriangle className="h-3 w-3" />
        Out of Stock
      </span>
    );
  }
  if (quantity <= LOW_STOCK_LIMIT) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <AlertTriangle className="h-3 w-3" />
        Low Stock ({quantity})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
      In Stock ({quantity})
    </span>
  );
}

// Copy SKU button
function CopySKUButton({ sku }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 hover:bg-muted rounded transition-colors"
      title="Copy SKU"
    >
      {copied ? (
        <CheckCircle className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

// Editable stock input
function StockInput({ value, onSave, disabled, productStatus }) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [saving, setSaving] = useState(false);

  // Reset input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const hasChanges = parseInt(inputValue) !== value;
  const isDisabled = disabled || productStatus !== 'live';

  const handleSave = async () => {
    if (!hasChanges) {
      setEditing(false);
      return;
    }
    
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
          disabled={isDisabled || saving}
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          min="0"
          className="w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isDisabled || saving}
        />
        <button
          onClick={() => setInputValue((parseInt(inputValue) || 0) + 1)}
          className="p-1 rounded hover:bg-muted"
          disabled={isDisabled || saving}
        >
          <Plus className="h-4 w-4" />
        </button>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 ml-1"
            title="Save changes"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </button>
        )}
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
      disabled={isDisabled}
      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={isDisabled ? (productStatus !== 'live' ? 'Stock editing disabled for non-LIVE products' : 'Editing disabled') : 'Click to edit stock'}
    >
      <span className="font-medium">{value}</span>
      {!isDisabled && <Edit className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
}

// Variant row - for size-based variants
// Stock is stored at the variant level (variant.stock_quantity)
function VariantRow({ product, variant, onStockUpdate }) {
  // Stock is directly on the variant
  const stockQuantity = variant.stock_quantity || 0;
  const sizeValue = variant.size || variant.variant_name || 'N/A';
  const price = variant.price_override || product.price || 0;

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
      <td className="py-3 px-4">
        <div className="flex items-center text-sm text-muted-foreground font-mono">
          {variant.sku || '-'}
          {variant.sku && <CopySKUButton sku={variant.sku} />}
        </div>
      </td>
      <td className="py-3 px-4">
        ₹{price.toLocaleString('en-IN')}
      </td>
      <td className="py-3 px-4">
        <StockIndicator quantity={stockQuantity} />
      </td>
      <td className="py-3 px-4 text-right">
        <StockInput
          value={stockQuantity}
          productStatus={product.status}
          onSave={(newStock) => onStockUpdate(product.id, variant.id, newStock)}
        />
      </td>
    </tr>
  );
}

// Product stock card
function ProductStockCard({ product, onStockUpdate, expanded, onToggle }) {
  const variants = product.variants || [];
  // Stock is directly on each variant (variant.stock_quantity)
  const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

  // Check if any variant is low stock (has stock but <= threshold)
  const hasLowStock = variants.some(
    v => v.stock_quantity > 0 && v.stock_quantity <= LOW_STOCK_LIMIT
  );

  // Get primary image from media array
  const primaryMedia = product.media?.find(m => m.is_primary) || product.media?.[0];
  const thumbnailUrl = product.thumbnail_url || primaryMedia?.media_url || primaryMedia?.cloudinary_url;

  // Check if product is non-LIVE
  const isNonLive = product.status && product.status !== 'live';

  // Determine status badge (priority: Out of Stock > Low Stock > In Stock)
  const getStatusBadge = () => {
    if (totalStock === 0) {
      return <StockIndicator quantity={0} />;
    } else if (hasLowStock) {
      return <StockIndicator quantity={LOW_STOCK_LIMIT} />;
    } else {
      return <StockIndicator quantity={totalStock} />;
    }
  };

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
              {isNonLive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase">
                  {product.status}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {product.catalogue_name && (
                <span className="font-medium">{product.catalogue_name} · </span>
              )}
              {variants.length} size(s) · Total: {totalStock} units
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {getStatusBadge()}
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t">
          {isNonLive && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                <strong>Note:</strong> Stock editing is disabled because this product status is <strong className="uppercase">{product.status}</strong>. Only LIVE products can have stock edited.
              </p>
            </div>
          )}
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

  const handleStockUpdate = async (productId, variantId, newStock) => {
    // Update stock via API - stock is at variant level
    await AdminStockAPI.updateStock(productId, variantId, newStock);
    
    // Update local state
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

  // Calculate total stock for a product (from variants)
  const getProductStock = (product) => {
    return (product.variants || []).reduce(
      (sum, v) => sum + (v.stock_quantity || 0),
      0
    );
  };

  // Check if product has low stock (any variant is low)
  const hasProductLowStock = (product) => {
    return (product.variants || []).some(
      v => v.stock_quantity > 0 && v.stock_quantity <= LOW_STOCK_LIMIT
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
      if (filter === 'low') {
        // Product is low if it has stock AND any variant is low
        if (stock === 0 || !hasProductLowStock(product)) return false;
      }
      if (filter === 'out' && stock > 0) return false;

      return true;
    })
    .sort((a, b) => {
      // Sort by stock level (lowest first)
      const stockA = getProductStock(a);
      const stockB = getProductStock(b);
      return stockA - stockB;
    });

  // Stats - count PRODUCTS, not variants
  const stats = {
    total: products.length,
    lowStock: products.filter((p) => {
      const stock = getProductStock(p);
      // Product is low if it has stock AND any variant is low
      return stock > 0 && hasProductLowStock(p);
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
            filter === 'low' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20' : 'bg-card hover:bg-muted'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="text-left">
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.lowStock}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">Low Stock (≤{LOW_STOCK_LIMIT})</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter('out')}
          className={`p-4 rounded-xl border transition-colors ${
            filter === 'out' ? 'bg-red-50 border-red-400 dark:bg-red-900/20' : 'bg-card hover:bg-muted'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="text-left">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.outOfStock}</p>
              <p className="text-sm text-red-600 dark:text-red-500">Out of Stock</p>
            </div>
          </div>
        </button>
      </div>

      {/* Helper text */}
      <div className="bg-muted/50 border border-border rounded-lg p-3">
        <p className="text-sm text-muted-foreground">
          <strong>Low Stock threshold:</strong> ≤ {LOW_STOCK_LIMIT} units per size. Stock can only be edited at the size level within each product.
        </p>
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
