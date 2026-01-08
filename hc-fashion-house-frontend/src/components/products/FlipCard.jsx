import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Star, Eye, Check, Lock, ChevronRight, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from 'sonner';

// Color mapping for swatches
const colorMap = {
  'Black': '#222222',
  'White': '#FFFFFF',
  'Red': '#DC2626',
  'Blue': '#2563EB',
  'Navy': '#1E3A5F',
  'Pink': '#EC4899',
  'Purple': '#9333EA',
  'Green': '#16A34A',
  'Beige': '#D4C4A8',
  'Gold': '#EAB308',
  'Grey': '#6B7280',
  'Gray': '#6B7280',
  'Brown': '#78350F',
  'Orange': '#EA580C',
  'Yellow': '#FACC15',
  'White/Black': 'linear-gradient(135deg, #FFFFFF 50%, #222222 50%)',
  'White/Gold': 'linear-gradient(135deg, #FFFFFF 50%, #EAB308 50%)',
  'White/Pink': 'linear-gradient(135deg, #FFFFFF 50%, #EC4899 50%)',
  'Red/Black': 'linear-gradient(135deg, #DC2626 50%, #222222 50%)',
  'Blue/White': 'linear-gradient(135deg, #2563EB 50%, #FFFFFF 50%)',
  'Chicago': 'linear-gradient(135deg, #DC2626 33%, #FFFFFF 33%, #FFFFFF 66%, #222222 66%)',
};

const isLightColor = (colorName) => {
  const lightColors = ['White', 'Beige', 'Yellow', 'Gold'];
  return lightColors.some(light => colorName?.includes(light));
};

// Image transition duration in milliseconds (5 seconds)
const IMAGE_TRANSITION_INTERVAL = 5000;

