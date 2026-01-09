import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Grid, List, ChevronDown, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useProducts } from '@/hooks/useProducts';
import { BrandAPI } from '@/lib/api';

// All sizes
const allSizes = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export default function AllProducts() {
  const { setSegment } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState([0, 20000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [brands, setBrands] = useState([]);
  const scrollPositionRef = useRef(0);

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
  }, [selectedBrands, selectedSizes, selectedCategory, debouncedPriceRange]);

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

  // Initialize from URL params on mount
  useEffect(() => {
    const brandParam = searchParams.get('brand');
    if (brandParam) {
      setSelectedBrands([brandParam]);
    }
  }, []); // Only run on mount

  // Fetch products from API
  const { 
    products: apiProducts, 
    loading, 
    error,
    total,
    totalPages 
  } = useProducts({
    gender: selectedCategory !== 'all' ? selectedCategory : undefined,
    brand: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
    minPrice: debouncedPriceRange[0] > 0 ? debouncedPriceRange[0] : undefined,
    maxPrice: debouncedPriceRange[1] < 20000 ? debouncedPriceRange[1] : undefined,
    page: currentPage,
    perPage: 24,
  });

  useEffect(() => {
    // Set to 'all' theme
    setSegment('all');
    
    return () => setSegment('default');
  }, [setSegment]);

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
    setSelectedCategory('all');
  };

  const hasActiveFilters = selectedBrands.length > 0 || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 20000 || selectedCategory !== 'all';

  // Filter and sort products (client-side for additional filters)
  const filteredProducts = useMemo(() => {
    let result = [...apiProducts];
    
    // Additional client-side filters
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
      {/* Category Filter */}
      <div>
        <h4 className="font-semibold mb-3 text-foreground">Category</h4>
        <div className="flex flex-wrap gap-2">
          {['all', 'men', 'women', 'kids'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize",
                selectedCategory === cat
                  ? "bg-[#C9A24D] text-white shadow-md"
                  : "bg-muted/50 text-foreground hover:bg-muted"
              )}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="font-semibold mb-3 text-foreground">Brands</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map(brand => (
            <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox 
                checked={selectedBrands.includes(brand.name)}
                onCheckedChange={() => toggleBrand(brand.name)}
                className="border-[#C9A24D] data-[state=checked]:bg-[#C9A24D] data-[state=checked]:border-[#C9A24D]"
              />
              <span className="text-sm group-hover:text-[#C9A24D] transition-colors">{brand.name}</span>
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
          {allSizes.map(size => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={cn(
                "w-10 h-10 rounded-lg border text-sm font-medium transition-all duration-200",
                selectedSizes.includes(size)
                  ? "bg-[#C9A24D] text-white border-[#C9A24D] shadow-md"
                  : "border-border hover:border-[#C9A24D] hover:text-[#C9A24D]"
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
          className="w-full border-[#C9A24D] text-[#C9A24D] hover:bg-[#C9A24D] hover:text-white" 
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
      <div className="min-h-screen bg-white dark:bg-[#0F172A]">
        {/* Hero Section */}
        <section className="relative py-10 md:py-14 overflow-hidden bg-gradient-to-b from-white to-[#FAF9F7] dark:from-[#0F172A] dark:to-[#0B0F19]">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-3xl mx-auto text-center"
            >
              {/* Small Brand Cue */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-sm font-medium tracking-widest uppercase text-[#C9A24D] mb-4"
              >
                HC Fashion House
              </motion.p>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[#1C1C1C] dark:text-[#F9FAFB] mb-4"
              >
                Explore Our Collection
              </motion.h1>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg md:text-xl text-[#6B7280] dark:text-[#CBD5E1] mb-4 max-w-2xl mx-auto"
              >
                Premium footwear for men, women, and kids — designed for comfort, style, and everyday wear.
              </motion.p>

              {/* Subtle Down Arrow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{ 
                  opacity: { delay: 0.6, duration: 0.5 },
                  y: { delay: 0.8, duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="text-[#C9A24D]"
              >
                <ChevronDown className="w-6 h-6 mx-auto" />
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#FAF9F7] dark:from-[#0B0F19] to-transparent" />
        </section>

        {/* Category Pills */}
        <motion.div 
          className="border-b border-[#E5E7EB] dark:border-[#1F2937] bg-[#FAF9F7] dark:bg-[#0B0F19]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="container py-4">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              {['all', 'men', 'women', 'kids'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize",
                    selectedCategory === cat
                      ? "bg-[#C9A24D] text-white shadow-md"
                      : "bg-white dark:bg-[#1F2937] text-[#374151] dark:text-[#E5E7EB] hover:bg-[#C9A24D]/10 border border-[#E5E7EB] dark:border-[#374151]"
                  )}
                >
                  {cat === 'all' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Toolbar */}
        <motion.div 
          className="border-b border-[#E5E7EB] dark:border-[#1F2937] sticky top-[72px] lg:top-[112px] bg-[#FAF9F7] dark:bg-[#0B0F19] backdrop-blur-md z-30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="container py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden gap-2 border-[#E5E7EB] dark:border-[#1F2937] text-[#374151] dark:text-[#E5E7EB] hover:border-[#C9A24D] hover:bg-[#C9A24D]/10 rounded-xl">
                      <Filter className="w-4 h-4 text-[#374151] dark:text-[#9CA3AF]" />
                      Filters
                      {hasActiveFilters && (
                        <span className="w-5 h-5 bg-[#C9A24D] text-white text-xs rounded-full flex items-center justify-center">
                          {selectedBrands.length + selectedSizes.length + (selectedCategory !== 'all' ? 1 : 0)}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-white dark:bg-[#0F172A]">
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
                  <SelectTrigger className="w-[180px] border-[#E5E7EB] dark:border-[#1F2937] text-[#374151] dark:text-[#E5E7EB] hover:border-[#C9A24D]/50 rounded-xl">
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
                        ? "bg-[#C9A24D] text-white" 
                        : "text-[#374151] dark:text-[#9CA3AF] hover:bg-[#C9A24D]/10"
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2.5 transition-all duration-200",
                      viewMode === 'list' 
                        ? "bg-[#C9A24D] text-white" 
                        : "text-[#374151] dark:text-[#9CA3AF] hover:bg-[#C9A24D]/10"
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
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-[180px]">
                <h3 className="font-semibold text-lg mb-4 text-foreground">Filters</h3>
                <FilterContent />
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1" id="product-grid">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-[#C9A24D] animate-spin" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <p className="text-xl text-muted-foreground mb-4">No products found</p>
                  <Button onClick={clearFilters} variant="outline" className="border-[#C9A24D] text-[#C9A24D] hover:bg-[#C9A24D] hover:text-white">
                    Clear all filters
                  </Button>
                </motion.div>
              ) : (
                <div className={cn(
                  "grid gap-3 sm:gap-4 md:gap-6",
                  viewMode === 'grid' 
                    ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                )}>
                  {filteredProducts.map((product, index) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      viewMode={viewMode}
                      index={index}
                      colorVariants={product.colorVariants}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
