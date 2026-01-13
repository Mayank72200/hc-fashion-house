import { useState, useEffect, useCallback } from 'react';
import { AdminAPI, SiteConfigAPI } from '@/lib/adminApi';
import {
  Search,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  Filter,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  X,
  Plus,
  Edit,
  Settings,
  Layout,
  Grid,
  Star,
  Upload,
  ChevronRight,
  GripVertical,
  Check,
  Link as LinkIcon,
  Sparkles,
  TrendingUp,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

/**
 * Website Control Center
 * Manage banners, featured sections, and media assets to control website content dynamically
 */

// Placement key options for banners
const PLACEMENT_OPTIONS = {
  hero_landing: { label: 'Hero - Landing Page', page: 'landing' },
  hero_men: { label: 'Hero - Men\'s Segment', page: 'segment', gender: 'men' },
  hero_women: { label: 'Hero - Women\'s Segment', page: 'segment', gender: 'women' },
  promo_landing: { label: 'Promo Banner - Landing', page: 'landing' },
  promo_men: { label: 'Promo Banner - Men', page: 'segment', gender: 'men' },
  promo_women: { label: 'Promo Banner - Women', page: 'segment', gender: 'women' },
  category_banner: { label: 'Category Page Banner', page: 'category' },
  footer_banner: { label: 'Footer Banner', page: 'all' },
};

// Section types for featured products
const SECTION_TYPES = {
  trending: { label: 'Trending Now', icon: TrendingUp },
  new_arrivals: { label: 'New Arrivals', icon: Sparkles },
  featured: { label: 'Featured Products', icon: Star },
  best_sellers: { label: 'Best Sellers', icon: Package },
  on_sale: { label: 'On Sale', icon: ShoppingBag },
  custom: { label: 'Custom Section', icon: Grid },
};

// ==================== BANNER EDITOR MODAL ====================
function BannerEditorModal({ banner, onClose, onSave, platforms }) {
  const [formData, setFormData] = useState({
    placement_key: banner?.placement_key || 'hero_landing',
    image_url: banner?.image_url || '',
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    button_text: banner?.button_text || '',
    button_link: banner?.button_link || '',
    platform_slug: banner?.platform_slug || '',
    gender: banner?.gender || '',
    is_active: banner?.is_active ?? true,
    display_order: banner?.display_order || 0,
    start_date: banner?.start_date || '',
    end_date: banner?.end_date || '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const response = await SiteConfigAPI.uploadMedia(file, 'banner', file.name);
      setFormData(prev => ({ ...prev, image_url: response.url }));
      toast({ title: 'Image uploaded successfully' });
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.image_url) {
      toast({ title: 'Please upload an image', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
          <DialogDescription>
            Configure banner placement and content
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Image Upload/Preview */}
          <div className="space-y-2">
            <Label>Banner Image *</Label>
            {formData.image_url ? (
              <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-muted">
                <img
                  src={formData.image_url}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-[3/1] border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Click to upload banner image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Placement */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Placement *</Label>
              <Select
                value={formData.placement_key}
                onValueChange={(val) => setFormData(prev => ({ ...prev, placement_key: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLACEMENT_OPTIONS).map(([key, opt]) => (
                    <SelectItem key={key} value={key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={formData.platform_slug || 'all'}
                onValueChange={(val) => setFormData(prev => ({ ...prev, platform_slug: val === 'all' ? '' : val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms?.map(p => (
                    <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Banner title (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Textarea
              value={formData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Banner subtitle or description (optional)"
              rows={2}
            />
          </div>

          {/* Button */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input
                value={formData.button_text}
                onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                placeholder="Shop Now"
              />
            </div>
            <div className="space-y-2">
              <Label>Button Link</Label>
              <Input
                value={formData.button_link}
                onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
                placeholder="/segment/men"
              />
            </div>
          </div>

          {/* Gender targeting */}
          <div className="space-y-2">
            <Label>Target Gender</Label>
            <Select
              value={formData.gender || 'all'}
              onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val === 'all' ? '' : val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="men">Men Only</SelectItem>
                <SelectItem value="women">Women Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date (optional)</Label>
              <Input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date (optional)</Label>
              <Input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Active & Order */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                className="w-20"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {banner ? 'Update Banner' : 'Create Banner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== SECTION EDITOR MODAL ====================
function SectionEditorModal({ section, onClose, onSave, platforms }) {
  const [formData, setFormData] = useState({
    section_key: section?.section_key || 'custom',
    title: section?.title || '',
    subtitle: section?.subtitle || '',
    platform_slug: section?.platform_slug || '',
    gender: section?.gender || '',
    page_type: section?.page_type || 'landing',
    max_products: section?.max_products || 8,
    auto_populate: section?.auto_populate ?? false,
    auto_criteria: section?.auto_criteria || 'newest',
    display_order: section?.display_order || 0,
    is_active: section?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{section ? 'Edit Section' : 'Create New Section'}</DialogTitle>
          <DialogDescription>
            Configure a featured section for your website
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Section Type */}
          <div className="space-y-2">
            <Label>Section Type</Label>
            <Select
              value={formData.section_key}
              onValueChange={(val) => {
                const sectionType = SECTION_TYPES[val];
                setFormData(prev => ({
                  ...prev,
                  section_key: val,
                  title: prev.title || sectionType?.label || '',
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SECTION_TYPES).map(([key, opt]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="h-4 w-4" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Section Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Trending Now"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              value={formData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Optional description"
            />
          </div>

          {/* Page & Platform targeting */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Show On Page</Label>
              <Select
                value={formData.page_type}
                onValueChange={(val) => setFormData(prev => ({ ...prev, page_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landing">Landing Page</SelectItem>
                  <SelectItem value="segment">Segment Page</SelectItem>
                  <SelectItem value="products">All Products Page</SelectItem>
                  <SelectItem value="all">All Pages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={formData.platform_slug || 'all'}
                onValueChange={(val) => setFormData(prev => ({ ...prev, platform_slug: val === 'all' ? '' : val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms?.map(p => (
                    <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gender & Max Products */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Gender</Label>
              <Select
                value={formData.gender || 'all'}
                onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val === 'all' ? '' : val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="men">Men Only</SelectItem>
                  <SelectItem value="women">Women Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Products</Label>
              <Input
                type="number"
                value={formData.max_products}
                onChange={(e) => setFormData(prev => ({ ...prev, max_products: parseInt(e.target.value) || 8 }))}
                min={1}
                max={20}
              />
            </div>
          </div>

          {/* Auto populate */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.auto_populate}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_populate: checked }))}
              />
              <Label>Auto-populate products</Label>
            </div>
            
            {formData.auto_populate && (
              <Select
                value={formData.auto_criteria}
                onValueChange={(val) => setFormData(prev => ({ ...prev, auto_criteria: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="bestselling">Best Selling</SelectItem>
                  <SelectItem value="trending">Most Viewed</SelectItem>
                  <SelectItem value="on_sale">On Sale</SelectItem>
                  <SelectItem value="random">Random Selection</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Active & Order */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                className="w-20"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {section ? 'Update Section' : 'Create Section'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== PRODUCT SELECTOR MODAL ====================
function ProductSelectorModal({ section, onClose, onSave, products, currentProducts }) {
  const [selectedIds, setSelectedIds] = useState(currentProducts?.map(p => p.id) || []);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredProducts = products?.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const toggleProduct = (productId) => {
    setSelectedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedIds);
      onClose();
    } catch (error) {
      console.error('Failed to save products:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Products for "{section.title}"</DialogTitle>
          <DialogDescription>
            Choose up to {section.max_products} products to display in this section
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-10"
            />
          </div>

          {/* Selected count */}
          <div className="text-sm text-muted-foreground">
            {selectedIds.length} of {section.max_products} products selected
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
            {filteredProducts.map(product => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`relative border rounded-lg p-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="aspect-square mb-2 bg-muted rounded overflow-hidden">
                    <img
                      src={product.primary_image_url || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{product.sku}</p>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Selection ({selectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MEDIA UPLOAD MODAL ====================
function MediaUploadModal({ onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [usageType, setUsageType] = useState('banner');
  const [altText, setAltText] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setAltText(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'Please select a file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      await onUpload(file, usageType, altText);
      onClose();
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Upload an image to the media library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File drop zone */}
          {preview ? (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => { setFile(null); setPreview(''); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Click to select an image
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}

          {/* Usage type */}
          <div className="space-y-2">
            <Label>Usage Type</Label>
            <Select value={usageType} onValueChange={setUsageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="banner">Banner</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alt text */}
          <div className="space-y-2">
            <Label>Alt Text / Description</Label>
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Image description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AdminMedia() {
  const [activeTab, setActiveTab] = useState('banners');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [banners, setBanners] = useState([]);
  const [sections, setSections] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [products, setProducts] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  
  // Modal states
  const [bannerEditorOpen, setBannerEditorOpen] = useState(null);
  const [sectionEditorOpen, setSectionEditorOpen] = useState(null);
  const [productSelectorOpen, setProductSelectorOpen] = useState(null);
  const [mediaUploadOpen, setMediaUploadOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const { toast } = useToast();

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bannersRes, sectionsRes, mediaRes, productsRes, platformsRes] = await Promise.all([
        SiteConfigAPI.listBanners().catch(() => []),
        SiteConfigAPI.listSections().catch(() => []),
        SiteConfigAPI.listMedia().catch(() => []),
        AdminAPI.products.list({ limit: 500 }).catch(() => ({ data: [] })),
        AdminAPI.platforms.list().catch(() => ({ data: [] })),
      ]);
      
      // Ensure arrays - API may return array directly or wrapped in {data: [...]}
      setBanners(Array.isArray(bannersRes) ? bannersRes : (bannersRes?.data || []));
      setSections(Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes?.data || []));
      setMediaAssets(Array.isArray(mediaRes) ? mediaRes : (mediaRes?.data || []));
      setProducts(Array.isArray(productsRes) ? productsRes : (productsRes?.data || []));
      setPlatforms(Array.isArray(platformsRes) ? platformsRes : (platformsRes?.data || []));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== BANNER HANDLERS ====================
  const handleSaveBanner = async (data) => {
    try {
      if (bannerEditorOpen?.id) {
        await SiteConfigAPI.updateBanner(bannerEditorOpen.id, data);
        toast({ title: 'Banner updated successfully' });
      } else {
        await SiteConfigAPI.createBanner(data);
        toast({ title: 'Banner created successfully' });
      }
      fetchData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteBanner = async (banner) => {
    try {
      await SiteConfigAPI.deleteBanner(banner.id);
      toast({ title: 'Banner deleted successfully' });
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to delete banner', variant: 'destructive' });
    }
  };

  // ==================== SECTION HANDLERS ====================
  const handleSaveSection = async (data) => {
    try {
      if (sectionEditorOpen?.id) {
        await SiteConfigAPI.updateSection(sectionEditorOpen.id, data);
        toast({ title: 'Section updated successfully' });
      } else {
        await SiteConfigAPI.createSection(data);
        toast({ title: 'Section created successfully' });
      }
      fetchData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteSection = async (section) => {
    try {
      await SiteConfigAPI.deleteSection(section.id);
      toast({ title: 'Section deleted successfully' });
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to delete section', variant: 'destructive' });
    }
  };

  const handleSaveSectionProducts = async (productIds) => {
    try {
      await SiteConfigAPI.setSectionProducts(productSelectorOpen.id, productIds);
      toast({ title: 'Products updated successfully' });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to save products', variant: 'destructive' });
    }
  };

  // ==================== MEDIA HANDLERS ====================
  const handleUploadMedia = async (file, usageType, altText) => {
    try {
      await SiteConfigAPI.uploadMedia(file, usageType, altText);
      toast({ title: 'Media uploaded successfully' });
      fetchData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteMedia = async (media) => {
    try {
      await SiteConfigAPI.deleteMedia(media.id);
      toast({ title: 'Media deleted successfully' });
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to delete media', variant: 'destructive' });
    }
  };

  // Filter media assets
  const filteredMedia = mediaAssets.filter((asset) => {
    const matchesSearch = asset.alt_text?.toLowerCase().includes(search.toLowerCase()) ||
      asset.cloudinary_url?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || asset.usage_type === filterType;
    return matchesSearch && matchesType;
  });

  // Stats
  const stats = {
    banners: banners.length,
    activeBanners: banners.filter(b => b.is_active).length,
    sections: sections.length,
    activeSections: sections.filter(s => s.is_active).length,
    media: mediaAssets.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Website Control Center
          </h1>
          <p className="text-muted-foreground">
            Manage banners, featured sections, and media for your website
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Total Banners</p>
          <p className="text-2xl font-bold">{stats.banners}</p>
          <p className="text-xs text-green-600">{stats.activeBanners} active</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Featured Sections</p>
          <p className="text-2xl font-bold">{stats.sections}</p>
          <p className="text-xs text-green-600">{stats.activeSections} active</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Media Assets</p>
          <p className="text-2xl font-bold">{stats.media}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Products</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Platforms</p>
          <p className="text-2xl font-bold">{platforms.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Banners
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Featured Sections
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Media Library
          </TabsTrigger>
        </TabsList>

        {/* BANNERS TAB */}
        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Manage hero banners, promotional banners, and other visual elements
            </p>
            <Button onClick={() => setBannerEditorOpen({})}>
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          </div>

          {banners.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Layout className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No banners configured yet</p>
              <Button onClick={() => setBannerEditorOpen({})}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Banner
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {banners.map((banner) => (
                <Card key={banner.id} className={!banner.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Banner preview */}
                      <div className="w-48 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Banner info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{banner.title || 'Untitled Banner'}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {banner.subtitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                              {banner.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">
                            {PLACEMENT_OPTIONS[banner.placement_key]?.label || banner.placement_key}
                          </Badge>
                          {banner.platform_slug && (
                            <Badge variant="outline">{banner.platform_slug}</Badge>
                          )}
                          {banner.gender && (
                            <Badge variant="outline" className="capitalize">{banner.gender}</Badge>
                          )}
                          {banner.button_text && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <LinkIcon className="h-3 w-3" />
                              {banner.button_text}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setBannerEditorOpen(banner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteConfirm({ type: 'banner', item: banner })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SECTIONS TAB */}
        <TabsContent value="sections" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Configure product sections like Trending, Featured, New Arrivals
            </p>
            <Button onClick={() => setSectionEditorOpen({})}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Grid className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No sections configured yet</p>
              <Button onClick={() => setSectionEditorOpen({})}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Section
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {sections.map((section) => {
                const SectionIcon = SECTION_TYPES[section.section_key]?.icon || Grid;
                return (
                  <Card key={section.id} className={!section.is_active ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <SectionIcon className="h-6 w-6 text-primary" />
                        </div>
                        
                        {/* Section info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold">{section.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {section.subtitle || SECTION_TYPES[section.section_key]?.label}
                              </p>
                            </div>
                            <Badge variant={section.is_active ? 'default' : 'secondary'}>
                              {section.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">
                              {section.page_type === 'landing' ? 'Landing Page' :
                               section.page_type === 'segment' ? 'Segment Page' :
                               section.page_type === 'products' ? 'Products Page' : 'All Pages'}
                            </Badge>
                            {section.platform_slug && (
                              <Badge variant="outline">{section.platform_slug}</Badge>
                            )}
                            {section.gender && (
                              <Badge variant="outline" className="capitalize">{section.gender}</Badge>
                            )}
                            <Badge variant="outline">
                              Max {section.max_products} products
                            </Badge>
                            {section.auto_populate ? (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Auto: {section.auto_criteria}
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {section.products?.length || 0} products assigned
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!section.auto_populate && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setProductSelectorOpen(section)}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Products
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSectionEditorOpen(section)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setDeleteConfirm({ type: 'section', item: section })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* MEDIA TAB */}
        <TabsContent value="media" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search media..."
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setMediaUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </div>

          {filteredMedia.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {search || filterType !== 'all' ? 'No media matches your filters' : 'No media uploaded yet'}
              </p>
              <Button onClick={() => setMediaUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMedia.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative border rounded-lg overflow-hidden bg-card"
                >
                  <div className="aspect-square bg-muted">
                    <img
                      src={asset.cloudinary_url}
                      alt={asset.alt_text}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigator.clipboard.writeText(asset.cloudinary_url)}
                    >
                      Copy URL
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteConfirm({ type: 'media', item: asset })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-sm truncate">{asset.alt_text || 'Untitled'}</p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {asset.usage_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================== MODALS ==================== */}
      
      {/* Banner Editor */}
      {bannerEditorOpen && (
        <BannerEditorModal
          banner={bannerEditorOpen.id ? bannerEditorOpen : null}
          onClose={() => setBannerEditorOpen(null)}
          onSave={handleSaveBanner}
          platforms={platforms}
        />
      )}

      {/* Section Editor */}
      {sectionEditorOpen && (
        <SectionEditorModal
          section={sectionEditorOpen.id ? sectionEditorOpen : null}
          onClose={() => setSectionEditorOpen(null)}
          onSave={handleSaveSection}
          platforms={platforms}
        />
      )}

      {/* Product Selector */}
      {productSelectorOpen && (
        <ProductSelectorModal
          section={productSelectorOpen}
          onClose={() => setProductSelectorOpen(null)}
          onSave={handleSaveSectionProducts}
          products={products}
          currentProducts={productSelectorOpen.products || []}
        />
      )}

      {/* Media Upload */}
      {mediaUploadOpen && (
        <MediaUploadModal
          onClose={() => setMediaUploadOpen(false)}
          onUpload={handleUploadMedia}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirm.type === 'banner') handleDeleteBanner(deleteConfirm.item);
                  else if (deleteConfirm.type === 'section') handleDeleteSection(deleteConfirm.item);
                  else if (deleteConfirm.type === 'media') handleDeleteMedia(deleteConfirm.item);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
