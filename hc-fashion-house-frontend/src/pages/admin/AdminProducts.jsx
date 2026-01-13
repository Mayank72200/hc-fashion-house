import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  MoreVertical,
  Palette,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  CheckCircle,
  FileEdit,
  Archive,
  Tags,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AdminAPI } from '@/lib/api';
import { extractMediaUrl } from '@/utils/imageUtils';

// ========================
// Constants
// ========================

const TAG_OPTIONS = [
  'New Arrival', 'Best Seller', 'Limited Edition', 'Sale', 
  'Trending', 'Exclusive', 'Premium', 'Eco-Friendly',
  'Comfortable', 'Lightweight', 'Waterproof', 'Breathable'
];

const COLOR_MAP = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Navy Blue': '#1e3a5f',
  'Royal Blue': '#4169E1',
  'Red': '#DC2626',
  'Pink': '#EC4899',
  'Orange': '#F97316',
  'Green': '#22C55E',
  'Brown': '#92400E',
  'Grey': '#6B7280',
  'Beige': '#F5F5DC',
};

// ========================
// Helper Functions
// ========================

/**
 * Transform API product data to the format expected by the UI
 */
function transformProduct(product) {
  // Get primary image from media_assets or media
  let image = null;
  const mediaAssets = product.media_assets || product.media || [];
  if (mediaAssets.length > 0) {
    const primaryMedia = mediaAssets.find(m => m.is_primary) || mediaAssets[0];
    image = extractMediaUrl(primaryMedia);
  }

  // Calculate total stock from variants and their options
  let totalStock = 0;
  let sizes = [];
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(v => {
      // Stock is stored in options (sizes), not directly on variant
      if (v.options && v.options.length > 0) {
        v.options.forEach(opt => {
          totalStock += opt.stock_quantity || 0;
          if (opt.option_value && !sizes.includes(opt.option_value)) {
            sizes.push(opt.option_value);
          }
        });
      }
      // Fallback to variant_name (size) if no options
      if (v.variant_name && !sizes.includes(v.variant_name)) {
        sizes.push(v.variant_name);
        totalStock += v.stock_quantity || 0;
      }
    });
  }

  // Get tags array
  let tags = [];
  if (Array.isArray(product.tags)) {
    tags = product.tags;
  } else if (typeof product.tags === 'string' && product.tags) {
    tags = product.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  return {
    id: product.id,
    name: product.name || 'Unnamed Product',
    article: product.catalogue_name || product.name || '',
    color: product.color || 'N/A',
    colorHex: product.color_hex || COLOR_MAP[product.color] || null,
    brand: product.brand?.name || product.brand_name || 'Unknown',
    sku: product.variants?.[0]?.sku || 'N/A',
    // API returns price (selling price) and mrp (MRP)
    price: product.price || 0,
    mrp: product.mrp || product.price || 0,
    status: product.status || 'draft',
    // Use catalogue_name from API response
    category: product.catalogue_name || product.catalogue?.name || 'Uncategorized',
    gender: product.gender || 'unisex',
    totalStock,
    sizes: sizes.sort((a, b) => parseFloat(a) - parseFloat(b)),
    image,
    tags,
    createdAt: product.created_at ? new Date(product.created_at).toISOString().split('T')[0] : 'N/A',
  };
}

// ========================
// Sub Components
// ========================

