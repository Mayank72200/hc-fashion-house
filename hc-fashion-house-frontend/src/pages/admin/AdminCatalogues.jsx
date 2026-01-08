import { useState, useEffect } from 'react';
import { AdminCatalogueAPI, AdminProductAPI, AdminCategoryAPI } from '../../lib/adminApi';
import {
  Plus,
  Edit,
  Trash2,
  Grid,
  RefreshCw,
  X,
  Check,
  Package,
  Search,
  ChevronRight,
  Eye,
  Palette,
} from 'lucide-react';

/**
 * Catalogue = Article/Design
 * This page manages article designs, with products (color SKUs) created under each catalogue.
 */

// Catalogue (Article/Design) form modal
function CatalogueModal({ isOpen, onClose, catalogue, categories, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (catalogue) {
      setFormData({
        name: catalogue.name || '',
        slug: catalogue.slug || '',
        description: catalogue.description || '',
        category_id: catalogue.category_id || '',
        is_active: catalogue.is_active !== false,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        category_id: '',
        is_active: true,
      });
    }
    setError(null);
  }, [catalogue, isOpen]);

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData({ ...formData, slug });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const data = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      };

      if (catalogue?.id) {
        await AdminCatalogueAPI.update(catalogue.id, data);
      } else {
        await AdminCatalogueAPI.create(data);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save catalogue:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {catalogue ? 'Edit Article/Design' : 'Create Article/Design'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Article Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., AirFlex Running Shoe"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The base design name. Products (colors) will be added under this.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
              <button
                type="button"
                onClick={generateSlug}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Brief description of this article design..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#C9A24D] text-gray-900 rounded-lg hover:bg-[#B89240] transition-colors disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {catalogue ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Product (Color SKU) Modal
function AddProductModal({ isOpen, onClose, catalogue, categories, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    color: '',
    price: '',
    mrp: '',
    product_type: 'footwear',
    gender: 'unisex',
    status: 'draft',
    short_description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && catalogue) {
      // Pre-fill with catalogue name
      setFormData((prev) => ({
        ...prev,
        name: catalogue.name + ' - ',
      }));
    }
    setError(null);
  }, [isOpen, catalogue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const productData = {
        name: formData.name,
        color: formData.color,
        catalogue_id: catalogue.id,
        category_id: catalogue.category_id,
        product_type: formData.product_type,
        gender: formData.gender,
        price: parseInt(formData.price) || 0,
        mrp: formData.mrp ? parseInt(formData.mrp) : null,
        short_description: formData.short_description,
        status: formData.status,
      };

      await AdminProductAPI.create(productData);
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to create product:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !catalogue) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Color SKU
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Under: {catalogue.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., AirFlex Running Shoe - Red"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Color <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                required
                placeholder="e.g., Red"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Product Type
              </label>
              <select
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                <option value="footwear">Footwear</option>
                <option value="clothing">Clothing</option>
                <option value="accessory">Accessory</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
                placeholder="2999"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                MRP (₹)
              </label>
              <input
                type="number"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                min="0"
                placeholder="3999"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
              >
                <option value="draft">Draft</option>
                <option value="live">Live</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Short Description
            </label>
            <textarea
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#C9A24D] text-gray-900 rounded-lg hover:bg-[#B89240] transition-colors disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Catalogue detail view showing products (color SKUs)
function CatalogueDetailPanel({ catalogue, products, loading, onAddProduct, onRefresh, onClose }) {
  if (!catalogue) return null;

  return (
    <div className="border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{catalogue.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {products.length} color{products.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <Palette className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No color SKUs yet</p>
            <button
              onClick={onAddProduct}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A24D] text-gray-900 rounded-lg hover:bg-[#B89240] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add First Color
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#C9A24D] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      style={{
                        backgroundColor: product.color?.toLowerCase() || '#ccc',
                      }}
                      title={product.color}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.color} • ₹{product.price?.toLocaleString('en-IN') || 0}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      product.status === 'live'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : product.status === 'draft'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {products.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onAddProduct}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#C9A24D] text-gray-900 rounded-lg hover:bg-[#B89240] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Another Color
          </button>
        </div>
      )}
    </div>
  );
}

