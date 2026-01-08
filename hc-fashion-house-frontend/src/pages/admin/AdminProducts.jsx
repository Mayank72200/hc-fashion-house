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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// ========================
// Constants
// ========================

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
  // Get primary image from media
  let image = null;
  if (product.media && product.media.length > 0) {
    const primaryMedia = product.media.find(m => m.is_primary) || product.media[0];
    image = primaryMedia.media_url;
  }

  // Calculate total stock from variants
  let totalStock = 0;
  let sizes = [];
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(v => {
      totalStock += v.stock_quantity || 0;
      if (v.size && !sizes.includes(v.size)) {
        sizes.push(v.size);
      }
    });
  }

  return {
    id: product.id,
    name: product.product_name || product.name || 'Unnamed Product',
    article: product.product_name || product.name || '',
    color: product.color || 'N/A',
    colorHex: product.color_hex || COLOR_MAP[product.color] || null,
    brand: product.brand?.brand_name || product.brand_name || 'Unknown',
    sku: product.sku || product.variants?.[0]?.sku || 'N/A',
    // API returns price (selling price) and mrp (MRP)
    price: product.price || 0,
    mrp: product.mrp || product.price || 0,
    status: product.status || 'draft',
    // Use catalogue_name from API response
    category: product.catalogue_name || product.catalogue?.name || 'Uncategorized',
    gender: product.gender || 'Unisex',
    totalStock,
    sizes: sizes.sort((a, b) => parseFloat(a) - parseFloat(b)),
    image,
    createdAt: product.created_at ? new Date(product.created_at).toISOString().split('T')[0] : 'N/A',
  };
}

// ========================
// Sub Components
// ========================

function StatusBadge({ status }) {
  const styles = {
    live: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

function ColorBadge({ color }) {
  const hex = COLOR_MAP[color];
  
  return (
    <div className="flex items-center gap-2">
      {hex ? (
        <div 
          className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: hex }}
        />
      ) : (
        <Palette className="w-4 h-4 text-muted-foreground" />
      )}
      <span className="text-sm">{color || 'N/A'}</span>
    </div>
  );
}

function StockIndicator({ stock }) {
  const stockClass = stock === 0 
    ? 'text-red-600 dark:text-red-400' 
    : stock < 10 
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-green-600 dark:text-green-400';

  return (
    <span className={`font-medium ${stockClass}`}>
      {stock} units
    </span>
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
            <Button className="gap-2">
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
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Color</th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Article</th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Category</th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Price</th>
                <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Stock</th>
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
                        <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <ColorBadge color={product.color} />
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-foreground">{product.article}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <span className="text-sm text-foreground">{product.category}</span>
                      <p className="text-xs text-muted-foreground">{product.gender}</p>
                    </div>
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
                      <Link to={`/admin/products/${product.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          <DropdownMenuItem>
                            <Package className="w-4 h-4 mr-2" />
                            Manage Stock
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
    </div>
  );
}
