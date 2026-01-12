import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Truck, RotateCcw, Shield, Star, ChevronLeft, ChevronRight, Minus, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProductDetail, useProducts } from '@/hooks/useProducts';
import { convertSize } from '@/utils/sizeConversion';
import { extractMediaUrl, getImageProps } from '@/utils/imageUtils';

// Category accent colors
const categoryAccents = {
  men: {
    primary: '#0F172A',
    light: 'rgba(15, 23, 42, 0.1)',
    gradient: 'from-[#0F172A]/5 to-transparent',
  },
  women: {
    primary: '#E8B4B8',
    light: 'rgba(232, 180, 184, 0.2)',
    gradient: 'from-[#E8B4B8]/10 to-transparent',
  },
  kids: {
    primary: '#D97706',
    light: 'rgba(217, 119, 6, 0.1)',
    gradient: 'from-[#D97706]/5 to-transparent',
  },
};

// Color swatch mapping
const colorSwatchMap = {
  'Black/White': { bg: '#1C1C1C', border: '#374151' },
  'Pure White': { bg: '#FFFFFF', border: '#E5E7EB' },
  'University Red': { bg: '#DC2626', border: '#DC2626' },
  'Black': { bg: '#1C1C1C', border: '#374151' },
  'White': { bg: '#FFFFFF', border: '#E5E7EB' },
  'Navy': { bg: '#1E3A5F', border: '#1E3A5F' },
  'Brown': { bg: '#8B4513', border: '#8B4513' },
  'Grey': { bg: '#6B7280', border: '#6B7280' },
  'Pink': { bg: '#EC4899', border: '#EC4899' },
  'Blue': { bg: '#3B82F6', border: '#3B82F6' },
  'Green': { bg: '#22C55E', border: '#22C55E' },
  'Red': { bg: '#EF4444', border: '#EF4444' },
  'SkyBlue': { bg: '#87CEEB', border: '#87CEEB' },
  'White/SkyBlue': { bg: '#87CEEB', border: '#87CEEB' },
  'White/Grey': { bg: '#6B7280', border: '#6B7280' },
  'White/Blue': { bg: '#3B82F6', border: '#3B82F6' },
  'White/Red': { bg: '#EF4444', border: '#EF4444' },
  'White/Black': { bg: '#1C1C1C', border: '#374151' },
};

// Mock data
const mockProduct = {
  id: 1,
  name: 'Air Max 90',
  brand: 'Nike',
  category: 'men', // men, women, or kids
  price: 12995,
  originalPrice: 14999,
  description: 'The Nike Air Max 90 stays true to its OG running roots with the iconic Waffle sole, stitched overlays and classic TPU details. Fresh colors give a modern look while Max Air cushioning adds comfort to your journey.',
  images: [
    'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',
  ],
  sizes: [
    { uk: 6, eu: 40, us: 7, inStock: true },
    { uk: 7, eu: 41, us: 8, inStock: true },
    { uk: 8, eu: 42, us: 9, inStock: true },
    { uk: 9, eu: 43, us: 10, inStock: false },
    { uk: 10, eu: 44, us: 11, inStock: true },
    { uk: 11, eu: 45, us: 12, inStock: true },
  ],
  colors: ['Black/White', 'Pure White', 'University Red'],
  rating: 4.5,
  reviews: 128,
  features: [
    'Max Air unit in the heel for cushioning',
    'Rubber Waffle outsole for traction',
    'Foam midsole for lightweight comfort',
    'Leather and synthetic upper for durability',
  ],
  specifications: {
    'Upper Material': 'Leather & Synthetic',
    'Sole Material': 'Rubber',
    'Closure': 'Lace-up',
    'Warranty': '6 months',
  },
};

