import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Heart, ShoppingBag, Star, Eye, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getImageProps } from '@/utils/imageUtils';

export default function ProductCard({ product, viewMode = 'grid', index = 0, colorVariants = [] }) {
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { segment } = useTheme();
  
  // State for selected color variant
  const [selectedVariant, setSelectedVariant] = useState(null);
  const displayProduct = selectedVariant || product;

  const inWishlist = isInWishlist(product.id);
  // Use mrp for discount calculation (mrp is the original price, price is selling price)
  const discount = displayProduct.mrp 
    ? Math.round((1 - displayProduct.price / displayProduct.mrp) * 100) 
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ ...product, quantity: 1 });
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  if (viewMode === 'list') {
    return (
      <Link to={`/product/${product.id}`} className="group block">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          className="flex gap-6 bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/50 p-4 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-500"
        >
          <div className="w-32 h-32 flex-shrink-0 bg-image rounded-xl overflow-hidden relative">
            <img 
              {...getImageProps(product.image, product.name)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            {product.isNew && (
              <span className="absolute top-2 left-2 bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> NEW
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium uppercase tracking-wide">{product.brand}</p>
            <h3 className="font-product font-bold text-lg text-[#1A1A1A] dark:text-[#EDEDED] truncate mt-0.5">{product.name}</h3>
            
            {product.rating && (
              <div className="flex items-center gap-1 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "w-3.5 h-3.5",
                        i < Math.floor(product.rating) ? "fill-gold text-gold" : "text-border"
                      )} 
                    />
                  ))}
                </div>
                <span className="text-sm font-medium ml-1">{product.rating}</span>
                <span className="text-xs text-muted-foreground">({product.reviews})</span>
              </div>
            )}
            
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-xl font-bold text-[#B11226] dark:text-[#EF4444]">₹{displayProduct.price?.toLocaleString()}</span>
              {displayProduct.mrp && (
                <span className="text-sm text-[#9CA3AF] dark:text-[#6B7280] line-through">
                  MRP ₹{displayProduct.mrp.toLocaleString()}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                  {discount}% OFF
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlistToggle}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300",
                inWishlist 
                  ? "bg-destructive/10 border-destructive/30 text-destructive" 
                  : "border-border hover:border-accent hover:bg-accent/10"
              )}
            >
              <Heart className={cn("w-4 h-4", inWishlist && "fill-current")} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
              className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:shadow-lg hover:shadow-accent/30 transition-all duration-300"
            >
              <ShoppingBag className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/product/${displayProduct.id}`} className="group block">
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: index * 0.04, 
          duration: 0.22,
          ease: 'easeOut'
        }}
        className={cn(
          "relative bg-card dark:bg-card overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-accent/60 hover:shadow-lg transition-all duration-300",
          segment === 'kids' ? "rounded-2xl" : "rounded-xl"
        )}
        style={{ boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}
      >
        {/* Image Container - Fixed 1:1 aspect ratio */}
        <div className={cn(
          "relative aspect-square overflow-hidden product-image-bg",
          segment === 'kids' ? "rounded-t-2xl" : "rounded-t-xl"
        )}>
          {/* Subtle gradient overlay on hover - reduced opacity */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
          
          {/* Image with transition for color switching */}
          <AnimatePresence mode="wait">
            <motion.img 
              key={displayProduct.id}
              {...getImageProps(displayProduct.image, displayProduct.name)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full object-cover object-center transition-transform duration-200 ease-out group-hover:scale-[1.04]"
            />
          </AnimatePresence>
          
          {/* Badges - Show only discount on mobile, all on desktop */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 sm:gap-2 z-20">
            {/* New badge - hidden on mobile */}
            {product.isNew && (
              <motion.span 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  "hidden sm:flex bg-accent text-accent-foreground rounded-full font-bold uppercase tracking-wide items-center gap-1 shadow-md",
                  segment === 'kids' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
                )}
              >
                <Sparkles className={segment === 'kids' ? "w-2.5 h-2.5" : "w-3 h-3"} /> New
              </motion.span>
            )}
            {/* Hot badge - hidden on mobile */}
            {product.isTrending && !product.isNew && (
              <motion.span 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  "hidden sm:flex bg-[#F59E0B] text-white rounded-full font-bold uppercase tracking-wide items-center gap-1 shadow-md",
                  segment === 'kids' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
                )}
              >
                <TrendingUp className={segment === 'kids' ? "w-2.5 h-2.5" : "w-3 h-3"} /> Hot
              </motion.span>
            )}
            {/* Discount badge - always visible, compact sizing */}
            {discount > 0 && (
              <motion.span 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  "bg-[#B11226] text-white rounded-lg font-bold shadow-sm",
                  segment === 'kids' 
                    ? "px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[9px]" 
                    : "px-1.5 sm:px-2 py-0.5 sm:py-0.5 text-[8px] sm:text-[10px]"
                )}
              >
                -{discount}%
              </motion.span>
            )}
          </div>
          
          {/* Quick Actions - Always visible but enhanced on hover */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-2 z-20">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={handleWishlistToggle}
              className={cn(
                "w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm",
                inWishlist 
                  ? "bg-[#C9A24D] text-white" 
                  : "bg-white/85 dark:bg-white/85 text-[#9CA3AF] hover:text-[#C9A24D]"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", inWishlist && "fill-[#C9A24D] text-[#C9A24D]")} />
            </motion.button>
          </div>

          {/* Bottom Actions - Show on hover, hidden on mobile */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 hidden sm:flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className="flex-1 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center gap-2 font-medium text-sm shadow-lg hover:shadow-accent/40 transition-shadow"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Cart
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-background/90 rounded-full flex items-center justify-center shadow-md hover:bg-background transition-colors"
            >
              <Eye className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
        
        {/* Product Info */}
        <div className="p-2.5 sm:p-3">
          {/* Brand */}
          <p className="text-[10px] sm:text-[11px] text-[#6B7280] font-medium uppercase tracking-wide">{displayProduct.brand}</p>
          
          {/* Product Name - Roboto for clear readability */}
          <h3 className="font-product text-[15px] sm:text-[16px] font-bold text-[#1A1A1A] dark:text-[#EDEDED] mt-0.5 line-clamp-1 leading-tight">{displayProduct.name}</h3>
          
          {/* Price Row */}
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
            <span className="text-[17px] sm:text-[19px] font-bold leading-tight text-[#B11226] dark:text-[#EF4444]">
              ₹{displayProduct.price?.toLocaleString()}
            </span>
            {displayProduct.mrp && (
              <span className="text-[11px] sm:text-[12px] text-[#9CA3AF] line-through">
                MRP ₹{displayProduct.mrp.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Rating + Color Swatches Row - Combined to save space */}
          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
            {/* Rating */}
            {displayProduct.rating && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "w-2.5 sm:w-3 h-2.5 sm:h-3",
                        i < Math.floor(displayProduct.rating) ? "fill-[#FACC15] text-[#FACC15]" : "text-[#E5E7EB] dark:text-[#374151]"
                      )} 
                    />
                  ))}
                </div>
                <span className="text-[10px] sm:text-[11px] text-[#6B7280] font-medium">{displayProduct.rating}</span>
                <span className="hidden sm:inline text-[10px] text-[#9CA3AF]">({displayProduct.reviews})</span>
              </div>
            )}
            
            {/* Color Swatches - Compact, right-aligned */}
            {colorVariants && colorVariants.length > 1 && (
              <div className="flex items-center gap-1">
                {/* Current product color */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariant(null);
                  }}
                  className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all duration-200",
                    !selectedVariant 
                      ? "border-accent scale-110" 
                      : "border-gray-300 hover:border-gray-400"
                  )}
                  style={{ backgroundColor: product.colorHex || '#888' }}
                  title={product.color}
                />
                {/* Other color variants - show max 3 */}
                {colorVariants.filter(v => v.id !== product.id).slice(0, 3).map((variant) => (
                  <button
                    key={variant.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedVariant(variant);
                    }}
                    className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all duration-200",
                      selectedVariant?.id === variant.id 
                        ? "border-accent scale-110" 
                        : "border-gray-300 hover:border-gray-400"
                    )}
                    style={{ backgroundColor: variant.colorHex || '#888' }}
                    title={variant.color}
                  />
                ))}
                {colorVariants.length > 4 && (
                  <span className="text-[9px] text-muted-foreground ml-0.5">+{colorVariants.length - 4}</span>
                )}
              </div>
            )}
            
            {/* Single color indicator (when no variants but has color) */}
            {(!colorVariants || colorVariants.length <= 1) && displayProduct.color && (
              <div 
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: displayProduct.colorHex || '#888' }}
                title={displayProduct.color}
              />
            )}
          </div>
        </div>

        {/* Subtle accent line at bottom */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </motion.div>
    </Link>
  );
}