function StatusBadge({ status }) {
  const styles = {
    live: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
    draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

function ColorBadge({ color, colorHex }) {
  const hex = colorHex || COLOR_MAP[color] || null;
  
  // Calculate if color is light or dark for contrast
  const isLightColor = hex ? (() => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  })() : false;
  
  return (
    <div className="flex items-center gap-2">
      {hex ? (
        <div 
          className={`w-5 h-5 rounded-full flex-shrink-0 ${
            isLightColor ? 'border border-gray-300 dark:border-gray-500' : 'border border-transparent'
          }`}
          style={{ backgroundColor: hex }}
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <Palette className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm text-gray-700 dark:text-gray-300">{color || 'N/A'}</span>
    </div>
  );
}

function StockIndicator({ stock }) {
  const stockClass = stock === 0 
    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' 
    : stock < 10 
      ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
      : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';

  const stockIcon = stock === 0 ? '⚠️' : stock < 10 ? '⚡' : '✓';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium text-sm ${stockClass}`}>
      <span>{stockIcon}</span>
      <span>{stock} units</span>
      <span className="text-xs opacity-75">(all sizes)</span>
    </div>
  );
}

function TagsBadge({ tags }) {
  if (!tags || tags.length === 0) return <span className="text-sm text-muted-foreground">No tags</span>;
  
  const displayTags = tags.slice(0, 2);
  const remaining = tags.length - 2;
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {displayTags.map((tag, i) => (
        <span 
          key={i}
          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
        >
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          +{remaining}
        </span>
      )}
    </div>
  );
}

// ========================
// Tag Management Dialog
// ========================

function TagManagementDialog({ product, open, onOpenChange, onSave }) {
  const [selectedTags, setSelectedTags] = useState(product?.tags || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedTags(product.tags || []);
    }
  }, [product]);

  const handleToggleTag = (tag) => {
    // Normalize tag for comparison (lowercase, no spaces)
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, '');
    const normalizedSelected = selectedTags.map(t => t.toLowerCase().replace(/\s+/g, ''));
    
    if (normalizedSelected.includes(normalizedTag)) {
      setSelectedTags(selectedTags.filter(t => 
        t.toLowerCase().replace(/\s+/g, '') !== normalizedTag
      ));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Normalize tags before saving - remove spaces and lowercase
      const normalizedTags = selectedTags.map(t => t.toLowerCase().replace(/\s+/g, ''));
      await onSave(product.id, { tags: normalizedTags });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Manage Product Tags
          </DialogTitle>
          <DialogDescription>
            Update product tags for {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{product.name}</h3>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              <p className="text-sm text-muted-foreground">{product.color} • {product.brand}</p>
            </div>
          </div>

          {/* Tag Management */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tags className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Product Tags</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Select tags to categorize this product for homepage sections and filters
            </p>
            <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border border-border">
              {TAG_OPTIONS.map((tag) => {
                const normalizedTag = tag.toLowerCase().replace(/\s+/g, '');
                const normalizedSelected = selectedTags.map(t => t.toLowerCase().replace(/\s+/g, ''));
                const isSelected = normalizedSelected.includes(normalizedTag);
                
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted'
                    }`}
                  >
                    {tag}
                    {isSelected && <X className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="gap-2 bg-[#C9A24D] hover:bg-[#B8933E] text-white font-medium shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========================
// Main Component
// ========================

export default function AdminProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [stockTagDialogOpen, setStockTagDialogOpen] = useState(false);
  const [productToManage, setProductToManage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminAPI.getProducts();
      
      // Handle different response formats
      // API returns: { items, total, page, per_page, pages }
      let productsData = [];
      if (Array.isArray(response)) {
        productsData = response;
      } else if (response?.items) {
        productsData = response.items;
      } else if (response?.products) {
        productsData = response.products;
      } else if (response?.data) {
        productsData = response.data;
      }

      // Transform products to UI format
      const transformedProducts = productsData.map(transformProduct);
      setProducts(transformedProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err.message || 'Failed to load products');
      toast({
        title: 'Error loading products',
        description: err.message || 'Failed to fetch products from server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesGender = genderFilter === 'all' || product.gender.toLowerCase() === genderFilter;
    
    return matchesSearch && matchesStatus && matchesGender;
  });

  // Group products by catalogue for visual grouping
  const catalogueColorCounts = filteredProducts.reduce((acc, product) => {
    const catalogueName = product.article || 'Uncategorized';
    acc[catalogueName] = (acc[catalogueName] || 0) + 1;
    return acc;
  }, {});

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        // Call API to delete product
        await AdminAPI.deleteProduct(productToDelete.id);
        
        // Remove from local state
        setProducts(products.filter(p => p.id !== productToDelete.id));
        toast({
          title: 'Product Deleted',
          description: `${productToDelete.name} has been deleted.`,
        });
      } catch (err) {
        console.error('Failed to delete product:', err);
        toast({
          title: 'Delete Failed',
          description: err.message || 'Failed to delete product',
          variant: 'destructive',
        });
      }
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleStatusChange = async (product, newStatus) => {
    try {
      // Call API to update product status
      await AdminAPI.updateProduct(product.id, { status: newStatus });
      
      // Update local state
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, status: newStatus } : p
      ));
      
      const statusLabel = newStatus === 'live' ? 'Live' : newStatus === 'draft' ? 'Draft' : 'Archived';
      toast({
        title: 'Status Updated',
        description: `${product.name} is now ${statusLabel}.`,
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      toast({
        title: 'Status Update Failed',
        description: err.message || 'Failed to update product status',
        variant: 'destructive',
      });
    }
  };

  const handleManageTags = (product) => {
    setProductToManage(product);
    setStockTagDialogOpen(true);
  };

  const handleSaveTags = async (productId, updates) => {
    try {
      // Update tags via API
      if (updates.tags) {
        await AdminAPI.updateProduct(productId, { tags: updates.tags });
      }

      // Update tags in local state
      setProducts(products.map(p => 
        p.id === productId ? { ...p, tags: updates.tags || p.tags } : p
      ));

      toast({
        title: 'Tags Updated',
        description: 'Product tags have been updated successfully.',
      });

      fetchProducts(); // Refresh to get latest data
    } catch (err) {
      console.error('Failed to update tags:', err);
      toast({
        title: 'Update Failed',
        description: err.message || 'Failed to update product tags',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog 
            {!loading && ` • ${products.length} total products`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchProducts} 
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/admin/products/new">
            <Button className="gap-2 bg-[#C9A24D] hover:bg-[#B8933E] text-white font-medium py-2.5 shadow-sm">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={fetchProducts} className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, article, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Gender Filter */}
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="women">Women</SelectItem>
              <SelectItem value="kids">Kids</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      )}

      {/* Products Table */}
      {!loading && (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Product</th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Article / Catalogue</th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Brand</th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Color</th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Price</th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Total Stock</th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                <th className="text-right py-4 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No products found</p>
                    <p className="text-sm text-muted-foreground/70">
                      {searchTerm || statusFilter !== 'all' || genderFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Add your first product to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
              paginatedProducts.map((product) => (
                <tr 
                  key={product.id} 
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{product.article || product.category}</span>
                      {catalogueColorCounts[product.article] > 1 && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {catalogueColorCounts[product.article]} colors
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-foreground">{product.brand}</span>
                  </td>
                  <td className="py-4 px-4">
                    <ColorBadge color={product.color} colorHex={product.colorHex} />
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <span className="font-medium text-foreground">{formatPrice(product.price)}</span>
                      {product.mrp > product.price && (
                        <p className="text-xs text-muted-foreground line-through">{formatPrice(product.mrp)}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <StockIndicator stock={product.totalStock} />
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/stock?product=${product.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Manage Stock">
                          <Package className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleManageTags(product)}
                        title="Manage Tags"
                      >
                        <Tags className="w-4 h-4" />
                      </Button>
                      <Link to={`/admin/products/${product.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit Product">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageTags(product)}>
                            <Tags className="w-4 h-4 mr-2" />
                            Manage Tags
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {/* Status Change Options */}
                          {product.status !== 'live' && (
                            <DropdownMenuItem 
                              className="text-green-600"
                              onClick={() => handleStatusChange(product, 'live')}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Make Live
                            </DropdownMenuItem>
                          )}
                          {product.status !== 'draft' && (
                            <DropdownMenuItem 
                              className="text-yellow-600"
                              onClick={() => handleStatusChange(product, 'draft')}
                            >
                              <FileEdit className="w-4 h-4 mr-2" />
                              Set as Draft
                            </DropdownMenuItem>
                          )}
                          {product.status !== 'archived' && (
                            <DropdownMenuItem 
                              className="text-gray-600"
                              onClick={() => handleStatusChange(product, 'archived')}
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-foreground px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Management Dialog */}
      <TagManagementDialog
        product={productToManage}
        open={stockTagDialogOpen}
        onOpenChange={setStockTagDialogOpen}
        onSave={handleSaveTags}
      />
    </div>
  );
}
