import { useState, useEffect } from 'react';
import { AdminAPI } from '@/lib/api';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

/**
 * Media Library Page
 * View all uploaded images, filter by usage, reuse images, detect unused media
 */

// Image detail modal
function ImageDetailModal({ image, onClose, onDelete }) {
  if (!image) return null;

  return (
    <Dialog open={!!image} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Image Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image preview */}
          <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Image info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{image.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{image.usage_type || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">{image.size || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Uploaded</p>
              <p className="font-medium">{image.created_at ? new Date(image.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">URL</p>
              <p className="font-mono text-xs break-all">{image.url}</p>
            </div>
            {image.product_name && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Used in Product</p>
                <p className="font-medium">{image.product_name}</p>
              </div>
            )}
            {image.catalogue_name && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Used in Catalogue</p>
                <p className="font-medium">{image.catalogue_name}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" asChild>
            <a href={image.url} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
          <Button variant="destructive" onClick={() => onDelete(image)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Media Library Page
export default function AdminMedia() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUsage, setFilterUsage] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await AdminAPI.media.list();
      // setImages(response.data);

      // Mock data for demonstration
      setImages([
        {
          id: 1,
          name: 'nike-air-max-white.jpg',
          url: 'https://via.placeholder.com/400x300/FFFFFF/000000?text=Nike+Air+Max+White',
          usage_type: 'product',
          size: '245 KB',
          product_name: 'Nike Air Max - White',
          created_at: '2024-01-15',
          is_used: true,
        },
        {
          id: 2,
          name: 'nike-air-max-black.jpg',
          url: 'https://via.placeholder.com/400x300/000000/FFFFFF?text=Nike+Air+Max+Black',
          usage_type: 'product',
          size: '232 KB',
          product_name: 'Nike Air Max - Black',
          created_at: '2024-01-15',
          is_used: true,
        },
        {
          id: 3,
          name: 'catalogue-banner-1.jpg',
          url: 'https://via.placeholder.com/1200x400/C9A24D/FFFFFF?text=Summer+Collection',
          usage_type: 'catalogue',
          size: '512 KB',
          catalogue_name: 'Summer Collection 2024',
          created_at: '2024-01-10',
          is_used: true,
        },
        {
          id: 4,
          name: 'lifestyle-running-1.jpg',
          url: 'https://via.placeholder.com/800x600/4169E1/FFFFFF?text=Lifestyle+Shot',
          usage_type: 'lifestyle',
          size: '432 KB',
          created_at: '2024-01-08',
          is_used: true,
        },
        {
          id: 5,
          name: 'unused-image.jpg',
          url: 'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Unused',
          usage_type: 'product',
          size: '189 KB',
          created_at: '2024-01-01',
          is_used: false,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media library',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (image) => {
    try {
      // await AdminAPI.media.delete(image.id);
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
      fetchImages();
      setDeleteConfirm(null);
      setSelectedImage(null);
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  const filteredImages = images.filter((image) => {
    const matchesSearch = image.name.toLowerCase().includes(search.toLowerCase()) ||
      image.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      image.catalogue_name?.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'all' || image.usage_type === filterType;
    const matchesUsage = filterUsage === 'all' ||
      (filterUsage === 'used' && image.is_used) ||
      (filterUsage === 'unused' && !image.is_used);

    return matchesSearch && matchesType && matchesUsage;
  });

  const stats = {
    total: images.length,
    product: images.filter(i => i.usage_type === 'product').length,
    catalogue: images.filter(i => i.usage_type === 'catalogue').length,
    lifestyle: images.filter(i => i.usage_type === 'lifestyle').length,
    unused: images.filter(i => !i.is_used).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            View, manage, and reuse uploaded images
          </p>
        </div>
        <Button variant="outline" onClick={fetchImages}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Total Images</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Product</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.product}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Catalogue</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.catalogue}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Lifestyle</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.lifestyle}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="text-sm text-muted-foreground">Unused</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.unused}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, product, or catalogue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type filter */}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="catalogue">Catalogue</SelectItem>
            <SelectItem value="lifestyle">Lifestyle</SelectItem>
          </SelectContent>
        </Select>

        {/* Usage filter */}
        <Select value={filterUsage} onValueChange={setFilterUsage}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by usage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Images</SelectItem>
            <SelectItem value="used">Used Only</SelectItem>
            <SelectItem value="unused">Unused Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Images Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            {search || filterType !== 'all' || filterUsage !== 'all'
              ? 'No images match your filters'
              : 'No images in library'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              {/* Image */}
              <div className="aspect-square bg-muted">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="h-8 w-8 text-white" />
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium truncate" title={image.name}>
                  {image.name}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{image.usage_type}</span>
                  <span>{image.size}</span>
                </div>
                {!image.is_used && (
                  <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    <span>Unused</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={(image) => {
            setDeleteConfirm(image);
            setSelectedImage(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Image</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                {deleteConfirm.is_used && (
                  <span className="block mt-2 text-yellow-600 dark:text-yellow-400">
                    Warning: This image is currently in use!
                  </span>
                )}
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
