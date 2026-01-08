import { useState, useEffect } from 'react';
import { AdminCategoryAPI, AdminPlatformAPI } from '../../lib/adminApi';
import {
  Plus,
  Edit,
  Trash2,
  Folder,
  FolderOpen,
  RefreshCw,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';

// Category form modal
function CategoryModal({ isOpen, onClose, category, platforms, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    platform_id: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        platform_id: category.platform_id || '',
        is_active: category.is_active !== false,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        platform_id: platforms.length > 0 ? platforms[0].id : '',
        is_active: true,
      });
    }
    setError(null);
  }, [category, isOpen, platforms]);

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
        name: formData.name,
        slug: formData.slug,
        platform_id: parseInt(formData.platform_id),
        is_active: formData.is_active,
      };

      if (category?.id) {
        await AdminCategoryAPI.update(category.id, data);
      } else {
        await AdminCategoryAPI.create(data);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save category:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl border shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={generateSlug}
                className="px-3 py-2 border rounded-lg hover:bg-muted text-sm"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Platform <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.platform_id}
              onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select Platform</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.is_active ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Category row component
function CategoryRow({ category, level = 0, onEdit, onDelete, children, getPlatformName }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children && children.length > 0;

  return (
    <>
      <tr className="border-b hover:bg-muted/50">
        <td className="py-3 px-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-0.5 rounded hover:bg-muted"
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            ) : (
              <span className="w-5" />
            )}
            {expanded ? (
              <FolderOpen className="h-5 w-5 text-yellow-500" />
            ) : (
              <Folder className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium">{category.name}</span>
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-muted-foreground">{category.slug}</td>
        <td className="py-3 px-4">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {getPlatformName(category.platform_id)}
          </span>
        </td>
        <td className="py-3 px-4">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              category.is_active !== false
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {category.is_active !== false ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onEdit(category)}
              className="p-1.5 rounded hover:bg-muted"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(category)}
              className="p-1.5 rounded hover:bg-muted text-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && hasChildren && (
        <>
          {children.map((child) => (
            <CategoryRow
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              children={child.children}
              getPlatformName={getPlatformName}
            />
          ))}
        </>
      )}
    </>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [categoriesData, platformsData] = await Promise.all([
        AdminCategoryAPI.list(),
        AdminPlatformAPI.list(),
      ]);
      setCategories(categoriesData);
      setPlatforms(platformsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Build category tree
  const buildCategoryTree = (categories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: build tree
    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id);
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id).children.push(category);
      } else {
        rootCategories.push(category);
      }
    });

    // Sort alphabetically by name
    const sortByName = (items) => {
      items.sort((a, b) => a.name.localeCompare(b.name));
      items.forEach((item) => {
        if (item.children.length > 0) {
          sortByName(item.children);
        }
      });
      return items;
    };

    return sortByName(rootCategories);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await AdminCategoryAPI.delete(category.id);
      fetchData();
    } catch (err) {
      alert('Failed to delete category: ' + err.message);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  // Get platform name helper
  const getPlatformName = (platformId) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.name || 'Unknown';
  };

  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Organize your products into categories by platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <p className="font-medium">Error loading categories</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Categories table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : categoryTree.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-sm font-medium text-muted-foreground">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoryTree.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    children={category.children}
                    getPlatformName={getPlatformName}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-1">No categories yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first category to organize products
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        )}
      </div>

      {/* Category modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        platforms={platforms}
        onSave={fetchData}
      />
    </div>
  );
}