// Main AdminCatalogues component
export default function AdminCatalogues() {
  const [catalogues, setCatalogues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal states
  const [catalogueModal, setCatalogueModal] = useState({ open: false, catalogue: null });
  const [addProductModal, setAddProductModal] = useState({ open: false, catalogue: null });

  // Detail panel
  const [selectedCatalogue, setSelectedCatalogue] = useState(null);
  const [catalogueProducts, setCatalogueProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCatalogue) {
      fetchCatalogueProducts(selectedCatalogue.id);
    }
  }, [selectedCatalogue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cataloguesRes, categoriesRes] = await Promise.all([
        AdminCatalogueAPI.list(),
        AdminCategoryAPI.list(),
      ]);
      setCatalogues(Array.isArray(cataloguesRes) ? cataloguesRes : []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogueProducts = async (catalogueId) => {
    setLoadingProducts(true);
    try {
      const response = await AdminCatalogueAPI.getProducts(catalogueId);
      setCatalogueProducts(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Failed to fetch catalogue products:', err);
      setCatalogueProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDeleteCatalogue = async (catalogue) => {
    if (!confirm(`Delete "${catalogue.name}"? This cannot be undone.`)) return;

    try {
      await AdminCatalogueAPI.delete(catalogue.id);
      fetchData();
      if (selectedCatalogue?.id === catalogue.id) {
        setSelectedCatalogue(null);
      }
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const filteredCatalogues = search
    ? catalogues.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : catalogues;

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || '-';
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main content */}
      <div className={`flex-1 p-6 overflow-y-auto ${selectedCatalogue ? 'w-2/3' : 'w-full'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Articles / Designs
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Manage article designs. Add color SKUs (products) under each design.
            </p>
          </div>

          <button
            onClick={() => setCatalogueModal({ open: true, catalogue: null })}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A24D] text-gray-900 rounded-lg hover:bg-[#B89240] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Article
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 text-[#C9A24D] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredCatalogues.length === 0 ? (
          <div className="text-center py-12">
            <Grid className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {search ? 'No articles match your search' : 'No articles yet'}
            </p>
            {!search && (
              <button
                onClick={() => setCatalogueModal({ open: true, catalogue: null })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A24D] text-gray-900 rounded-lg hover:bg-[#B89240]"
              >
                <Plus className="h-4 w-4" />
                Create First Article
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCatalogues.map((catalogue) => (
              <div
                key={catalogue.id}
                className={`bg-white dark:bg-gray-900 rounded-xl border transition-all cursor-pointer ${
                  selectedCatalogue?.id === catalogue.id
                    ? 'border-[#C9A24D] ring-2 ring-[#C9A24D]/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-[#C9A24D]/50'
                }`}
                onClick={() => setSelectedCatalogue(catalogue)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {catalogue.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getCategoryName(catalogue.category_id)}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        catalogue.is_active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {catalogue.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {catalogue.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                      {catalogue.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCatalogue(catalogue);
                        setAddProductModal({ open: true, catalogue });
                      }}
                      className="text-sm text-[#C9A24D] hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add Color
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCatalogueModal({ open: true, catalogue });
                        }}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCatalogue(catalogue);
                        }}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedCatalogue && (
        <div className="w-1/3 min-w-[320px]">
          <CatalogueDetailPanel
            catalogue={selectedCatalogue}
            products={catalogueProducts}
            loading={loadingProducts}
            onAddProduct={() => setAddProductModal({ open: true, catalogue: selectedCatalogue })}
            onRefresh={() => fetchCatalogueProducts(selectedCatalogue.id)}
            onClose={() => setSelectedCatalogue(null)}
          />
        </div>
      )}

      {/* Modals */}
      <CatalogueModal
        isOpen={catalogueModal.open}
        onClose={() => setCatalogueModal({ open: false, catalogue: null })}
        catalogue={catalogueModal.catalogue}
        categories={categories}
        onSave={fetchData}
      />

      <AddProductModal
        isOpen={addProductModal.open}
        onClose={() => setAddProductModal({ open: false, catalogue: null })}
        catalogue={addProductModal.catalogue}
        categories={categories}
        onSave={() => {
          fetchData();
          if (selectedCatalogue) {
            fetchCatalogueProducts(selectedCatalogue.id);
          }
        }}
      />
    </div>
  );
}
