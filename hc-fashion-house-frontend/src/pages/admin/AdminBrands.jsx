import { useState, useEffect } from 'react';
import { AdminBrandAPI } from '@/lib/adminApi';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  XCircle,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

/**
 * Brands Management Page
 * Manage brand information: Name, Slug, Logo, Active/Inactive status
 */

// Brand Form Modal
function BrandModal({ isOpen, onClose, brand, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || '',
        slug: brand.slug || '',
        logo: brand.logo_cloudinary_url || brand.logo_url || brand.logo || '',
        is_active: brand.is_active !== false,
      });
      setLogoPreview(brand.logo_cloudinary_url || brand.logo_url || brand.logo || null);
    } else {
      setFormData({
        name: '',
        slug: '',
        logo: '',
        is_active: true,
      });
      setLogoPreview(null);
    }
    setLogoFile(null);
    setError(null);
  }, [brand, isOpen]);

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData({ ...formData, slug });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let logoUrl = formData.logo;
      let logoData = {};

      // Upload logo if a new file was selected
      if (logoFile) {
        try {
          // Use the slug for folder organization
          const slugToUse = formData.slug || brand?.slug || 'temp';
          const uploadResult = await AdminBrandAPI.uploadLogo(logoFile, slugToUse);
          // uploadResult contains: { url, public_id, folder_path, width, height }
          logoUrl = uploadResult.url;
          logoData = {
            logo_cloudinary_url: uploadResult.url,
            logo_folder_path: uploadResult.folder_path,
            logo_public_id: uploadResult.public_id,
            logo_width: uploadResult.width,
            logo_height: uploadResult.height,
          };
        } catch (uploadError) {
          setError(`Failed to upload logo: ${uploadError.message}`);
          setSaving(false);
          return;
        }
      } else if (logoUrl) {
        // If existing logo, keep the Cloudinary fields
        logoData = {
          logo_cloudinary_url: brand?.logo_cloudinary_url || logoUrl,
          logo_folder_path: brand?.logo_folder_path,
          logo_public_id: brand?.logo_public_id,
          logo_width: brand?.logo_width,
          logo_height: brand?.logo_height,
        };
      }

      const data = {
        name: formData.name,
        slug: formData.slug,
        ...logoData,
        is_active: formData.is_active,
      };

      if (brand?.id) {
        await AdminBrandAPI.update(brand.id, data);
      } else {
        await AdminBrandAPI.create(data);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save brand:', err);
      setError(err.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{brand ? 'Edit Brand' : 'Create Brand'}</DialogTitle>
          <DialogDescription>
            {brand ? 'Update brand information' : 'Add a new brand to the catalog'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter brand name"
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="brand-slug"
                required
              />
              <Button type="button" variant="outline" onClick={generateSlug}>
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <div className="space-y-3">
              {logoPreview && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="flex-1"
                />
                {logoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setLogoPreview(null);
                      setLogoFile(null);
                      setFormData({ ...formData, logo: '' });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                brand ? 'Update Brand' : 'Create Brand'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Brands Page
export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [sortBy, setSortBy] = useState('products'); // products, name, newest
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await AdminBrandAPI.list();
      // Backend returns array of brands with product_count
      setBrands(response || []);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load brands',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedBrand(null);
    setIsModalOpen(true);
  };

  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setIsModalOpen(true);
  };

  const handleDelete = async (brand) => {
    try {
      await AdminBrandAPI.delete(brand.id);
      toast({
        title: 'Success',
        description: 'Brand deleted successfully',
      });
      fetchBrands();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete brand:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete brand',
        variant: 'destructive',
      });
    }
  };

  const filteredBrands = brands
    .filter((brand) => {
      // Search filter
      const searchMatch = brand.name.toLowerCase().includes(search.toLowerCase()) ||
        brand.slug.toLowerCase().includes(search.toLowerCase());
      
      // Status filter
      let statusMatch = true;
      if (statusFilter === 'active') {
        statusMatch = brand.is_active === true;
      } else if (statusFilter === 'inactive') {
        statusMatch = brand.is_active === false;
      }
      
      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      // Sorting
      if (sortBy === 'products') {
        return (b.product_count || 0) - (a.product_count || 0);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage brand information and logos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchBrands}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Total Brands</p>
          <p className="text-2xl font-bold">{brands.length}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {brands.filter(b => b.is_active).length}
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Inactive</p>
          <p className="text-2xl font-bold text-gray-500">
            {brands.filter(b => !b.is_active).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search brands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
            </Button>
          </div>
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="products">Product Count</option>
            <option value="name">Name (A-Z)</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Brands Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-sm">Logo</th>
              <th className="text-left p-4 font-medium text-sm">Brand Name</th>
              <th className="text-left p-4 font-medium text-sm">Slug</th>
              <th className="text-left p-4 font-medium text-sm">Products</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-right p-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredBrands.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-muted-foreground">
                  No brands found
                </td>
              </tr>
            ) : (
              filteredBrands.map((brand) => (
                <tr key={brand.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                      {(brand.logo_cloudinary_url || brand.logo_url || brand.logo) ? (
                        <img
                          src={brand.logo_cloudinary_url || brand.logo_url || brand.logo}
                          alt={brand.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium">{brand.name}</td>
                  <td className="p-4 text-muted-foreground font-mono text-sm">
                    {brand.slug}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {brand.product_count || 0} products
                    </span>
                  </td>
                  <td className="p-4">
                    {brand.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(brand)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(brand)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Brand Modal */}
      <BrandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        brand={selectedBrand}
        onSave={fetchBrands}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Brand</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
