import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  X,
  Copy,
  Package,
  Tag,
  Palette,
  ImagePlus,
  Save,
  ArrowLeft,
  Check,
  Loader2,
  Heart,
  ShoppingBag,
  Star,
  ChevronDown,
  Search,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { AdminAPI } from '@/lib/api';

// ========================
// Constants (API fetched values will replace these)
// ========================

// Gender options - these are fixed as they map to the Gender enum in the backend
const GENDER_OPTIONS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'boys', label: 'Boys' },
  { value: 'girls', label: 'Girls' },
  { value: 'unisex', label: 'Unisex' },
];

// Fallback gender-specific categories (will be replaced by API data)
const CATEGORY_OPTIONS_BY_GENDER = {
  men: [
    { value: 'sneakers', label: 'Sneakers' },
    { value: 'sports', label: 'Sports Shoes' },
    { value: 'running', label: 'Running' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
    { value: 'loafers', label: 'Loafers' },
    { value: 'boots', label: 'Boots' },
    { value: 'sandals', label: 'Sandals' },
    { value: 'slippers', label: 'Slippers' },
    { value: 'oxfords', label: 'Oxfords' },
    { value: 'derby', label: 'Derby' },
    { value: 'brogues', label: 'Brogues' },
    { value: 'moccasins', label: 'Moccasins' },
  ],
  women: [
    { value: 'sneakers', label: 'Sneakers' },
    { value: 'sports', label: 'Sports Shoes' },
    { value: 'running', label: 'Running' },
    { value: 'casual', label: 'Casual' },
    { value: 'heels', label: 'Heels' },
    { value: 'stilettos', label: 'Stilettos' },
    { value: 'wedges', label: 'Wedges' },
    { value: 'pumps', label: 'Pumps' },
    { value: 'flats', label: 'Flats' },
    { value: 'ballerinas', label: 'Ballerinas' },
    { value: 'boots', label: 'Boots' },
    { value: 'ankle-boots', label: 'Ankle Boots' },
    { value: 'sandals', label: 'Sandals' },
    { value: 'slippers', label: 'Slippers' },
    { value: 'mules', label: 'Mules' },
    { value: 'loafers', label: 'Loafers' },
  ],
  boys: [
    { value: 'sneakers', label: 'Sneakers' },
    { value: 'sports', label: 'Sports Shoes' },
    { value: 'running', label: 'Running' },
    { value: 'school', label: 'School Shoes' },
    { value: 'casual', label: 'Casual' },
    { value: 'sandals', label: 'Sandals' },
    { value: 'slippers', label: 'Slippers' },
    { value: 'velcro', label: 'Velcro Shoes' },
    { value: 'light-up', label: 'Light Up Shoes' },
    { value: 'boots', label: 'Boots' },
    { value: 'flip-flops', label: 'Flip Flops' },
  ],
  girls: [
    { value: 'sneakers', label: 'Sneakers' },
    { value: 'sports', label: 'Sports Shoes' },
    { value: 'running', label: 'Running' },
    { value: 'velcro', label: 'Velcro Shoes' },
    { value: 'light-up', label: 'Light Up Shoes' },
    { value: 'boots', label: 'Boots' },
    { value: 'sandals', label: 'Sandals' },
    { value: 'flats', label: 'Flats' },
  ],
  unisex: [
    { value: 'sneakers', label: 'Sneakers' },
    { value: 'sports', label: 'Sports Shoes' },
    { value: 'running', label: 'Running' },
    { value: 'casual', label: 'Casual' },
    { value: 'boots', label: 'Boots' },
    { value: 'sandals', label: 'Sandals' },
    { value: 'slippers', label: 'Slippers' },
    { value: 'loafers', label: 'Loafers' },
    { value: 'slides', label: 'Slides' },
  ],
};

const SIZE_OPTIONS = {
  men: ['6', '7', '8', '9', '10', '11', '12', '13', '14'],
  women: ['4', '5', '6', '7', '8', '9', '10', '11'],
  boys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
  girls: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
  unisex: ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
};

// Size options based on size chart type (IND, UK, EU)
const SIZE_OPTIONS_BY_CHART_TYPE = {
  IND: {
    men: ['6', '7', '8', '9', '10', '11', '12', '13', '14'],
    women: ['3', '4', '5', '6', '7', '8', '9', '10'],
    boys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '15', '16', '17', '18', '19', '20'],
    girls: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '15', '16', '17', '18', '19', '20'],
    unisex: ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
  },
  UK: {
    men: ['6', '7', '8', '9', '10', '11', '12', '13', '14'],
    women: ['3', '4', '5', '6', '7', '8', '9', '10'],
    boys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '15', '16', '17', '18', '19', '20'],
    girls: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '15', '16', '17', '18', '19', '20'],
    unisex: ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
  },
  EU: {
    men: ['40', '41', '42', '43', '44', '45', '46', '47', '48'],
    women: ['36', '37', '38', '39', '40', '41', '42', '43'],
    boys: ['17', '18', '19', '20', '21', '23', '24', '25', '27', '28', '29', '30', '31', '33', '34', '35', '36', '37', '38'],
    girls: ['17', '18', '19', '20', '21', '23', '24', '25', '27', '28', '29', '30', '31', '33', '34', '35', '36', '37', '38'],
    unisex: ['37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
  },
};

const COLOR_OPTIONS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy Blue', hex: '#1e3a5f' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Rose', hex: '#FF007F' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Yellow', hex: '#FBBF24' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Purple', hex: '#9333EA' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Grey', hex: '#6B7280' },
  { name: 'Charcoal', hex: '#36454F' },
  { name: 'Silver', hex: '#C0C0C0' },
];

const BRAND_OPTIONS = [
  'Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 
  'Converse', 'Vans', 'Jordan', 'Skechers', 'Fila',
  'Under Armour', 'ASICS', 'Brooks', 'Hoka', 'Salomon',
  'Clarks', 'Cole Haan', 'Allen Edmonds', 'Other'
];

const TAG_OPTIONS = [
  'New Arrival', 'Best Seller', 'Limited Edition', 'Sale', 
  'Trending', 'Exclusive', 'Premium', 'Eco-Friendly',
  'Comfortable', 'Lightweight', 'Waterproof', 'Breathable'
];

// ========================
// Helper Functions
// ========================

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const generateSKU = (article, color, size) => {
  const articlePart = article?.replace(/[^a-zA-Z0-9]/g, '')?.substring(0, 4)?.toUpperCase() || 'PROD';
  const colorPart = color?.replace(/[^a-zA-Z0-9]/g, '')?.substring(0, 3)?.toUpperCase() || 'COL';
  const parts = [articlePart, colorPart];
  if (size) {
    parts.push(String(size).toUpperCase());
  }
  return parts.join('-');
};

const formatPrice = (price) => {
  if (!price) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

// ========================
// Sub Components
// ========================

// Constants for image upload validation
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Image Upload Component with production-grade validation and drag-drop reorder
function ImageUploader({ images, onImagesChange, maxImages = 6 }) {
  const { toast } = useToast();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const validateFile = (file) => {
    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, GIF, WebP` };
    }
    // Check file size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return { valid: false, error: `File too large (${sizeMB}MB). Maximum: ${MAX_IMAGE_SIZE_MB}MB` };
    }
    return { valid: true };
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validImages = [];
    const errors = [];

    for (const file of files.slice(0, maxImages - images.length)) {
      const validation = validateFile(file);
      if (validation.valid) {
        validImages.push({
          id: Date.now() + Math.random(),
          file,
          preview: URL.createObjectURL(file),
          isPrimary: images.length === 0 && validImages.length === 0,
          fileName: file.name,
          fileSize: file.size,
          isExisting: false,
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      toast({
        title: 'Some files were rejected',
        description: errors.join('\n'),
        variant: 'destructive',
      });
    }

    if (validImages.length > 0) {
      onImagesChange([...images, ...validImages]);
    }
  };

  const removeImage = (id) => {
    const filtered = images.filter(img => img.id !== id);
    if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    onImagesChange(filtered);
  };

  const setPrimary = (id) => {
    onImagesChange(images.map(img => ({
      ...img,
      isPrimary: img.id === id,
    })));
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const fromIndex = draggedIndex;
    
    if (fromIndex !== null && fromIndex !== dropIndex) {
      const newImages = [...images];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(dropIndex, 0, movedImage);
      
      // Update display order
      const updatedImages = newImages.map((img, idx) => ({
        ...img,
        displayOrder: idx,
      }));
      
      onImagesChange(updatedImages);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move image up/down with buttons (alternative to drag-drop)
  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    const newImages = [...images];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    
    const updatedImages = newImages.map((img, idx) => ({
      ...img,
      displayOrder: idx,
    }));
    
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {images.map((image, index) => (
          <div 
            key={image.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-move ${
              image.isPrimary 
                ? 'border-primary ring-2 ring-primary/20' 
                : 'border-border hover:border-muted-foreground'
            } ${draggedIndex === index ? 'opacity-50' : ''} ${dragOverIndex === index ? 'border-primary border-dashed' : ''}`}
          >
            <img 
              src={image.preview} 
              alt="Product" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(image.id)}
                    className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    title="Set as primary"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
              {/* Move buttons */}
              <div className="flex items-center gap-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    className="p-1.5 bg-white/90 rounded hover:bg-white transition-colors text-xs"
                    title="Move left"
                  >
                    ← Move
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    className="p-1.5 bg-white/90 rounded hover:bg-white transition-colors text-xs"
                    title="Move right"
                  >
                    Move →
                  </button>
                )}
              </div>
            </div>
            {image.isPrimary && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                Primary
              </div>
            )}
            {/* Position indicator */}
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
              {index + 1}
            </div>
            {/* Show file size or existing indicator */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
              {image.isExisting ? 'Saved' : image.fileSize ? `${(image.fileSize / (1024 * 1024)).toFixed(1)}MB` : 'New'}
            </div>
          </div>
        ))}
        
        {images.length < maxImages && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50">
            <ImagePlus className="w-8 h-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add Image</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {images.length}/{maxImages} images • Drag to reorder • Click to set as primary
      </p>
      <p className="text-xs text-muted-foreground text-center">
        Accepted: JPG, PNG, GIF, WebP • Max {MAX_IMAGE_SIZE_MB}MB per image
      </p>
    </div>
  );
}

