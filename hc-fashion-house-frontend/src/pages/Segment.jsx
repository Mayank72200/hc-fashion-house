import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Grid, List, ChevronDown, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { segmentInfo, segmentBrands } from '@/data/products';
import { useProducts, getBrandsForSegment } from '@/hooks/useProducts';
import { BrandAPI } from '@/lib/api';

const validSegments = ['men', 'women', 'kids'];
const sizes = {
  men: [6, 7, 8, 9, 10, 11, 12],
  women: [4, 5, 6, 7, 8],
  kids: [8, 9, 10, 11, 12, 13, 1, 2, 3],
};

export default function Segment() {
  const { segment } = useParams();
  const { setSegment: setThemeSegment } = useTheme();
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState([0, 20000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [brands, setBrands] = useState([]);
  const scrollPositionRef = useRef(0);

  // Validate segment - redirect to 404 if invalid
  if (!validSegments.includes(segment)) {
    return <Navigate to="/404" replace />;
  }

  // Fetch brands from API
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brandsData = await BrandAPI.getBrands({ limit: 100 });
        setBrands(brandsData || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    fetchBrands();
  }, []);

  // Debounce price range changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [priceRange]);

  // Save scroll position before filter changes
  const saveScrollPosition = useCallback(() => {
    scrollPositionRef.current = window.scrollY;
  }, []);

  // Restore scroll position after filter changes
  useEffect(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current);
    }
  }, [selectedBrands, selectedSizes, debouncedPriceRange]);

  // Fetch products from API with filters
  const { 
    products: apiProducts, 
    loading, 
    error, 
    total,
    totalPages 
  } = useProducts({
    gender: segment,
    brand: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
    minPrice: debouncedPriceRange[0] > 0 ? debouncedPriceRange[0] : undefined,
    maxPrice: debouncedPriceRange[1] < 20000 ? debouncedPriceRange[1] : undefined,
    page: currentPage,
    perPage: 20,
  });

  const info = segmentInfo[segment];
  const segmentSizes = sizes[segment];

  useEffect(() => {
    // Set the segment theme when the page loads
    setThemeSegment(segment);
    
    // Cleanup: reset to default when leaving the page
    return () => setThemeSegment('default');
  }, [segment, setThemeSegment]);

  const toggleBrand = (brand) => {
    saveScrollPosition();
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleSize = (size) => {
    saveScrollPosition();
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    saveScrollPosition();
    setSelectedBrands([]);
    setSelectedSizes([]);
    setPriceRange([0, 20000]);
  };

  const hasActiveFilters = selectedBrands.length > 0 || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 20000;

  // Filter and sort products (client-side for additional filters)
  const filteredProducts = useMemo(() => {
    let result = [...apiProducts];
    
    // Additional client-side filters (multi-brand, sizes)
    if (selectedBrands.length > 1) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }
    if (selectedSizes.length > 0) {
      result = result.filter(p => p.sizes?.some(s => selectedSizes.includes(s)));
    }
    
    // Sort
    return result.sort((a, b) => {
      switch(sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'newest': return String(b.id).localeCompare(String(a.id));
        default: return 0;
      }
    });
  }, [apiProducts, selectedBrands, selectedSizes, sortBy]);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Brands */}
      <div>
        <h4 className="font-semibold mb-3 text-foreground">Brands</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map(brand => (
            <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox 
                checked={selectedBrands.includes(brand.name)}
                onCheckedChange={() => toggleBrand(brand.name)}
                className="border-accent data-[state=checked]:bg-accent data-[state=checked]:border-accent"
              />
              <span className="text-sm group-hover:text-accent transition-colors">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-semibold mb-3 text-foreground">Price Range</h4>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={20000}
          min={0}
          step={500}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₹{priceRange[0].toLocaleString()}</span>
          <span>₹{priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h4 className="font-semibold mb-3 text-foreground">Sizes (UK)</h4>
        <div className="flex flex-wrap gap-2">
          {segmentSizes.map(size => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={cn(
                "w-10 h-10 rounded-lg border text-sm font-medium transition-all duration-200",
                selectedSizes.includes(size)
                  ? "bg-accent text-accent-foreground border-accent shadow-md shadow-accent/20"
                  : "border-border hover:border-accent hover:text-accent"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground" 
          onClick={clearFilters}
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      {/* Full page segment background */}
      <div className="min-h-screen segment-panel">
        {/* Hero Banner */}
        <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
          {/* Background Image with Parallax Effect */}
          <motion.div 
            className="absolute inset-0"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <img 
              src={info.heroImage} 
              alt={info.title} 
              className={cn(
                "w-full h-full object-cover",
                segment === 'women' ? "opacity-[0.85]" : "opacity-90"
              )}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {/* Segment-specific gradient overlay - Light mode */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r dark:hidden",
              info.heroGradient
            )} />
            {/* Segment-specific gradient overlay - Dark mode */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r hidden dark:block",
              info.heroGradientDark || info.heroGradient
            )} />
            {/* Additional depth gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
          </motion.div>
          
          {/* Hero Content */}
          <div className="container relative h-full flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-2xl"
            >
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className={cn(
                  "inline-flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-full mb-6",
                  segment === 'women' 
                    ? "bg-white/[0.75] border border-[rgba(232,180,184,0.45)] dark:bg-[rgba(232,180,184,0.70)] dark:border-transparent" 
                    : segment === 'kids'
                    ? "bg-white/[0.80] border border-[rgba(245,158,11,0.4)] dark:bg-white/[0.12] dark:border-[rgba(245,158,11,0.4)]"
                    : "bg-white/[0.18] dark:bg-white/[0.12]"
                )}
              >
                <Sparkles className={cn(
                  "w-4 h-4",
                  segment === 'women' ? "text-[#E8B4B8]" 
                    : segment === 'kids' ? "text-[#F59E0B]"
                    : "text-[#F4C430]"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  segment === 'women' 
                    ? "text-[#1C1C1C] dark:text-[#F9FAFB]" 
                    : segment === 'kids'
                    ? "text-[#1C1C1C] dark:text-[#FFF7ED]"
                    : "text-white dark:text-[#E5E7EB]"
                )}>New Season Arrivals</span>
              </motion.div>
              
              <motion.h1 
                className={cn(
                  "font-display text-5xl lg:text-7xl font-bold mb-4",
                  segment === 'women' 
                    ? "text-[#1C1C1C] dark:text-[#F9FAFB]" 
                    : segment === 'kids'
                    ? "text-[#1C1C1C] dark:text-[#FFF7ED]"
                    : "text-white dark:text-[#F9FAFB]"
                )}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                {info.title}
              </motion.h1>
              
              <motion.p 
                className={cn(
                  "text-xl mb-8",
                  segment === 'women' 
                    ? "text-[#6B7280] dark:text-[#D1D5DB]" 
                    : segment === 'kids'
                    ? "text-[#5B5B5B] dark:text-[#E7D6C9]"
                    : "text-[#EAF2F8] dark:text-[#CBD5E1]"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                {info.subtitle}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <motion.button
                  onClick={() => {
                    document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  whileHover={{ 
                    y: -2, 
                    boxShadow: '0 8px 18px rgba(15,23,42,0.15)',
                    backgroundColor: '#FFFFFF'
                  }}
                  whileTap={{ 
                    y: 0,
                    backgroundColor: '#F3F4F6',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.10)'
                  }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={cn(
                    "group px-8 py-3 font-semibold text-base bg-white/[0.92] dark:bg-white/[0.92] text-[#0F172A] border border-[rgba(28,28,28,0.15)] dark:border-[rgba(28,28,28,0.15)] flex items-center gap-2",
                    segment === 'kids' ? "rounded-2xl" : "rounded-xl"
                  )}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                >
                  View All Products
                  <span className="inline-block transition-transform duration-200 ease-out group-hover:translate-y-[3px]">
                    ↓
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Decorative Elements */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-segment-panel to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          />
        </section>

        {/* Toolbar */}
        <motion.div 
          className="border-b border-[#E5E7EB] dark:border-[#1F2937] sticky top-[72px] lg:top-[112px] bg-white dark:bg-[#0B0F19] backdrop-blur-md z-30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <div className="container py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden gap-2 border-[#E5E7EB] dark:border-[#1F2937] text-[#374151] dark:text-[#E5E7EB] hover:border-accent hover:bg-accent/10 rounded-xl">
                      <Filter className="w-4 h-4 text-[#374151] dark:text-[#9CA3AF]" />
                      Filters
                      {hasActiveFilters && (
                        <span className="w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
                          {selectedBrands.length + selectedSizes.length}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="segment-panel">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] border-[#E5E7EB] dark:border-[#1F2937] text-[#374151] dark:text-[#E5E7EB] hover:border-accent/50 rounded-xl">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden sm:flex items-center border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2.5 transition-all duration-200",
                      viewMode === 'grid' 
                        ? "bg-accent text-accent-foreground" 
                        : "text-[#374151] dark:text-[#9CA3AF] hover:bg-accent/10"
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2.5 transition-all duration-200",
                      viewMode === 'list' 
                        ? "bg-accent text-accent-foreground" 
                        : "text-[#374151] dark:text-[#9CA3AF] hover:bg-accent/10"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container py-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <motion.aside 
              className="hidden lg:block w-64 flex-shrink-0"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <div className="sticky top-[180px] bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-6">
                <h3 className="font-display text-lg font-semibold mb-6 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-accent" />
                  Filters
                </h3>
                <FilterContent />
              </div>
            </motion.aside>

            {/* Product Grid */}
            <div id="product-grid" className="flex-1 scroll-mt-32">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-accent animate-spin" />
                </div>
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={sortBy + selectedBrands.join() + selectedSizes.join()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                        className={cn(
                      "grid",
                      viewMode === 'grid' 
                        ? "grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3"
                        : "grid-cols-1 gap-4"
                    )}
                  >
                    {filteredProducts.map((product, i) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        viewMode={viewMode} 
                        index={i}
                        colorVariants={product.colorVariants}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>

                {filteredProducts.length === 0 && (
                  <motion.div 
                    className="text-center py-20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                      <Filter className="w-10 h-10 text-accent" />
                    </div>
                    <p className="text-muted-foreground text-lg mb-4">No products match your filters.</p>
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      Clear Filters
                    </Button>
                  </motion.div>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