const relatedProducts = [
  { id: 2, name: 'Ultraboost 22', brand: 'Adidas', price: 15999, image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80', rating: 4.8, reviews: 256 },
  { id: 3, name: 'RS-X', brand: 'Puma', price: 8999, originalPrice: 10999, image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80', rating: 4.3, reviews: 89 },
  { id: 4, name: 'Classic Leather', brand: 'Reebok', price: 7499, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80', rating: 4.6, reviews: 167 },
  { id: 5, name: 'Campus Classic', brand: 'Campus', price: 2999, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80', rating: 4.2, reviews: 342 },
];

const reviews = [
  { id: 1, name: 'Rahul S.', rating: 5, date: '2024-01-15', comment: 'Amazing shoes! Super comfortable and stylish. Worth every penny.', verified: true },
  { id: 2, name: 'Priya M.', rating: 4, date: '2024-01-10', comment: 'Good quality and fast delivery. Slightly narrow fit.', verified: true },
  { id: 3, name: 'Amit K.', rating: 5, date: '2024-01-05', comment: 'Best purchase of the year. True to size.', verified: true },
];

export default function Product() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem, getRemainingStock, canAddToCart } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  // Fetch product from API with color options
  const { product: apiProduct, colorOptions, loading, error } = useProductDetail(id);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeSystem, setSizeSystem] = useState('ind');
  const [isZoomed, setIsZoomed] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Use API product or fallback to mock
  const product = apiProduct || mockProduct;
  
  // Set initial color when product loads (use product.color if available)
  useEffect(() => {
    if (product.color) {
      // Product has a specific color (from catalogue-based structure)
      setSelectedColor(product.color);
    } else if (product.colors?.length > 0 && !selectedColor) {
      // Fallback for legacy products with colors array
      setSelectedColor(product.colors[0]);
    }
  }, [product.color, product.colors, selectedColor]);
  
  // Detect category from product or route
  const category = useMemo(() => {
    if (product.category || product.gender) return product.category || product.gender;
    const path = location.pathname.toLowerCase();
    if (path.includes('women')) return 'women';
    if (path.includes('kids')) return 'kids';
    return 'men'; // default
  }, [product.category, product.gender, location.pathname]);
  
  const accent = categoryAccents[category] || categoryAccents.men;
  
  const inWishlist = isInWishlist(product.id);
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  
  // Fetch related products
  const { products: relatedProducts } = useProducts({ 
    gender: category,
    perPage: 4,
    enabled: !loading 
  });

  // Calculate remaining stock for selected variant
  const remainingStock = useMemo(() => {
    if (!selectedSize) return 0;
    return getRemainingStock(product.id, selectedSize.uk, selectedColor);
  }, [product.id, selectedSize, selectedColor, getRemainingStock]);

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSize, selectedColor]);

  // Ensure quantity doesn't exceed remaining stock
  const maxQuantity = Math.max(1, remainingStock);
  
  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[#C9A24D] animate-spin" />
        </div>
      </Layout>
    );
  }
  
  // Error state
  if (error && !apiProduct) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-xl text-muted-foreground">Product not found</p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (remainingStock <= 0) {
      toast.error('This item is out of stock');
      return;
    }

    if (quantity > remainingStock) {
      toast.error(`Only ${remainingStock} available in stock`);
      return;
    }

    const success = addItem({
      ...product,
      selectedSize,
      selectedColor,
      quantity,
    });
    
    if (success) {
      setAddedToCart(true);
      toast.success('Added to cart!');
      setTimeout(() => setAddedToCart(false), 1500);
    }
  };

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % product.images.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/men" className="hover:text-foreground transition-colors">Men</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery - Desktop: Thumbnails on left, main image on right */}
          <div className="flex flex-col lg:flex-row-reverse gap-4">
            {/* Main Image */}
            <div className={cn(
              "relative flex-1 aspect-[4/5] lg:aspect-[4/5] max-h-[500px] lg:max-h-[600px] rounded-2xl overflow-hidden bg-gradient-to-br",
              accent.gradient,
              "bg-[#F9FAFB] dark:bg-[#1F2937]"
            )}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={product.images?.[selectedImage] || '/placeholder.jpg'}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={cn(
                    "w-full h-full object-cover cursor-zoom-in transition-transform duration-300",
                    isZoomed && "scale-150"
                  )}
                  onClick={() => setIsZoomed(!isZoomed)}
                />
              </AnimatePresence>
              
              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-background transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-background transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Discount Badge */}
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Thumbnails - Horizontal on mobile, Vertical on desktop */}
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto pb-2 lg:pb-0 lg:max-h-[600px]">
              {(product.images || []).map((img, i) => (
                <motion.button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200",
                    selectedImage === i 
                      ? "border-[#C9A24D] opacity-100" 
                      : "border-transparent opacity-60 hover:opacity-100 hover:border-[#E5E7EB] dark:hover:border-[#374151]"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-3 lg:space-y-5">
            <div>
              <Link 
                to={`/brands/${(typeof product.brand === 'string' ? product.brand : product.brand?.name || 'brand').toLowerCase()}`} 
                className="text-xs uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF] font-medium hover:text-[#C9A24D] transition-colors font-['Inter',sans-serif]"
              >
                {typeof product.brand === 'string' ? product.brand : product.brand?.name || 'Brand'}
              </Link>
              <h1 className="font-['Roboto',sans-serif] text-lg sm:text-xl lg:text-3xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mt-1 leading-tight">
                {product.name}
              </h1>
              
              {/* Rating - Compact Row */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3.5 h-3.5",
                        i < Math.floor(product.rating) 
                          ? "fill-[#C9A24D] text-[#C9A24D]" 
                          : "text-[#D1D5DB] dark:text-[#4B5563]"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#9CA3AF] dark:text-[#6B7280] font-['Inter',sans-serif]">
                  {product.rating} · {product.reviews} reviews
                </span>
              </div>
            </div>

            {/* Price - Prominent Display */}
            <div className="space-y-0.5 lg:space-y-1">
              <span className="block text-2xl lg:text-4xl font-bold text-[#DC2626] font-['Roboto',sans-serif]">
                ₹{product.price?.toLocaleString()}
              </span>
              {(product.mrp || product.originalPrice) && (product.mrp || product.originalPrice) > product.price && (
                <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                  <span className="text-xs lg:text-sm text-[#9CA3AF] dark:text-[#6B7280] font-['Inter',sans-serif]">
                    MRP <span className="line-through">₹{(product.mrp || product.originalPrice)?.toLocaleString()}</span>
                  </span>
                  <span className="hidden sm:inline text-xs lg:text-sm font-medium text-green-600 dark:text-green-400 font-['Inter',sans-serif]">
                    Save ₹{((product.mrp || product.originalPrice) - product.price)?.toLocaleString()}
                  </span>
                  <span className="text-[10px] lg:text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 lg:px-2 py-0.5 rounded font-['Inter',sans-serif]">
                    {Math.round((((product.mrp || product.originalPrice) - product.price) / (product.mrp || product.originalPrice)) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Color Selection - Circular Swatches with Navigation */}
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280] dark:text-[#9CA3AF] mb-2 font-['Inter',sans-serif]">
                Color: <span className="normal-case text-[#1C1C1C] dark:text-[#F9FAFB]">{product.color || selectedColor}</span>
              </h3>
              <div className="flex gap-3">
                {/* Use colorOptions from API if available (catalogue-based products) */}
                {colorOptions?.length > 0 ? (
                  colorOptions.map((colorOption, index) => {
                    // Use colorHex from API if available, otherwise fall back to colorSwatchMap
                    const hexColor = colorOption.colorHex || colorSwatchMap[colorOption.color]?.bg || '#6B7280';
                    const swatch = { bg: hexColor, border: hexColor };
                    const isSelected = colorOption.id === product.id;
                    return (
                      <Link
                        key={colorOption.id || `color-${index}`}
                        to={`/product/${colorOption.id}`}
                        title={colorOption.color}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "relative w-10 h-10 rounded-full transition-all duration-200 cursor-pointer",
                            !isSelected && "hover:ring-2 hover:ring-[#E5E7EB] dark:hover:ring-[#374151] hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-[#0B0F19]"
                          )}
                          style={{
                            backgroundColor: swatch.bg,
                            border: `2px solid ${swatch.border}`,
                          }}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.15 }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <span 
                                  className="absolute inset-[-4px] rounded-full border-2 animate-pulse"
                                  style={{ borderColor: accent.primary }}
                                />
                                <Check 
                                  className={cn(
                                    "w-5 h-5",
                                    swatch.bg === '#FFFFFF' || swatch.bg === '#F9FAFB' 
                                      ? "text-[#1C1C1C]" 
                                      : "text-white"
                                  )} 
                                />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </Link>
                    );
                  })
                ) : (
                  /* Fallback: Legacy color selection for products without colorOptions */
                  product.colors?.map((color) => {
                    const swatch = colorSwatchMap[color] || { bg: '#6B7280', border: '#6B7280' };
                    const isSelected = selectedColor === color;
                    return (
                      <motion.button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "relative w-10 h-10 rounded-full transition-all duration-200",
                          !isSelected && "hover:ring-2 hover:ring-[#E5E7EB] dark:hover:ring-[#374151] hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-[#0B0F19]"
                        )}
                        style={{
                          backgroundColor: swatch.bg,
                          border: `2px solid ${swatch.border}`,
                        }}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.15 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <span 
                                className="absolute inset-[-4px] rounded-full border-2 animate-pulse"
                                style={{ borderColor: accent.primary }}
                              />
                              <Check 
                                className={cn(
                                  "w-5 h-5",
                                  swatch.bg === '#FFFFFF' || swatch.bg === '#F9FAFB' 
                                    ? "text-[#1C1C1C]" 
                                    : "text-white"
                                )} 
                              />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280] dark:text-[#9CA3AF] font-['Inter',sans-serif]">Select Size</h3>
                <div className="flex gap-1 text-xs font-['Inter',sans-serif]">
                  {['IND', 'UK', 'EU'].map((sys) => (
                    <button
                      key={sys}
                      onClick={() => setSizeSystem(sys.toLowerCase())}
                      className={cn(
                        "px-2.5 py-1 rounded transition-colors uppercase font-medium",
                        sizeSystem === sys.toLowerCase() 
                          ? "bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A]" 
                          : "text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937]"
                      )}
                    >
                      {sys}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 lg:gap-2">
                {(product.sizes || []).map((size, index) => {
                  // Get the IND size (which is what's stored in size.ind)
                  const indSize = size.ind || size.uk || size;
                  const originalSystem = product.sizeChartType || 'IND';
                  const originalSize = size.originalSize || indSize;
                  const gender = product.gender || 'men';
                  
                  // Convert to selected size system
                  let displaySize;
                  if (sizeSystem === 'ind') {
                    displaySize = indSize;
                  } else {
                    displaySize = convertSize(originalSize, originalSystem, sizeSystem.toUpperCase(), gender) || indSize;
                  }
                  
                  const isSelected = selectedSize && (
                    selectedSize === indSize || 
                    selectedSize === displaySize ||
                    selectedSize?.ind === indSize
                  );
                  
                  return (
                    <motion.button
                      key={`${indSize}-${index}`}
                      onClick={() => size.inStock && setSelectedSize(size)}
                      disabled={!size.inStock}
                      whileTap={size.inStock ? { scale: 0.92 } : {}}
                      className={cn(
                        "relative py-2 lg:py-2.5 rounded-lg text-xs lg:text-sm font-medium overflow-hidden font-['Inter',sans-serif]",
                        !size.inStock && "opacity-40 cursor-not-allowed text-[#9CA3AF] dark:text-[#6B7280] bg-[#F3F4F6] dark:bg-[#1F2937]",
                        size.inStock && !isSelected && "border border-[#E5E7EB] dark:border-[#374151] text-[#1C1C1C] dark:text-[#F9FAFB] hover:border-[#C9A24D]"
                      )}
                    >
                      <motion.span
                        initial={false}
                        animate={{
                          backgroundColor: isSelected ? accent.primary : 'transparent',
                        }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-lg"
                      />
                      <span className={cn(
                        "relative z-10 transition-colors duration-200",
                        isSelected && "text-white"
                      )}>
                        {displaySize}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Quantity - Hidden on mobile, quantity can be adjusted in cart */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-[#6B7280] dark:text-[#9CA3AF] font-['Inter',sans-serif]">Quantity</h3>
                {selectedSize && (
                  <span className={cn(
                    "text-xs font-medium font-['Inter',sans-serif]",
                    remainingStock <= 3 ? "text-orange-500" : "text-[#6B7280]"
                  )}>
                    {remainingStock > 0 ? `${remainingStock} in stock` : 'Out of stock'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#E5E7EB] dark:border-[#374151] rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2.5 text-[#6B7280] hover:text-[#1C1C1C] dark:hover:text-[#F9FAFB] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] transition-colors rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-medium text-[#1C1C1C] dark:text-[#F9FAFB] font-['Inter',sans-serif]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={!selectedSize || quantity >= maxQuantity || remainingStock <= 0}
                    className="p-2.5 text-[#6B7280] hover:text-[#1C1C1C] dark:hover:text-[#F9FAFB] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] transition-colors rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {selectedSize && quantity >= maxQuantity && remainingStock > 0 && (
                  <span className="text-xs text-orange-500 font-['Inter',sans-serif]">Max quantity reached</span>
                )}
              </div>
            </div>

            {/* Actions - Hidden on mobile, using sticky bar */}
            <div className="hidden lg:flex gap-3">
              <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={addedToCart || !selectedSize || remainingStock <= 0}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 font-semibold rounded-xl transition-all duration-200 font-['Inter',sans-serif]",
                  addedToCart
                    ? "bg-green-600 dark:bg-green-500 text-white"
                    : remainingStock <= 0 && selectedSize
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] hover:shadow-lg"
                )}
              >
                <AnimatePresence mode="wait">
                  {addedToCart ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Added!
                    </motion.span>
                  ) : remainingStock <= 0 && selectedSize ? (
                    <motion.span
                      key="out-of-stock"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      Out of Stock
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Add to Cart
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWishlistToggle}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all",
                  inWishlist 
                    ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-500/10" 
                    : "border-[#E5E7EB] dark:border-[#374151] text-[#6B7280] hover:border-[#C9A24D] hover:text-[#C9A24D]"
                )}
              >
                <Heart className={cn("w-5 h-5", inWishlist && "fill-current")} />
              </motion.button>
            </div>

            {/* Trust Badges - Hidden on mobile */}
            <div className="hidden lg:grid grid-cols-3 gap-3 pt-5 border-t border-[#E5E7EB] dark:border-[#1F2937]">
              <div className="text-center">
                <Truck className="w-5 h-5 mx-auto mb-1.5 text-[#C9A24D]" />
                <p className="text-xs font-medium text-[#1C1C1C] dark:text-[#F9FAFB] font-['Inter',sans-serif]">Free Shipping</p>
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-['Inter',sans-serif]">Orders over ₹2000</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-5 h-5 mx-auto mb-1.5 text-[#C9A24D]" />
                <p className="text-xs font-medium text-[#1C1C1C] dark:text-[#F9FAFB] font-['Inter',sans-serif]">Easy Returns</p>
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-['Inter',sans-serif]">72-hour policy</p>
              </div>
              <div className="text-center">
                <Shield className="w-5 h-5 mx-auto mb-1.5 text-[#C9A24D]" />
                <p className="text-xs font-medium text-[#1C1C1C] dark:text-[#F9FAFB] font-['Inter',sans-serif]">Authentic</p>
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-['Inter',sans-serif]">100% Genuine</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-6 lg:mt-12">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start border-b border-[#E5E7EB] dark:border-[#1F2937] rounded-none bg-transparent h-auto p-0 overflow-x-auto">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#C9A24D] text-[#6B7280] data-[state=active]:text-[#1C1C1C] dark:data-[state=active]:text-[#F9FAFB] font-['Inter',sans-serif] text-xs lg:text-sm px-2 lg:px-4">
                Description
              </TabsTrigger>
              <TabsTrigger value="specifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#C9A24D] text-[#6B7280] data-[state=active]:text-[#1C1C1C] dark:data-[state=active]:text-[#F9FAFB] font-['Inter',sans-serif] text-xs lg:text-sm px-2 lg:px-4">
                Specs
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#C9A24D] text-[#6B7280] data-[state=active]:text-[#1C1C1C] dark:data-[state=active]:text-[#F9FAFB] font-['Inter',sans-serif] text-xs lg:text-sm px-2 lg:px-4">
                Reviews ({product.reviews})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="pt-6">
              <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-6">{product.description}</p>
              {product.features && product.features.length > 0 && (
                <>
                  <h4 className="font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-3">Features:</h4>
                  <ul className="space-y-2">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-[#374151] dark:text-[#D1D5DB]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="specifications" className="pt-4 lg:pt-6">
              {product.specifications ? (
                <div className="-mx-4 px-4 lg:mx-0 lg:px-0">
                  <div className="space-y-0">
                    {Object.entries(product.specifications).map(([key, value], index) => (
                      <div key={key} className={`py-2.5 lg:py-3 px-3 lg:px-4 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 ${index % 2 === 0 ? 'bg-[#F9FAFB] dark:bg-[#1F2937]/50' : 'bg-white dark:bg-transparent'}`}>
                        <span className="text-xs lg:text-sm text-[#6B7280] dark:text-[#9CA3AF] font-medium sm:w-1/3 sm:flex-shrink-0">{key}</span>
                        <span className="text-xs lg:text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB] break-words">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground font-['Inter',sans-serif] text-sm">No specifications available</p>
              )}
            </TabsContent>
            
            <TabsContent value="reviews" className="pt-6">
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-[#E5E7EB] dark:border-[#1F2937] pb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#C9A24D]/10 flex items-center justify-center font-semibold text-[#C9A24D]">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#1C1C1C] dark:text-[#F9FAFB] flex items-center gap-2">
                          {review.name}
                          {review.verified && (
                            <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                              Verified
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-4 h-4",
                                  i < review.rating 
                                    ? "fill-[#C9A24D] text-[#C9A24D]" 
                                    : "text-[#D1D5DB] dark:text-[#4B5563]"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] ml-13">{review.comment}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <section className="mt-8 lg:mt-16">
          <h2 className="font-display text-lg lg:text-2xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-4 lg:mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            {relatedProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <ProductCard product={product} colorVariants={product.colorVariants} />
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile Sticky Add to Cart Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#374151] p-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
          {/* Price */}
          <div className="flex-shrink-0">
            <p className="text-lg font-bold text-[#DC2626] font-['Roboto',sans-serif]">
              ₹{(product.price || 0).toLocaleString('en-IN')}
            </p>
            {(product.mrp || product.originalPrice) && (product.mrp || product.originalPrice) > product.price && (
              <p className="text-[10px] text-[#6B7280] line-through">
                ₹{((product.mrp || product.originalPrice) || 0).toLocaleString('en-IN')}
              </p>
            )}
          </div>
          
          {/* Add to Cart Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={!selectedSize || remainingStock <= 0}
            className={cn(
              "flex-1 h-11 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 font-['Inter',sans-serif]",
              !selectedSize 
                ? "bg-[#E5E7EB] dark:bg-[#374151] text-[#9CA3AF] cursor-not-allowed"
                : remainingStock <= 0 
                  ? "bg-[#E5E7EB] dark:bg-[#374151] text-[#9CA3AF] cursor-not-allowed"
                  : addedToCart
                    ? "bg-green-600 text-white"
                    : "bg-[#1C1C1C] dark:bg-[#C9A24D] text-white"
            )}
          >
            <AnimatePresence mode="wait">
              {addedToCart ? (
                <motion.span
                  key="added-mobile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Added!
                </motion.span>
              ) : !selectedSize ? (
                <span>Select Size</span>
              ) : remainingStock <= 0 ? (
                <span>Out of Stock</span>
              ) : (
                <motion.span
                  key="add-mobile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Wishlist Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleWishlistToggle}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-lg border-2 transition-all flex-shrink-0",
              inWishlist 
                ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-500/10" 
                : "border-[#E5E7EB] dark:border-[#374151] text-[#6B7280]"
            )}
          >
            <Heart className={cn("w-5 h-5", inWishlist && "fill-current")} />
          </motion.button>
        </div>
      </div>
    </Layout>
  );
}