export default function FlipCard({ 
  product, 
  size = 'small', 
  index = 0, 
  onTemporaryPause,
  onPermanentStop,
  isPaused: externalPaused,
  isStopped: externalStopped 
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const isWishlisted = isInWishlist(product.id);
  
  const isColorSelected = selectedColor !== null;
  const isSizeSelected = selectedSize !== null;
  const canAddToCart = isColorSelected && isSizeSelected;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isColorSelected) {
      toast.error('Please select a color first');
      return;
    }
    if (!isSizeSelected) {
      toast.error('Please select a size');
      return;
    }
    
    addItem({
      ...product,
      selectedSize,
      selectedColor,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  const isLarge = size === 'large';

  // Large/Featured Hero Card
  if (isLarge) {
    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    const [mainImage, setMainImage] = useState(images[0]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [hovered, setHovered] = useState(false);
    const [isLocallyPaused, setIsLocallyPaused] = useState(false);
    const cardRef = useRef(null);
    const intervalRef = useRef(null);
    const resumeTimeoutRef = useRef(null);

    const hasUserSelection = isColorSelected || isSizeSelected;
    const isImageSlideshowPaused = isLocallyPaused || externalPaused;

    useEffect(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (images.length > 1 && !isImageSlideshowPaused) {
        intervalRef.current = setInterval(() => {
          setCurrentImageIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % images.length;
            setMainImage(images[nextIndex]);
            return nextIndex;
          });
        }, IMAGE_TRANSITION_INTERVAL);
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [images, isImageSlideshowPaused]);

    useEffect(() => {
      setCurrentImageIndex(0);
      if (images[0]) {
        setMainImage(images[0]);
      }
      setIsLocallyPaused(false);
    }, [product.id, images]);

    useEffect(() => {
      setSelectedColor(null);
      setSelectedSize(null);
    }, [product.id]);

    useEffect(() => {
      return () => {
        if (resumeTimeoutRef.current) {
          clearTimeout(resumeTimeoutRef.current);
        }
      };
    }, []);

    useEffect(() => {
      if (hasUserSelection && onPermanentStop) {
        onPermanentStop();
      }
    }, [hasUserSelection, onPermanentStop]);

    useEffect(() => {
      if (!isLocallyPaused || externalStopped) return;

      const handleResume = () => {
        if (resumeTimeoutRef.current) {
          clearTimeout(resumeTimeoutRef.current);
        }
        
        resumeTimeoutRef.current = setTimeout(() => {
          setIsLocallyPaused(false);
          if (onTemporaryPause) {
            onTemporaryPause(false);
          }
        }, 150);
      };

      const handleScroll = () => handleResume();
      const handleMouseMoveOutside = (e) => {
        if (cardRef.current && !cardRef.current.contains(e.target)) {
          handleResume();
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('mousemove', handleMouseMoveOutside, { passive: true });
      document.addEventListener('touchmove', handleResume, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousemove', handleMouseMoveOutside);
        document.removeEventListener('touchmove', handleResume);
      };
    }, [isLocallyPaused, externalStopped, onTemporaryPause]);

    const triggerTemporaryPause = useCallback(() => {
      if (externalStopped) return;
      setIsLocallyPaused(true);
      if (onTemporaryPause) {
        onTemporaryPause(true);
      }
    }, [externalStopped, onTemporaryPause]);

    const handleCardInteraction = useCallback((e) => {
      if (externalStopped) return;
      triggerTemporaryPause();
    }, [externalStopped, triggerTemporaryPause]);

    const handleColorSelect = useCallback((e, color) => {
      e.stopPropagation();
      setSelectedColor(color);
      setSelectedSize(null);
      if (isLarge && onPermanentStop) {
        onPermanentStop();
      }
    }, [isLarge, onPermanentStop]);

    const handleSizeSelect = useCallback((e, s) => {
      e.stopPropagation();
      if (isColorSelected) {
        setSelectedSize(s);
      }
    }, [isColorSelected]);
    
    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="group relative flex flex-col lg:flex-row items-stretch overflow-visible shadow-xl h-[700px] md:h-[550px] lg:h-[520px] bg-white border border-neutral-200 dark:bg-[#0d0d0d] dark:border-neutral-800 rounded-2xl"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleCardInteraction}
        onTouchStart={handleCardInteraction}
      >
        {/* Image Section */}
        <div className="relative w-full lg:w-[55%] flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 p-4 md:p-6 lg:p-8 h-[340px] md:h-[300px] lg:h-full rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none overflow-visible">
          
          {/* Decorative gradient */}
          <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-neutral-200/50 to-transparent dark:from-neutral-700/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-neutral-200/50 to-transparent dark:from-neutral-700/20 rounded-full blur-3xl" />
          </div>

          {/* Main Product Image */}
          <div className="relative w-full h-full flex items-center justify-center z-10">
            <AnimatePresence mode="wait">
              <motion.img
                key={mainImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: hovered ? 1.05 : 1,
                  y: hovered ? -10 : 0,
                  rotate: hovered ? 2 : 0
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                src={mainImage}
                alt={product.name}
                className="object-contain max-w-full max-h-full w-auto h-auto pointer-events-none"
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '420px',
                  maxHeight: '300px',
                  filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.25))'
                }}
              />
            </AnimatePresence>
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-20">
            {product.isNew && (
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-2.5 py-0.5 bg-blue-500 text-white text-[10px] md:text-xs font-semibold rounded-full shadow-md"
              >
                NEW
              </motion.span>
            )}
            {product.isHot && (
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="px-2.5 py-0.5 bg-orange-500 text-white text-[10px] md:text-xs font-semibold rounded-full shadow-md"
              >
                🔥 HOT
              </motion.span>
            )}
            {product.discount && (
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] md:text-xs font-semibold rounded-full shadow-md"
              >
                -{product.discount}%
              </motion.span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleWishlistToggle(e);
            }}
            className="absolute top-4 right-4 lg:right-auto lg:left-4 lg:top-auto lg:bottom-4 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:scale-110 transition-all z-20 border border-neutral-100 dark:border-neutral-800"
          >
            <Heart
              className={`w-5 h-5 transition-all ${
                isWishlisted ? 'fill-[#C9A24D] text-[#C9A24D]' : 'text-neutral-400 hover:text-[#C9A24D]'
              }`}
            />
          </button>
          
          {/* Thumbnail Strip - Mobile: Bottom Center, Desktop: Right Edge (half overlapping) */}
          {images.length > 1 && (
            <div 
              className="
                absolute z-40
                bottom-4 left-1/2 -translate-x-1/2 
                lg:bottom-auto lg:left-auto lg:translate-x-0
                lg:right-0 lg:translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2
                flex lg:flex-col gap-2 p-2 
                bg-white/95 dark:bg-neutral-900/95 
                rounded-xl shadow-xl 
                border border-neutral-200 dark:border-neutral-700 
                backdrop-blur-sm
              "
            >
              {images.slice(0, 4).map((img, i) => {
                const isActive = currentImageIndex === i;
                return (
                  <button
                    key={i}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setMainImage(img);
                      setCurrentImageIndex(i);
                      if (!externalStopped) {
                        triggerTemporaryPause();
                      }
                    }}
                    className={`
                      relative rounded-lg overflow-hidden w-11 h-11 md:w-12 md:h-12 
                      flex items-center justify-center bg-neutral-100 dark:bg-neutral-800
                      transition-all duration-300 
                      ${isActive 
                        ? 'ring-2 ring-primary shadow-md scale-110' 
                        : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 opacity-60 hover:opacity-100'
                      }
                    `}
                  >
                    <img 
                      src={img} 
                      alt={`View ${i + 1}`} 
                      className="object-contain w-full h-full p-1"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="w-full lg:w-[45%] flex flex-col justify-start lg:justify-center p-5 md:p-6 lg:p-8 lg:pl-12 text-left text-neutral-900 dark:text-white overflow-y-auto flex-1">
          {/* Brand */}
          <p className="text-[10px] md:text-[11px] text-neutral-400 uppercase tracking-[0.15em] mb-1 font-medium">
            {product.brand}
          </p>

          {/* Product Name */}
          <h2 className="font-product font-bold text-xl md:text-2xl lg:text-3xl text-[#36454F] dark:text-[#E8E8E8] mb-2 leading-tight">
            {product.name}
          </h2>

          {/* Price & Discount */}
          <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
            <span className="text-xl md:text-2xl lg:text-3xl font-bold text-neutral-800 dark:text-neutral-100">
              ₹{product.price?.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-sm md:text-base text-neutral-400 line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
            {product.discount && (
              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] md:text-xs font-medium rounded-full">
                Save {product.discount}%
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3 md:mb-4 pb-3 md:pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                    star <= Math.floor(product.rating || 4)
                      ? 'fill-[#F4C430] text-[#F4C430]'
                      : 'text-neutral-200 dark:text-neutral-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs md:text-sm text-neutral-500">
              {product.rating || 4.5} · {Math.floor(Math.random() * 200) + 50} reviews
            </span>
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-3 md:mb-4">
              <p className="text-[10px] md:text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-2 uppercase tracking-wide">
                Color
                {selectedColor && (
                  <span className="normal-case font-normal text-neutral-700 dark:text-neutral-300">— {selectedColor}</span>
                )}
                {!isColorSelected && (
                  <span className="text-amber-500 text-[9px] md:text-[10px] normal-case font-normal">Required</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color;
                  const colorValue = colorMap[color] || '#888888';
                  const isGradient = colorValue.includes('gradient');
                  const isLight = isLightColor(color);
                  
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={(e) => handleColorSelect(e, color)}
                      title={color}
                      className={`
                        w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center
                        transition-all duration-200 cursor-pointer
                        ${isSelected 
                          ? 'ring-2 ring-offset-2 ring-neutral-400 dark:ring-neutral-500 scale-110' 
                          : 'hover:scale-110'
                        }
                        ${isLight && !isSelected ? 'border border-neutral-200' : ''}
                      `}
                      style={{
                        background: isGradient ? colorValue : colorValue,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      {isSelected && (
                        <Check 
                          className={`w-4 h-4 ${isLight ? 'text-neutral-700' : 'text-white'}`}
                          strokeWidth={2.5}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-4 md:mb-5">
              <p className="text-[10px] md:text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-2 uppercase tracking-wide">
                Size
                {selectedSize && (
                  <span className="normal-case font-normal text-neutral-700 dark:text-neutral-300">— {selectedSize}</span>
                )}
                {!isColorSelected && (
                  <span className="flex items-center gap-1 text-neutral-400 text-[9px] md:text-[10px] normal-case font-normal">
                    <Lock className="w-2.5 h-2.5 md:w-3 md:h-3" /> Select color first
                  </span>
                )}
              </p>
              <div className={`flex flex-wrap gap-1.5 md:gap-2 transition-all duration-300 ${!isColorSelected ? 'opacity-40 pointer-events-none' : ''}`}>
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    disabled={!isColorSelected}
                    onClick={(e) => handleSizeSelect(e, s)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg border transition-all font-medium ${
                      selectedSize === s
                        ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                        : 'bg-transparent border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                    } ${!isColorSelected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(e);
            }}
            disabled={!canAddToCart}
            size="lg"
            className={`w-full lg:w-auto lg:min-w-[200px] text-xs md:text-sm py-5 md:py-6 rounded-xl transition-all font-medium tracking-wide ${
              canAddToCart
                ? 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-lg'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {!isColorSelected 
              ? 'Select Color' 
              : !isSizeSelected 
                ? 'Select Size' 
                : 'Add to Cart'
            }
          </Button>
        </div>
      </motion.div>
    );
  }

  // REDESIGNED Small Product Cards - Bigger, Better Layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
    >
      {/* Image Container - BIGGER */}
      <div className="relative aspect-square bg-gradient-to-br from-neutral-100 via-neutral-50 to-white dark:from-neutral-800 dark:via-neutral-850 dark:to-neutral-900 overflow-hidden">
        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {product.isNew && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-2.5 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full shadow-lg backdrop-blur-sm"
            >
              NEW
            </motion.span>
          )}
          {product.isHot && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full shadow-lg"
            >
              🔥 HOT
            </motion.span>
          )}
          {product.discount && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-lg"
            >
              -{product.discount}%
            </motion.span>
          )}
        </div>

        {/* Wishlist Button - Top Right */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 shadow-lg border border-neutral-100 dark:border-neutral-700"
        >
          <Heart
            className={`w-5 h-5 transition-all ${
              isWishlisted ? 'fill-[#C9A24D] text-[#C9A24D]' : 'text-neutral-400 group-hover:text-[#C9A24D]'
            }`}
          />
        </button>

        {/* Product Image - CENTERED & BIGGER */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 group-hover:rotate-[-3deg]"
            style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))' }}
          />
        </div>

        {/* Hover Overlay with Quick Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
          <Link to={`/product/${product.id}`}>
            <Button 
              size="sm" 
              className="h-10 px-6 bg-white hover:bg-neutral-100 text-neutral-900 rounded-full shadow-xl backdrop-blur-sm text-sm font-semibold gap-2"
            >
              <Eye className="w-4 h-4" />
              Quick View
            </Button>
          </Link>
        </div>
      </div>

      {/* Content - IMPROVED LAYOUT */}
      <div className="p-4 md:p-5">
        {/* Free Shipping Badge */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full">
            <Truck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Free Shipping</span>
          </div>
        </div>

        {/* Brand & Rating Row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
            {product.brand}
          </span>
          {product.rating && (
            <div className="flex items-center gap-1 bg-[#F4C430]/10 dark:bg-[#F4C430]/20 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 fill-[#F4C430] text-[#F4C430]" />
              <span className="text-[10px] font-bold text-[#C9A24D] dark:text-[#F4C430]">{product.rating}</span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-base md:text-lg text-neutral-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Color Swatches Preview */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {product.colors.slice(0, 4).map((color, i) => {
              const colorValue = colorMap[color] || '#888888';
              const isGradient = colorValue.includes('gradient');
              const isLight = isLightColor(color);
              return (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full shadow-sm ${isLight ? 'border border-neutral-200' : ''}`}
                  style={{ background: isGradient ? colorValue : colorValue }}
                  title={color}
                />
              );
            })}
            {product.colors.length > 4 && (
              <span className="text-[11px] text-neutral-400 font-medium ml-1">+{product.colors.length - 4}</span>
            )}
          </div>
        )}

        {/* Price Row - FIXED LAYOUT */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-bold text-xl md:text-2xl text-neutral-900 dark:text-white">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-neutral-400 line-through mt-0.5">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* View Button - Properly Positioned */}
          <Link to={`/product/${product.id}`} className="flex-shrink-0">
            <Button 
              size="sm" 
              className="h-10 w-10 p-0 rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 shadow-lg hover:scale-110 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}