// Searchable Color Picker Component
function SearchableColorPicker({ value, colorHex, onSelect }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customColors, setCustomColors] = useState([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [showAddForm, setShowAddForm] = useState(false);

  const allColors = [...COLOR_OPTIONS, ...customColors];
  const filteredColors = allColors.filter(color =>
    color.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedColor = allColors.find(c => c.name === value);
  const displayHex = colorHex || selectedColor?.hex || '#666';

  const handleAddColor = () => {
    if (newColorName.trim()) {
      const newColor = { name: newColorName.trim(), hex: newColorHex };
      setCustomColors([...customColors, newColor]);
      onSelect(newColor.name, newColor.hex);
      setNewColorName('');
      setNewColorHex('#000000');
      setShowAddForm(false);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: displayHex }}
              />
              {value}
            </div>
          ) : (
            <span className="text-muted-foreground">Select color...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {/* Search Input */}
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search colors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Color List */}
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filteredColors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No colors found</p>
          ) : (
            filteredColors.map((color) => (
              <button
                key={color.name}
                onClick={() => {
                  onSelect(color.name, color.hex);
                  setOpen(false);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors ${
                  value === color.name ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <div 
                  className="w-5 h-5 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
                {value === color.name && <Check className="ml-auto h-4 w-4" />}
              </button>
            ))
          )}
        </div>

        {/* Add New Color Section */}
        <div className="border-t border-border p-2">
          {!showAddForm ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="w-full justify-start gap-2 text-primary"
            >
              <Plus className="h-4 w-4" />
              Add new color
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Color name"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="h-8 flex-1"
                />
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-10 h-8 rounded border border-border cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddColor} className="flex-1 h-7">
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)} className="h-7">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Searchable Brand Picker Component
// Searchable Brand Picker Component - now uses API data
function SearchableBrandPicker({ brandId, brandName, brands, onSelect, onCreateBrand }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredBrands = (brands || []).filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    
    // Check if brand already exists
    const existing = brands.find(b => b.name.toLowerCase() === newBrandName.trim().toLowerCase());
    if (existing) {
      onSelect(existing.id, existing.name);
      setNewBrandName('');
      setOpen(false);
      return;
    }

    // Create new brand via API
    if (onCreateBrand) {
      setIsCreating(true);
      try {
        const newBrand = await onCreateBrand(newBrandName.trim());
        if (newBrand) {
          onSelect(newBrand.id, newBrand.name);
          setNewBrandName('');
          setOpen(false);
        }
      } catch (error) {
        console.error('Failed to create brand:', error);
      } finally {
        setIsCreating(false);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11"
        >
          {brandName ? (
            <span>{brandName}</span>
          ) : (
            <span className="text-muted-foreground">Select brand...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {/* Search Input */}
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Brand List */}
        <div className="max-h-[200px] overflow-y-auto p-1">
          {filteredBrands.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">No brands found</p>
              {searchQuery && (
                <Button
                  size="sm"
                  onClick={() => {
                    setNewBrandName(searchQuery);
                    handleAddBrand();
                  }}
                  disabled={isCreating}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add "{searchQuery}"
                </Button>
              )}
            </div>
          ) : (
            filteredBrands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => {
                  onSelect(brand.id, brand.name);
                  setOpen(false);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors ${
                  brandId === brand.id ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <span>{brand.name}</span>
                {brandId === brand.id && <Check className="ml-auto h-4 w-4" />}
              </button>
            ))
          )}
        </div>

        {/* Add New Brand */}
        <div className="border-t border-border p-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add new brand..."
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
              className="h-8 flex-1"
              disabled={isCreating}
            />
            <Button 
              type="button"
              size="sm" 
              onClick={handleAddBrand} 
              disabled={!newBrandName.trim() || isCreating} 
              className="h-8"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Product Preview Card Component
function ProductPreviewCard({ product, catalogueData }) {
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const price = product.sizeVariants?.[product.selectedSizes?.[0]]?.price;
  const mrp = product.sizeVariants?.[product.selectedSizes?.[0]]?.mrp;
  // Use product's colorHex (for custom colors) or fall back to COLOR_OPTIONS
  const colorHex = product.colorHex || COLOR_OPTIONS.find(c => c.name === product.color)?.hex || '#666';
  
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
      <div className="relative aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
        {primaryImage ? (
          <img 
            src={primaryImage.preview} 
            alt={product.name || 'Product'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Wishlist button */}
        <button className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-black/50 rounded-full hover:bg-white dark:hover:bg-black transition-colors">
          <Heart className="w-4 h-4 text-muted-foreground" />
        </button>
        
        {/* Tags */}
        {product.tags?.length > 0 && (
          <div className="absolute top-3 left-3">
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
              {product.tags[0]}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        {/* Brand */}
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {product.brandName || 'Brand'}
        </p>
        
        {/* Name */}
        <h3 className="font-semibold text-foreground line-clamp-2">
          {product.name || 'Product Name'}
        </h3>
        
        {/* Color indicator */}
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: colorHex }}
          />
          <span className="text-sm text-muted-foreground">{product.color || 'Color'}</span>
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="text-xs text-muted-foreground ml-1">(4.8)</span>
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(price)}
          </span>
          {mrp && Number(mrp) > Number(price) && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(mrp)}
              </span>
              <span className="text-xs text-green-600 font-medium">
                {Math.round((1 - Number(price) / Number(mrp)) * 100)}% off
              </span>
            </>
          )}
        </div>
        
        {/* Sizes */}
        {product.selectedSizes?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.selectedSizes.slice(0, 5).map(size => (
              <span 
                key={size}
                className="text-xs px-2 py-1 bg-muted rounded"
              >
                {size}
              </span>
            ))}
            {product.selectedSizes.length > 5 && (
              <span className="text-xs px-2 py-1 bg-muted rounded">
                +{product.selectedSizes.length - 5}
              </span>
            )}
          </div>
        )}
        
        {/* Add to Cart */}
        <Button className="w-full gap-2" size="sm">
          <ShoppingBag className="w-4 h-4" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}

// Size Variant Row Component
function SizeVariantRow({ size, data, baseSKU, color, onUpdate, onRemove, isFirst, onFillAll }) {
  // Format color for SKU: "White/Grey" -> "WHITE-GREY"
  const colorPart = color?.replace(/[^a-zA-Z0-9]/g, '-')?.replace(/-+/g, '-')?.replace(/^-|-$/g, '')?.toUpperCase() || '';
  const autoSKU = colorPart ? `${baseSKU}-${colorPart}-${size}` : `${baseSKU}-${size}`;
  
  // For the first row, use onFillAll to update ALL rows at once (including itself)
  // For other rows, just update that single row
  const handleMrpChange = (value) => {
    if (isFirst) {
      // Update ALL sizes at once (including this one)
      onFillAll('mrp', value);
    } else {
      onUpdate({ ...data, mrp: value });
    }
  };

  const handlePriceChange = (value) => {
    if (isFirst) {
      onFillAll('price', value);
    } else {
      onUpdate({ ...data, price: value });
    }
  };

  const handleInventoryChange = (value) => {
    if (isFirst) {
      onFillAll('inventory', value);
    } else {
      onUpdate({ ...data, inventory: value });
    }
  };
  
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">UK {size}</span>
          {isFirst && (
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
              Auto-fill
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={data.mrp || ''}
          onChange={(e) => handleMrpChange(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="0"
          className="w-32 h-9"
        />
      </td>
      <td className="py-3 px-4">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={data.price || ''}
          onChange={(e) => handlePriceChange(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="0"
          className="w-32 h-9"
        />
      </td>
      <td className="py-3 px-4">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={data.inventory || ''}
          onChange={(e) => handleInventoryChange(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="0"
          className="w-28 h-9"
        />
      </td>
      <td className="py-3 px-4">
        <Input
          value={data.skuId || autoSKU}
          onChange={(e) => onUpdate({ ...data, skuId: e.target.value })}
          placeholder={autoSKU}
          className="w-36 h-9 font-mono text-sm"
        />
      </td>
      <td className="py-3 px-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}

// Single Product Tab Component
function ProductTab({ 
  product, 
  index, 
  catalogueData,
  brands,
  onUpdate, 
  onRemove, 
  onCopy,
  onCreateBrand,
  canRemove 
}) {
  // Get sizes based on size chart type and gender
  const sizeChartType = product.footwearDetails?.sizeChartType || 'IND';
  const availableSizes = SIZE_OPTIONS_BY_CHART_TYPE[sizeChartType]?.[catalogueData.gender] || 
                         SIZE_OPTIONS_BY_CHART_TYPE['IND'][catalogueData.gender] || 
                         SIZE_OPTIONS.men;
  const baseSKU = generateSKU(catalogueData.article, product.color, '');

  const handleSizeToggle = (size, checked) => {
    const newSelectedSizes = checked
      ? [...product.selectedSizes, size]
      : product.selectedSizes.filter(s => s !== size);
    
    const newSizeVariants = { ...product.sizeVariants };
    if (checked && !newSizeVariants[size]) {
      // Auto-fill from first size if available
      const firstSize = product.selectedSizes[0];
      const firstSizeData = firstSize ? product.sizeVariants[firstSize] : null;
      newSizeVariants[size] = firstSizeData 
        ? { ...firstSizeData, skuId: '' }
        : { price: '', mrp: '', inventory: '', skuId: '' };
    }
    
    onUpdate({
      ...product,
      selectedSizes: newSelectedSizes.sort((a, b) => Number(a) - Number(b)),
      sizeVariants: newSizeVariants,
    });
  };

  const handleSizeVariantUpdate = (size, data) => {
    onUpdate({
      ...product,
      sizeVariants: {
        ...product.sizeVariants,
        [size]: data,
      },
    });
  };

  const handleFillAllSizes = (field, value) => {
    const newSizeVariants = { ...product.sizeVariants };
    // Update ALL sizes with the value (called from first row)
    product.selectedSizes.forEach(size => {
      if (!newSizeVariants[size]) {
        newSizeVariants[size] = { price: '', mrp: '', inventory: '', skuId: '' };
      }
      newSizeVariants[size][field] = value;
    });
    onUpdate({
      ...product,
      sizeVariants: newSizeVariants,
    });
  };

  const handleRemoveSize = (size) => {
    const newSelectedSizes = product.selectedSizes.filter(s => s !== size);
    const newSizeVariants = { ...product.sizeVariants };
    delete newSizeVariants[size];
    
    onUpdate({
      ...product,
      selectedSizes: newSelectedSizes,
      sizeVariants: newSizeVariants,
    });
  };

  const handleNameChange = (name) => {
    onUpdate({
      ...product,
      name,
      slug: generateSlug(name),
    });
  };

  return (
    <div className="space-y-8">
      {/* Product Details Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Product Details (Color SKU)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Color Selection - Searchable with Add New */}
          <div className="space-y-2">
            <Label htmlFor={`color-${index}`}>Color *</Label>
            <SearchableColorPicker
              value={product.color}
              colorHex={product.colorHex}
              onSelect={(colorName, colorHex) => onUpdate({ ...product, color: colorName, colorHex: colorHex })}
            />
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor={`name-${index}`}>Product Name *</Label>
            <Input
              id={`name-${index}`}
              value={product.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Classic Sneaker Black"
              className="h-11"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor={`slug-${index}`}>Slug</Label>
            <Input
              id={`slug-${index}`}
              value={product.slug}
              onChange={(e) => onUpdate({ ...product, slug: e.target.value })}
              placeholder="auto-generated"
              className="h-11 font-mono text-sm"
            />
          </div>

          {/* Base SKU */}
          <div className="space-y-2">
            <Label htmlFor={`sku-${index}`}>Base SKU *</Label>
            <Input
              id={`sku-${index}`}
              value={product.sku}
              onChange={(e) => onUpdate({ ...product, sku: e.target.value.toUpperCase() })}
              placeholder="e.g., SNKR-BLK"
              className="h-11 font-mono"
            />
          </div>

          {/* Brand - Searchable with Add New */}
          <div className="space-y-2">
            <Label htmlFor={`brand-${index}`}>Brand *</Label>
            <SearchableBrandPicker
              brandId={product.brandId}
              brandName={product.brandName}
              brands={brands}
              onSelect={(brandId, brandName) => onUpdate({ ...product, brandId, brandName })}
              onCreateBrand={onCreateBrand}
            />
          </div>
        </div>
      </div>

      {/* Size Selection Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Sizes & Variants
          </h3>
          
          {/* Size Chart Type - Right Side */}
          <div className="flex items-center gap-2">
            <Label htmlFor={`sizeChartType-${index}`} className="text-sm font-medium whitespace-nowrap">
              Size Chart Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={product.footwearDetails?.sizeChartType || 'IND'}
              onValueChange={(value) => {
                // Clear selected sizes when changing size chart type
                onUpdate({
                  ...product,
                  footwearDetails: { ...product.footwearDetails, sizeChartType: value },
                  selectedSizes: [],
                  sizeVariants: {},
                });
              }}
            >
              <SelectTrigger className="h-10 w-[140px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IND">IND</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="EU">EU</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Size Checkboxes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Label>Select Available Sizes ({product.footwearDetails?.sizeChartType || 'IND'})</Label>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              💡 Fill first size to auto-fill others
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {availableSizes.map((size) => (
              <label
                key={size}
                className={`flex items-center justify-center w-12 h-12 rounded-lg border-2 cursor-pointer transition-all ${
                  product.selectedSizes.includes(size)
                    ? 'bg-primary border-primary text-primary-foreground font-semibold'
                    : 'bg-background border-border hover:border-primary/50 text-foreground'
                }`}
              >
                <input
                  type="checkbox"
                  checked={product.selectedSizes.includes(size)}
                  onChange={(e) => handleSizeToggle(size, e.target.checked)}
                  className="sr-only"
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        {/* Size Variants Table */}
        {product.selectedSizes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground">Size</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground">MRP (₹) *</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground">Selling Price (₹) *</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground">Inventory</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground">SKU ID</th>
                  <th className="py-3 px-4 font-semibold text-sm text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {product.selectedSizes.map((size, idx) => (
                  <SizeVariantRow
                    key={size}
                    size={size}
                    data={product.sizeVariants[size] || {}}
                    baseSKU={product.sku || baseSKU}
                    color={product.color}
                    onUpdate={(data) => handleSizeVariantUpdate(size, data)}
                    onRemove={() => handleRemoveSize(size)}
                    isFirst={idx === 0}
                    onFillAll={handleFillAllSizes}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {product.selectedSizes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Select sizes above to add pricing and inventory</p>
          </div>
        )}
      </div>

      {/* Description & Specifications Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          Description & Tags
        </h3>

        <div className="space-y-6">
          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor={`short-description-${index}`}>Short Description</Label>
            <Textarea
              id={`short-description-${index}`}
              value={product.shortDescription}
              onChange={(e) => onUpdate({ ...product, shortDescription: e.target.value })}
              placeholder="Enter a brief product description..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Long Description */}
          <div className="space-y-2">
            <Label htmlFor={`long-description-${index}`}>Long Description</Label>
            <Textarea
              id={`long-description-${index}`}
              value={product.longDescription}
              onChange={(e) => onUpdate({ ...product, longDescription: e.target.value })}
              placeholder="Enter detailed product description..."
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Specifications */}
          <div className="space-y-2">
            <Label htmlFor={`specifications-${index}`}>Specifications</Label>
            <Textarea
              id={`specifications-${index}`}
              value={product.specifications}
              onChange={(e) => onUpdate({ ...product, specifications: e.target.value })}
              placeholder="Material: Leather&#10;Sole: Rubber&#10;Weight: 350g"
              rows={4}
              className="resize-none font-mono text-sm"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <label
                  key={tag}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all border ${
                    product.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={product.tags.includes(tag)}
                    onChange={(e) => {
                      const newTags = e.target.checked
                        ? [...product.tags, tag]
                        : product.tags.filter(t => t !== tag);
                      onUpdate({ ...product, tags: newTags });
                    }}
                    className="sr-only"
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footwear Details Section (Optional) */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Footwear Details
          <span className="text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">Optional</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Additional specifications for footwear products. These help customers make informed decisions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upper Material */}
          <div className="space-y-2">
            <Label htmlFor={`upperMaterial-${index}`}>Upper Material</Label>
            <Input
              id={`upperMaterial-${index}`}
              value={product.footwearDetails?.upperMaterial || ''}
              onChange={(e) => onUpdate({
                ...product,
                footwearDetails: { ...product.footwearDetails, upperMaterial: e.target.value }
              })}
              placeholder="e.g., Genuine Leather, Mesh, Canvas"
              className="h-11"
            />
          </div>

          {/* Sole Material */}
          <div className="space-y-2">
            <Label htmlFor={`soleMaterial-${index}`}>Sole Material</Label>
            <Input
              id={`soleMaterial-${index}`}
              value={product.footwearDetails?.soleMaterial || ''}
              onChange={(e) => onUpdate({
                ...product,
                footwearDetails: { ...product.footwearDetails, soleMaterial: e.target.value }
              })}
              placeholder="e.g., Rubber, EVA, TPU"
              className="h-11"
            />
          </div>

          {/* Closure Type */}
          <div className="space-y-2">
            <Label htmlFor={`closureType-${index}`}>Closure Type</Label>
            <Select
              value={product.footwearDetails?.closureType || ''}
              onValueChange={(value) => onUpdate({
                ...product,
                footwearDetails: { ...product.footwearDetails, closureType: value }
              })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select closure type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lace-up">Lace-Up</SelectItem>
                <SelectItem value="slip-on">Slip-On</SelectItem>
                <SelectItem value="velcro">Velcro</SelectItem>
                <SelectItem value="buckle">Buckle</SelectItem>
                <SelectItem value="zipper">Zipper</SelectItem>
                <SelectItem value="elastic">Elastic</SelectItem>
                <SelectItem value="hook-loop">Hook & Loop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toe Shape */}
          <div className="space-y-2">
            <Label htmlFor={`toeShape-${index}`}>Toe Shape</Label>
            <Select
              value={product.footwearDetails?.toeShape || ''}
              onValueChange={(value) => onUpdate({
                ...product,
                footwearDetails: { ...product.footwearDetails, toeShape: value }
              })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select toe shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round">Round</SelectItem>
                <SelectItem value="pointed">Pointed</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="almond">Almond</SelectItem>
                <SelectItem value="open">Open Toe</SelectItem>
                <SelectItem value="peep">Peep Toe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Heel Height */}
          <div className="space-y-2">
            <Label htmlFor={`heelHeight-${index}`}>Heel Height (mm)</Label>
            <Input
              id={`heelHeight-${index}`}
              type="text"
              inputMode="numeric"
              value={product.footwearDetails?.heelHeightMm || ''}
              onChange={(e) => onUpdate({
                ...product,
                footwearDetails: { ...product.footwearDetails, heelHeightMm: e.target.value.replace(/[^0-9]/g, '') }
              })}
              placeholder="e.g., 25, 50, 75"
              className="h-11"
            />
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor={`weight-${index}`}>Weight per Shoe (grams)</Label>
            <Input
              id={`weight-${index}`}
              type="text"
              inputMode="numeric"
              value={product.footwearDetails?.weightGrams || ''}
              onChange={(e) => onUpdate({
                ...product,
                footwearDetails: { ...product.footwearDetails, weightGrams: e.target.value.replace(/[^0-9]/g, '') }
              })}
              placeholder="e.g., 250, 350, 450"
              className="h-11"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCopy}
          className="gap-2"
        >
          <Copy className="w-4 h-4" />
          Duplicate Product
        </Button>
        
        {canRemove && (
          <Button
            type="button"
            variant="destructive"
            onClick={onRemove}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Remove Product
          </Button>
        )}
      </div>
    </div>
  );
}

// ========================
// Main Component
// ========================

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  // ========================
  // Helper Functions
  // ========================

  // Extract media URL from various formats
  const extractMediaUrl = (mediaData) => {
    if (typeof mediaData === 'string') {
      return mediaData;
    }
    if (mediaData?.media_url) {
      return mediaData.media_url;
    }
    if (mediaData?.cloudinary_url) {
      return mediaData.cloudinary_url;
    }
    return '';
  };

  // API-fetched data states
  const [platforms, setPlatforms] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogues, setCatalogues] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Existing products in the selected catalogue
  const [existingProducts, setExistingProducts] = useState([]);
  const [isLoadingExistingProducts, setIsLoadingExistingProducts] = useState(false);

  // Catalogue data (shared across all products)
  const [catalogueData, setCatalogueData] = useState({
    article: '',
    articleId: null, // catalogue_id from the API
    isNewArticle: false,
    platformId: null,
    platformSlug: '',
    gender: 'men',
    categoryIds: [],
  });

  // Products array (each product is a color variant)
  const [products, setProducts] = useState([createEmptyProduct()]);
  const [activeProductTab, setActiveProductTab] = useState('product-0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing products when catalogue is selected (only in create mode)
  useEffect(() => {
    const fetchExistingProducts = async () => {
      // Skip in edit mode - we don't need to show other products
      if (isEditing) {
        setExistingProducts([]);
        return;
      }
      
      if (!catalogueData.articleId) {
        setExistingProducts([]);
        return;
      }
      
      setIsLoadingExistingProducts(true);
      try {
        const products = await AdminAPI.getCatalogueProducts(catalogueData.articleId);
        setExistingProducts(products || []);
        
        // Extract common tags from existing products and pre-fill for new products
        if (products && products.length > 0) {
          const allTags = products.flatMap(p => p.tags || []);
          const uniqueTags = [...new Set(allTags)];
          
          // Pre-fill tags for all current products if they don't have tags yet
          setProducts(prevProducts => 
            prevProducts.map(product => {
              // Only pre-fill if product has no tags set
              if (!product.tags || product.tags.length === 0) {
                return { ...product, tags: uniqueTags };
              }
              return product;
            })
          );
        }
      } catch (error) {
        console.error('Failed to fetch existing products:', error);
        setExistingProducts([]);
      } finally {
        setIsLoadingExistingProducts(false);
      }
    };
    
    fetchExistingProducts();
  }, [catalogueData.articleId, isEditing]);

  // Fetch platforms and brands on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingData(true);
      try {
        const [platformsData, brandsData] = await Promise.all([
          AdminAPI.getPlatforms({ isActive: true }),
          AdminAPI.getBrands({ isActive: true, limit: 500 }),
        ]);
        
        setPlatforms(platformsData || []);
        setBrands(brandsData || []);
        
        // Set default platform if available
        if (platformsData?.length > 0) {
          const defaultPlatform = platformsData[0];
          setCatalogueData(prev => ({
            ...prev,
            platformId: defaultPlatform.id,
            platformSlug: defaultPlatform.slug,
          }));
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load platforms and brands. Please refresh.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchInitialData();
  }, [toast]);

  // Pre-fill form from query parameters (when coming from Catalogues page)
  useEffect(() => {
    if (isEditing || isLoadingData || platforms.length === 0) return;
    
    const catalogueId = searchParams.get('catalogue_id');
    const catalogueName = searchParams.get('catalogue_name');
    const platformId = searchParams.get('platform_id');
    const gender = searchParams.get('gender');
    const categoryId = searchParams.get('category_id');
    
    if (catalogueId || catalogueName || platformId || gender || categoryId) {
      setCatalogueData(prev => ({
        ...prev,
        ...(catalogueId && { articleId: parseInt(catalogueId) }),
        ...(catalogueName && { article: decodeURIComponent(catalogueName), isNewArticle: false }),
        ...(platformId && { platformId: parseInt(platformId) }),
        ...(gender && { gender: gender }),
        ...(categoryId && { categoryIds: [parseInt(categoryId)] }),
      }));
      
      // Fetch the platform slug if platform_id is provided
      if (platformId) {
        const platform = platforms.find(p => p.id === parseInt(platformId));
        if (platform) {
          setCatalogueData(prev => ({ ...prev, platformSlug: platform.slug }));
        }
      }
    }
  }, [searchParams, isEditing, isLoadingData, platforms]);

  // Load product data when editing
  useEffect(() => {
    const loadProductForEdit = async () => {
      if (!isEditing || !id || isLoadingData || platforms.length === 0) return;
      
      try {
        // Fetch product from list endpoint (has more data including media)
        const productsList = await AdminAPI.getProducts({ limit: 100 });
        const product = productsList.items?.find(p => p.id === parseInt(id));
        
        if (!product) {
          // Fallback to single product endpoint
          const singleProduct = await AdminAPI.getProductById(id);
          if (!singleProduct) {
            toast({
              title: 'Error',
              description: 'Product not found',
              variant: 'destructive',
            });
            navigate('/admin/products');
            return;
          }
          // Use single product but fetch media separately
          const media = await AdminAPI.getProductMedia(id);
          singleProduct.media = media || [];
          Object.assign(product || {}, singleProduct);
        }

        console.log('Loaded product for edit:', product);
        console.log('Product category_ids:', product.category_ids);

        // Get platform from platform_slug
        const platformSlug = product.platform_slug || 'footwear';
        const platform = platforms.find(p => p.slug === platformSlug);
        
        // Fetch categories for the platform BEFORE setting categoryIds
        let categoriesForPlatform = [];
        if (platform?.id) {
          try {
            categoriesForPlatform = await AdminAPI.getCategories({
              platformId: platform.id,
              isActive: true,
            });
            console.log('Fetched categories for platform:', categoriesForPlatform);
            setCategories(categoriesForPlatform || []);
          } catch (err) {
            console.error('Failed to fetch categories:', err);
          }
        }
        
        // Fetch catalogue to get additional info
        let catalogue = null;
        if (product.catalogue_id) {
          try {
            catalogue = await AdminAPI.getCatalogueById(product.catalogue_id);
          } catch (err) {
            console.error('Failed to fetch catalogue:', err);
          }
        }

        // Set catalogue data with proper platform and category_ids
        setCatalogueData({
          article: product.catalogue_name || catalogue?.name || product.name || '',
          articleId: product.catalogue_id || null,
          isNewArticle: false,
          platformId: platform?.id || null,
          platformSlug: platformSlug,
          gender: product.gender || catalogue?.gender || 'men',
          categoryIds: product.category_ids || [],
        });

        // Build size variants from product variants
        const sizeVariants = {};
        const selectedSizes = [];
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach(variant => {
            // Get size from options or variant itself
            let size = variant.size;
            if (!size && variant.options && variant.options.length > 0) {
              const sizeOption = variant.options.find(opt => opt.option_type === 'size');
              size = sizeOption?.option_value || variant.options[0]?.option_value;
            }
            
            if (size) {
              selectedSizes.push(size);
              // Get stock from options if available
              let stock = variant.stock_quantity || 0;
              if (variant.options && variant.options.length > 0) {
                stock = variant.options[0]?.stock_quantity || stock;
              }
              sizeVariants[size] = {
                mrp: variant.mrp_override || product.mrp || 0,
                price: variant.price_override || product.price || product.mrp || 0,
                stock: stock,
                sku: variant.sku || generateSKU(product.name, product.color, size),
              };
            }
          });
        }

        // Build images from media
        const images = [];
        if (product.media && product.media.length > 0) {
          // Sort by display_order
          const sortedMedia = [...product.media].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          sortedMedia.forEach((media, index) => {
            images.push({
              id: media.id || Date.now() + index,
              mediaId: media.id, // Keep track of existing media ID
              preview: extractMediaUrl(media.media_url || media.cloudinary_url || media),
              isPrimary: media.is_primary || index === 0,
              isExisting: true, // Flag to indicate this is an existing image
              displayOrder: media.display_order || index,
            });
          });
        }

        // Parse footwear details
        const footwearDetails = product.footwear_details || {};

        // Create the product object for the form
        const editProduct = {
          id: product.id,
          color: product.color || '',
          colorHex: product.color_hex || '',
          name: product.name || '',
          slug: product.slug || '',
          sku: (() => {
            // Extract base SKU by removing last 2 segments (color-size)
            // Format: YOSTAR-HR-416-WHITE-7 -> YOSTAR-HR-416
            const fullSku = product.variants?.[0]?.sku || '';
            console.log('Full SKU from variant:', fullSku);
            
            if (!fullSku) return '';
            
            const parts = fullSku.split('-');
            console.log('SKU parts:', parts);
            console.log('Parts length:', parts.length);
            
            // Always remove last 2 parts (color and size)
            if (parts.length > 2) {
              const baseSku = parts.slice(0, -2).join('-');
              console.log('Extracted base SKU:', baseSku);
              return baseSku;
            }
            
            console.log('SKU too short, returning as-is:', fullSku);
            return fullSku;
          })(),
          brandId: product.brand_id || product.brand?.id || null,
          brandName: product.brand?.name || product.brand_name || '',
          selectedSizes,
          sizeVariants,
          description: product.long_description || product.short_description || '',
          shortDescription: product.short_description || '',
          longDescription: product.long_description || '',
          specifications: product.specifications || '', // Load from separate specifications field
          tags: (() => {
            // Normalize tags from backend (lowercase-with-dashes) to display format (Title Case)
            const backendTags = Array.isArray(product.tags) 
              ? product.tags 
              : (product.tags ? product.tags.split(',').map(t => t.trim()) : []);
            
            // Convert backend tags to match TAG_OPTIONS format
            return backendTags.map(tag => {
              // Find matching tag in TAG_OPTIONS (case-insensitive, dash-insensitive)
              const matchingTag = TAG_OPTIONS.find(opt => 
                opt.toLowerCase().replace(/[\s-]+/g, '') === tag.toLowerCase().replace(/[\s-]+/g, '')
              );
              return matchingTag || tag;
            });
          })(),
          images,
          footwearDetails: {
            upperMaterial: footwearDetails.upper_material || '',
            soleMaterial: footwearDetails.sole_material || '',
            closureType: footwearDetails.closure_type || '',
            toeShape: footwearDetails.toe_shape || '',
            heelHeightMm: footwearDetails.heel_height_mm?.toString() || '',
            weightGrams: footwearDetails.weight_grams?.toString() || '',
            sizeChartType: footwearDetails.size_chart_type || '',
          },
        };

        setProducts([editProduct]);
        setActiveProductTab('product-0');

        // Populate catalogue data with category_ids
        setCatalogueData({
          article: product.catalogue_name || '',
          articleId: product.catalogue_id || null,
          gender: product.gender || 'unisex',
          platformId: null, // Will be set when platforms load
          categoryIds: product.category_ids || [],
        });

        toast({
          title: 'Product Loaded',
          description: `Editing "${product.name}"`,
        });
      } catch (error) {
        console.error('Error loading product for edit:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load product data',
          variant: 'destructive',
        });
      }
    };

    loadProductForEdit();
  }, [isEditing, id, isLoadingData, platforms, toast, navigate]);

  // Fetch categories when platform changes
  useEffect(() => {
    const fetchCategories = async () => {
      if (!catalogueData.platformId) {
        setCategories([]);
        return;
      }
      
      try {
        const categoriesData = await AdminAPI.getCategories({
          platformId: catalogueData.platformId,
          isActive: true,
        });
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, [catalogueData.platformId]);

  // Fetch catalogues based on gender and category
  useEffect(() => {
    const fetchCatalogues = async () => {
      if (!catalogueData.gender) {
        setCatalogues([]);
        return;
      }

      try {
        const cataloguesData = await AdminAPI.getCatalogues({
          gender: catalogueData.gender,
          isActive: true,
        });
        setCatalogues(cataloguesData || []);
      } catch (error) {
        console.error('Error fetching catalogues:', error);
        setCatalogues([]);
      }
    };

    fetchCatalogues();
  }, [catalogueData.gender]);

  function createEmptyProduct() {
    return {
      id: Date.now() + Math.random(),
      color: '',
      colorHex: '',
      name: '',
      slug: '',
      sku: '',
      brandId: null,
      brandName: '',
      selectedSizes: [],
      sizeVariants: {},
      shortDescription: '',
      longDescription: '',
      specifications: '',
      tags: [],
      images: [],
      // Footwear-specific details (optional)
      footwearDetails: {
        upperMaterial: '',
        soleMaterial: '',
        closureType: '',
        toeShape: '',
        heelHeightMm: '',
        weightGrams: '',
        sizeChartType: '',
      },
    };
  }

  const handleCatalogueChange = (field, value) => {
    if (field === 'platformId') {
      // When platform changes, find the platform data and clear categories
      const platform = platforms.find(p => p.id === value);
      setCatalogueData(prev => ({
        ...prev,
        platformId: value,
        platformSlug: platform?.slug || '',
        categoryIds: [],
        articleId: null,
        article: '',
      }));
    } else if (field === 'gender') {
      // When gender changes, reset article/catalogue selection
      setCatalogueData(prev => ({
        ...prev,
        gender: value,
        articleId: null,
        article: '',
      }));
    } else if (field === 'articleId') {
      // When selecting an existing catalogue, load its category
      const catalogue = catalogues.find(c => c.id === value);
      if (catalogue) {
        setCatalogueData(prev => ({
          ...prev,
          articleId: value,
          article: catalogue.name || '',
          // Pre-fill the category from the selected catalogue
          categoryIds: catalogue.category_id ? [catalogue.category_id] : prev.categoryIds,
        }));
      } else {
        setCatalogueData(prev => ({
          ...prev,
          articleId: value,
          article: '',
        }));
      }
    } else {
      setCatalogueData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCategoryToggle = (categoryId, checked) => {
    const newCategoryIds = checked
      ? [...catalogueData.categoryIds, categoryId]
      : catalogueData.categoryIds.filter(c => c !== categoryId);
    setCatalogueData(prev => ({ ...prev, categoryIds: newCategoryIds }));
  };

  // Create a new brand via API and update the brands list
  const handleCreateBrand = useCallback(async (brandName) => {
    try {
      const newBrand = await AdminAPI.createBrand({
        name: brandName,
        is_active: true,
      });
      // Add the new brand to the brands list
      setBrands(prev => [...prev, newBrand]);
      toast({
        title: 'Brand Created',
        description: `"${brandName}" has been added.`,
      });
      return newBrand;
    } catch (error) {
      console.error('Failed to create brand:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create brand',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const handleProductUpdate = (index, updatedProduct) => {
    const newProducts = [...products];
    newProducts[index] = updatedProduct;
    setProducts(newProducts);
  };

  const handleAddProduct = () => {
    setProducts([...products, createEmptyProduct()]);
    setActiveProductTab(`product-${products.length}`);
  };

  const handleRemoveProduct = (index) => {
    if (products.length <= 1) return;
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
    setActiveProductTab('product-0');
  };

  const handleCopyProduct = (index) => {
    const productToCopy = products[index];
    const copiedProduct = {
      ...JSON.parse(JSON.stringify(productToCopy)),
      id: Date.now() + Math.random(),
      color: '',
      name: productToCopy.name + ' (Copy)',
      slug: productToCopy.slug + '-copy',
      sku: productToCopy.sku + '-2',
      images: [],
    };
    setProducts([...products, copiedProduct]);
    setActiveProductTab(`product-${products.length}`);
  };

  const handleImageChange = (productIndex, images) => {
    const newProducts = [...products];
    newProducts[productIndex].images = images;
    setProducts(newProducts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!catalogueData.articleId && !catalogueData.article) {
        throw new Error('Please select or enter a catalogue/article name');
      }
      if (!catalogueData.gender) {
        throw new Error('Please select a gender');
      }
      if (!catalogueData.platformId) {
        throw new Error('Please select a platform');
      }
      if (catalogueData.categoryIds.length === 0) {
        throw new Error('Please select at least one category');
      }

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (!p.color) throw new Error(`Product ${i + 1}: Please select a color`);
        if (!p.name) throw new Error(`Product ${i + 1}: Please enter a product name`);
        if (!p.sku) throw new Error(`Product ${i + 1}: Please enter a base SKU`);
        if (!p.brandId) throw new Error(`Product ${i + 1}: Please select a brand`);
        if (p.selectedSizes.length === 0) {
          throw new Error(`Product ${i + 1}: Please select at least one size`);
        }
        for (const size of p.selectedSizes) {
          if (!p.sizeVariants[size]?.price) {
            throw new Error(`Product ${i + 1}: Please enter price for size ${size}`);
          }
        }
      }

      // EDIT MODE: Update existing product
      if (isEditing && id) {
        const product = products[0]; // In edit mode, we have only one product
        
        // Get base price from first variant
        const firstSize = product.selectedSizes[0];
        const sellingPrice = parseInt(product.sizeVariants[firstSize]?.price || 0);
        const mrpPrice = parseInt(product.sizeVariants[firstSize]?.mrp || 0);
        
        const mrpValue = mrpPrice > 0 ? mrpPrice : sellingPrice;
        const priceValue = (mrpPrice > 0 && sellingPrice < mrpPrice) ? sellingPrice : null;

        // Build update payload
        const updatePayload = {
          name: product.name,
          slug: product.slug || null,
          brand_id: product.brandId ? parseInt(product.brandId) : null,
          category_ids: catalogueData.categoryIds.map(id => parseInt(id)),  // Multiple categories
          color: product.color || null,
          color_hex: product.colorHex || null,
          mrp: mrpValue,
          price: priceValue,
          short_description: product.shortDescription || null,
          long_description: product.longDescription || null,
          specifications: product.specifications || null,
          tags: product.tags.map(t => t.toLowerCase().replace(/\s+/g, '-')),
        };

        // Add footwear details if present
        if (product.footwearDetails) {
          const fd = product.footwearDetails;
          if (fd.upperMaterial || fd.soleMaterial || fd.closureType) {
            updatePayload.footwear_details = {
              upper_material: fd.upperMaterial || null,
              sole_material: fd.soleMaterial || null,
              closure_type: fd.closureType || null,
              toe_shape: fd.toeShape || null,
              heel_height_mm: fd.heelHeightMm ? parseInt(fd.heelHeightMm) : null,
              weight_grams: fd.weightGrams ? parseInt(fd.weightGrams) : null,
              size_chart_type: fd.sizeChartType || null,
            };
          }
        }

        console.log('Updating product:', updatePayload);
        await AdminAPI.updateProduct(parseInt(id), updatePayload);

        // Handle image updates
        const existingImages = product.images.filter(img => img.isExisting);
        const newImages = product.images.filter(img => !img.isExisting);

        // Get current media to compare what needs to be deleted
        const currentMedia = await AdminAPI.getProductMedia(parseInt(id));
        
        // Find images that were removed (exist in currentMedia but not in existingImages)
        const existingMediaIds = existingImages.map(img => img.mediaId).filter(Boolean);
        const mediaToDelete = currentMedia?.filter(m => !existingMediaIds.includes(m.id)) || [];

        // Delete removed images
        for (const media of mediaToDelete) {
          try {
            await AdminAPI.deleteMedia(media.id);
            console.log(`Deleted media ${media.id}`);
          } catch (err) {
            console.error(`Failed to delete media ${media.id}:`, err);
          }
        }

        // Update display order and primary status for existing images
        for (let i = 0; i < existingImages.length; i++) {
          const img = existingImages[i];
          if (img.mediaId) {
            try {
              await AdminAPI.updateMedia(img.mediaId, {
                display_order: i,
                is_primary: img.isPrimary || i === 0,
              });
            } catch (err) {
              console.error(`Failed to update media ${img.mediaId}:`, err);
            }
          }
        }

        // Upload new images
        if (newImages.length > 0) {
          // Get first variant ID for upload
          const productData = await AdminAPI.getProductById(parseInt(id));
          const firstVariantId = productData.variants?.[0]?.id;

          if (firstVariantId) {
            const startOrder = existingImages.length;
            for (let i = 0; i < newImages.length; i++) {
              const image = newImages[i];
              try {
                await AdminAPI.uploadProductMedia(
                  parseInt(id),
                  firstVariantId,
                  image.file,
                  {
                    usageType: 'catalogue',
                    platform: 'website',
                    displayOrder: startOrder + i,
                    isPrimary: image.isPrimary && existingImages.length === 0,
                  }
                );
              } catch (uploadError) {
                console.error(`Failed to upload new image:`, uploadError);
                toast({
                  title: 'Warning',
                  description: `Failed to upload image "${image.fileName || `Image ${i + 1}`}"`,
                  variant: 'destructive',
                });
              }
            }
          }
        }

        toast({
          title: 'Success!',
          description: 'Product updated successfully',
        });

        navigate('/admin/products');
        return;
      }

      // CREATE MODE: Original create logic
      let catalogueId = catalogueData.articleId;
      let newCatalogueId = null; // Track if we create a new catalogue for rollback

      // Create catalogue if new
      if (!catalogueId && catalogueData.article) {
        const categoryId = catalogueData.categoryIds[0]; // Use first category
        const newCatalogue = await AdminAPI.createCatalogue({
          name: catalogueData.article,
          category_id: parseInt(categoryId),
          gender: catalogueData.gender || 'unisex',
          is_active: true,
        });
        catalogueId = newCatalogue.id;
        newCatalogueId = newCatalogue.id; // Track the newly created catalogue
      }

      if (!catalogueId) {
        throw new Error('Failed to get or create catalogue');
      }

      // Create products
      const createdProducts = [];
      try {
        for (const product of products) {
          // Get base price from first variant (prices stored in rupees)
          const firstSize = product.selectedSizes[0];
          const sellingPrice = parseInt(product.sizeVariants[firstSize]?.price || 0);
          const mrpPrice = parseInt(product.sizeVariants[firstSize]?.mrp || 0);
          
          // mrp = the main price (MRP)
          // price = discounted selling price (only if selling price < MRP)
          const mrpValue = mrpPrice > 0 ? mrpPrice : sellingPrice;
          const priceValue = (mrpPrice > 0 && sellingPrice < mrpPrice) ? sellingPrice : null;

          // Build variants array
          const variants = product.selectedSizes.map(size => {
            const variant = product.sizeVariants[size];
            // Generate proper SKU - ensure no empty parts or special chars
            const baseSku = product.sku || generateSKU(catalogueData.article, product.color, '');
            // Format color for SKU: "White/Grey" -> "WHITE-GREY"
            const colorPart = product.color?.replace(/[^a-zA-Z0-9]/g, '-')?.replace(/-+/g, '-')?.replace(/^-|-$/g, '')?.toUpperCase() || '';
            const variantSku = variant.skuId || (colorPart ? `${baseSku}-${colorPart}-${String(size).toUpperCase()}` : `${baseSku}-${String(size).toUpperCase()}`);
            return {
              size: size,
              sku: variantSku.replace(/[^A-Z0-9-]/gi, '').toUpperCase(),
              stock_quantity: parseInt(variant.inventory || 0),
              price_override: parseInt(variant.price || 0),
              mrp_override: parseInt(variant.mrp || 0),
              is_active: true,
            };
          });

          // Build product payload
          const productPayload = {
            name: product.name,
            slug: product.slug || null,  // Include the custom slug if provided
            catalogue_id: parseInt(catalogueId),
            brand_id: product.brandId ? parseInt(product.brandId) : null,
            category_ids: catalogueData.categoryIds.map(id => parseInt(id)),  // Multiple categories
            color: product.color || null,
            color_hex: product.colorHex || null,
            mrp: mrpValue,
            price: priceValue,
            short_description: product.shortDescription || null,
            long_description: product.longDescription || null,
            specifications: product.specifications || null,
            is_featured: false,
            tags: product.tags.map(t => t.toLowerCase().replace(/\s+/g, '-')),
            status: 'draft',
            is_active: true,
            variants: variants,
          };

          // Add footwear details if present
          if (product.footwearDetails) {
            const fd = product.footwearDetails;
            if (fd.upperMaterial || fd.soleMaterial || fd.closureType) {
              productPayload.footwear_details = {
                upper_material: fd.upperMaterial || null,
                sole_material: fd.soleMaterial || null,
                closure_type: fd.closureType || null,
                toe_shape: fd.toeShape || null,
                heel_height_mm: fd.heelHeightMm ? parseInt(fd.heelHeightMm) : null,
                weight_grams: fd.weightGrams ? parseInt(fd.weightGrams) : null,
                size_chart_type: fd.sizeChartType || null,
              };
            }
          }

          console.log('Creating product:', productPayload);
          const createdProduct = await AdminAPI.createProduct(productPayload);

          // Upload images ONLY if provided - if any upload fails, rollback entire product
          if (product.images && product.images.length > 0) {
            const firstVariantId = createdProduct.variants?.[0]?.id;
            
            if (!firstVariantId) {
              // No variant created - rollback product
              console.error('No variant ID available for image upload, rolling back...');
              await AdminAPI.deleteProduct(createdProduct.id);
              throw new Error('Product creation failed: No variant was created for image upload.');
            }

            // Upload each image - if ANY fails, rollback everything
            for (let i = 0; i < product.images.length; i++) {
              const image = product.images[i];
              try {
                await AdminAPI.uploadProductMedia(
                  createdProduct.id,
                  firstVariantId,
                  image.file,
                  {
                    usageType: 'catalogue',
                    platform: 'website',
                    displayOrder: i,
                    isPrimary: image.isPrimary || i === 0,
                  }
                );
              } catch (uploadError) {
                // Image upload failed - rollback by deleting the product
                console.error(`Failed to upload image ${i + 1}:`, uploadError);
                try {
                  await AdminAPI.deleteProduct(createdProduct.id);
                } catch (deleteError) {
                  console.error('Failed to rollback product:', deleteError);
                }
                throw new Error(
                  `Failed to upload image "${image.fileName || `Image ${i + 1}`}". ` +
                  `Product creation rolled back. Error: ${uploadError.message}`
                );
              }
            }
            
            console.log(`Successfully uploaded all ${product.images.length} images for product ${createdProduct.id}`);
          }
          // If no images provided, product is created successfully without images
          // User can upload images later by editing the product

          createdProducts.push(createdProduct);
        }
      } catch (productCreationError) {
        // If we created a new catalogue and ANY product creation failed, delete the catalogue
        // This cascade deletes all products created so far
        if (newCatalogueId) {
          console.error('Product creation failed, rolling back newly created catalogue...');
          try {
            await AdminAPI.deleteCatalogue(newCatalogueId);
            console.log('Successfully rolled back catalogue and all products');
          } catch (catalogueDeleteError) {
            console.error('Failed to rollback catalogue:', catalogueDeleteError);
          }
        }
        // Re-throw the original error
        throw productCreationError;
      }

      toast({
        title: 'Success!',
        description: `${createdProducts.length} product(s) created successfully`,
      });

      navigate('/admin/products');
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save products',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if viewing an existing or new product tab
  const isExistingProductTab = activeProductTab.startsWith('existing-');
  const activeProductIndex = isExistingProductTab 
    ? null 
    : parseInt(activeProductTab.split('-')[1]) || 0;
  const activeProduct = isExistingProductTab 
    ? null 
    : products[activeProductIndex];

  return (
    <div className="min-h-screen bg-background">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin/products')}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {isEditing ? 'Edit Product' : 'Add New Product'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Create products under a catalogue/article
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/products')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isEditing ? 'Update Product' : 'Save Products'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-3 space-y-8">
              {/* Catalogue/Article Section */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Catalogue / Article
                </h2>

                <div className="space-y-6">
                  {/* First Row: Platform, Gender, Article */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Platform */}
                    <div className="space-y-2">
                      <Label>Platform *</Label>
                      <Select
                        value={catalogueData.platformId?.toString() || ''}
                        onValueChange={(value) => handleCatalogueChange('platformId', parseInt(value))}
                        disabled={isLoadingData || isEditing}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={isLoadingData ? 'Loading...' : 'Select platform'} />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id.toString()}>
                              {platform.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label>Gender / Segment *</Label>
                      <Select
                        value={catalogueData.gender}
                        onValueChange={(value) => handleCatalogueChange('gender', value)}
                        disabled={isEditing}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Article Selection or Creation */}
                    <div className="space-y-2">
                      <Label>Article / Catalogue *</Label>
                      <Select
                        value={catalogueData.articleId?.toString() || 'new'}
                        onValueChange={(value) => {
                          if (value === 'new') {
                            setCatalogueData(prev => ({ ...prev, articleId: null, article: '' }));
                          } else {
                            handleCatalogueChange('articleId', parseInt(value));
                          }
                        }}
                        disabled={isEditing}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select or create new" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">+ Create New Catalogue</SelectItem>
                          {catalogues.map((catalogue) => (
                            <SelectItem key={catalogue.id} value={catalogue.id.toString()}>
                              {catalogue.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!catalogueData.articleId && !isEditing && (
                        <Input
                          value={catalogueData.article}
                          onChange={(e) => handleCatalogueChange('article', e.target.value)}
                          placeholder="Enter new catalogue name..."
                          className="h-11 mt-2"
                        />
                      )}
                    </div>
                  </div>

                  {/* Categories (Dropdown with checkboxes - from API) */}
                  <div className="space-y-3">
                    <Label>Categories * (Select multiple)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-auto min-h-[42px] py-2"
                          disabled={!catalogueData.platformId}
                        >
                          <span className="flex flex-wrap gap-1 text-left">
                            {catalogueData.categoryIds.length === 0 ? (
                              <span className="text-muted-foreground">
                                {catalogueData.platformId ? 'Select categories...' : 'Select platform first'}
                              </span>
                            ) : categories.length === 0 ? (
                              <span className="text-muted-foreground">
                                Loading categories...
                              </span>
                            ) : (
                              catalogueData.categoryIds.map(catId => {
                                const cat = categories.find(c => c.id === catId);
                                return (
                                  <span 
                                    key={catId}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-sm"
                                  >
                                    {cat?.name || `Category ID: ${catId}`}
                                  </span>
                                );
                              })
                            )}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <div className="p-2 border-b border-border">
                          <p className="text-sm font-medium text-foreground">
                            Select categories for {platforms.find(p => p.id === catalogueData.platformId)?.name || 'platform'}
                          </p>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-2">
                          {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No categories found</p>
                          ) : (
                            categories.map((cat) => (
                              <label
                                key={cat.id}
                                className="flex items-center gap-3 px-2 py-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                              >
                                <Checkbox
                                  checked={catalogueData.categoryIds.includes(cat.id)}
                                  onCheckedChange={(checked) => handleCategoryToggle(cat.id, checked)}
                                />
                                <span className="text-sm">{cat.name}</span>
                              </label>
                            ))
                          )}
                        </div>
                        {catalogueData.categoryIds.length > 0 && (
                          <div className="p-2 border-t border-border flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              {catalogueData.categoryIds.length} selected
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCatalogueData(prev => ({ ...prev, categoryIds: [] }))}
                              className="h-7 text-xs"
                            >
                              Clear all
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Products Tabs - Shows existing products + new products */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Tabs value={activeProductTab} onValueChange={setActiveProductTab}>
                  <div className="border-b border-border bg-muted/30 px-4 overflow-x-auto">
                    <TabsList className="h-14 bg-transparent gap-1">
                      {/* Existing Products Tabs */}
                      {existingProducts.map((product, index) => (
                        <TabsTrigger
                          key={`existing-${product.id}`}
                          value={`existing-${index}`}
                          className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 gap-2 border-l-2 border-l-green-500"
                        >
                          <div className="flex items-center gap-2">
                            {product.color_hex ? (
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: product.color_hex.split(',')[0] }}
                              />
                            ) : product.color ? (
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === product.color)?.hex || '#ccc' }}
                              />
                            ) : (
                              <Palette className="w-3 h-3" />
                            )}
                            <span className="max-w-[120px] truncate">{product.color || product.name}</span>
                            <Check className="w-3 h-3 text-green-500" title="Saved" />
                          </div>
                        </TabsTrigger>
                      ))}
                      
                      {/* Separator if both existing and new products */}
                      {existingProducts.length > 0 && products.length > 0 && (
                        <div className="h-8 w-px bg-border mx-2 self-center" />
                      )}
                      
                      {/* New Products Tabs */}
                      {products.map((product, index) => (
                        <TabsTrigger
                          key={product.id}
                          value={`product-${index}`}
                          className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 gap-2 border-l-2 border-l-orange-400"
                        >
                          {product.color ? (
                            <div 
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === product.color)?.hex }}
                            />
                          ) : (
                            <Palette className="w-3 h-3" />
                          )}
                          {product.color || `New ${index + 1}`}
                          <span className="text-[10px] text-orange-500 font-medium">NEW</span>
                        </TabsTrigger>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddProduct}
                        className="h-9 px-3 gap-1 text-primary hover:text-primary"
                      >
                        <Plus className="w-4 h-4" />
                        Add Product
                      </Button>
                      {isLoadingExistingProducts && (
                        <div className="flex items-center px-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </TabsList>
                  </div>

                  {/* Existing Products Tab Content */}
                  {existingProducts.map((existingProduct, index) => (
                    <TabsContent key={`existing-${existingProduct.id}`} value={`existing-${index}`} className="m-0">
                      <div className="p-6 space-y-6">
                        {/* Existing Product Header */}
                        <div className="flex items-start justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="flex items-start gap-4">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                              {existingProduct.variants?.[0]?.media?.[0]?.cloudinary_url ? (
                                <img 
                                  src={existingProduct.variants[0].media[0].cloudinary_url} 
                                  alt={existingProduct.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                  Existing Product (Saved)
                                </span>
                              </div>
                              <h4 className="text-lg font-semibold">{existingProduct.name}</h4>
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  Slug: <code className="bg-muted px-1 rounded">{existingProduct.slug}</code>
                                </span>
                                {existingProduct.color && (
                                  <span className="flex items-center gap-1">
                                    <Palette className="w-3 h-3" />
                                    Color: {existingProduct.color}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <ShoppingBag className="w-3 h-3" />
                                  {existingProduct.variants?.length || 0} size(s)
                                </span>
                                <span>
                                  ₹{existingProduct.mrp?.toLocaleString('en-IN')}
                                  {existingProduct.price && existingProduct.price < existingProduct.mrp && (
                                    <span className="text-green-600 ml-1">
                                      Sale: ₹{existingProduct.price?.toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </span>
                              </div>
                              
                              {/* Sizes */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {existingProduct.variants?.map(v => (
                                  <span 
                                    key={v.id} 
                                    className="px-2 py-0.5 bg-muted rounded text-xs font-medium"
                                  >
                                    {v.size || v.variant_name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Copy existing product data to a new product
                                const newProduct = {
                                  ...createEmptyProduct(),
                                  name: `${existingProduct.name} - Copy`,
                                  brandId: existingProduct.brand_id,
                                  description: existingProduct.long_description || existingProduct.short_description || '',
                                  selectedSizes: existingProduct.variants?.map(v => v.size || v.variant_name) || [],
                                  tags: existingProduct.tags || [],
                                  footwearDetails: existingProduct.footwear_details || {},
                                };
                                // Pre-fill size variants
                                existingProduct.variants?.forEach(v => {
                                  newProduct.sizeVariants[v.size || v.variant_name] = {
                                    price: v.price_override || existingProduct.price || existingProduct.mrp || 0,
                                    mrp: v.mrp_override || existingProduct.mrp || 0,
                                    inventory: v.stock_quantity || 0,
                                    skuId: '',
                                  };
                                });
                                setProducts(prev => [...prev, newProduct]);
                                setActiveProductTab(`product-${products.length}`);
                                toast({
                                  title: 'Product Copied',
                                  description: 'Product info copied to new tab. Update the color and save.',
                                });
                              }}
                              className="gap-1"
                            >
                              <Copy className="w-4 h-4" />
                              Copy to New
                            </Button>
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => navigate(`/admin/products/${existingProduct.id}/edit`)}
                              className="gap-1"
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}

                  {/* New Products Tab Content */}
                  <div className="p-6">
                    {products.map((product, index) => (
                      <TabsContent 
                        key={product.id} 
                        value={`product-${index}`}
                        className="mt-0"
                      >
                        <ProductTab
                          product={product}
                          index={index}
                          catalogueData={catalogueData}
                          brands={brands}
                          onUpdate={(updated) => handleProductUpdate(index, updated)}
                          onRemove={() => handleRemoveProduct(index)}
                          onCopy={() => handleCopyProduct(index)}
                          onCreateBrand={handleCreateBrand}
                          canRemove={products.length > 1}
                        />
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              </div>
            </div>

            {/* Right Column - Images & Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Show different content based on whether existing or new product is selected */}
                {isExistingProductTab ? (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center gap-2 text-green-600 mb-4">
                      <Check className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Existing Product Selected</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This product is already saved. Use the <strong>Edit</strong> button to modify it, 
                      or <strong>Copy to New</strong> to create a similar product with a different color.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Image Upload */}
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <ImagePlus className="w-5 h-5 text-primary" />
                        Product Images
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        For: <strong>{activeProduct?.color || 'Select Color'}</strong>
                      </p>
                      <ImageUploader
                        images={activeProduct?.images || []}
                        onImagesChange={(images) => handleImageChange(activeProductIndex, images)}
                        maxImages={6}
                      />
                    </div>

                    {/* Product Preview Card */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground px-1">Product Preview</h3>
                      <ProductPreviewCard 
                        product={activeProduct}
                        catalogueData={catalogueData}
                      />
                    </div>
                  </>
                )}

                {/* Quick Summary */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Article</span>
                      <span className="font-medium truncate ml-2">{catalogueData.article || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform</span>
                      <span className="font-medium capitalize">
                        {platforms.find(p => p.id === catalogueData.platformId)?.name || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Segment</span>
                      <span className="font-medium capitalize">{catalogueData.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categories</span>
                      <span className="font-medium">{catalogueData.categoryIds.length}</span>
                    </div>
                    {existingProducts.length > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Existing Products</span>
                        <span className="font-medium">{existingProducts.length}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-orange-500">
                      <span>New Products</span>
                      <span className="font-medium">{products.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New Variants</span>
                      <span className="font-medium">
                        {products.reduce((sum, p) => sum + p.selectedSizes.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
