import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, ChevronLeft, ChevronRight, Truck, Headset, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfiniteGridBackground } from '@/components/ui/infinite-grid-background';
import { BrandsMarquee } from '@/components/ui/brands-marquee';
import Layout from '@/components/layout/Layout';
import { useTheme } from '@/contexts/ThemeContext';
import FlipCard from '@/components/products/FlipCard';
import { useFeaturedProducts } from '@/hooks/useProducts';

// Import shoe images
import heroShoe1 from '@/assets/shoes/hero-shoe-1.png';
import heroShoe2 from '@/assets/shoes/hero-shoe-2.png';
import heroShoe3 from '@/assets/shoes/hero-shoe-3.png';
import heroShoe4 from '@/assets/shoes/hero-shoe-4.png';
import heroShoe5 from '@/assets/shoes/hero-shoe-5.png';

// Hero slides with shoes and prices
const heroSlides = [
  {
    id: 1,
    title: "Step Into Greatness",
    subtitle: "Your Path to Style",
    brand: "Luxe Vista",
    price: 12999,
    cta: "View Products",
    link: "/products",
    image: heroShoe1,
  },
  {
    id: 2,
    title: "Walk in Comfort",
    subtitle: "Premium Collection",
    brand: "Urban Stride",
    price: 9999,
    cta: "View Products",
    link: "/products",
    image: heroShoe2,
  },
  {
    id: 3,
    title: "Elegance Redefined",
    subtitle: "Women's Exclusive",
    brand: "Bella Sole",
    price: 8499,
    cta: "View Products",
    link: "/products",
    image: heroShoe3,
  },
  {
    id: 4,
    title: "Play Without Limits",
    subtitle: "Kids Adventure",
    brand: "Tiny Steps",
    price: 4999,
    cta: "View Products",
    link: "/products",
    image: heroShoe4,
  },
  {
    id: 5,
    title: "Bold & Athletic",
    subtitle: "Sports Collection",
    brand: "Pro Runner",
    price: 14999,
    cta: "View Products",
    link: "/products",
    image: heroShoe5,
  },
];

const segments = [
  { id: 'men', label: 'Men', image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80', color: 'gradient-men' },
  { id: 'women', label: 'Women', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80', color: 'gradient-women' },
  { id: 'kids', label: 'Kids', image: 'https://images.unsplash.com/photo-1555274175-75f79b09d5b8?w=800&q=80', color: 'gradient-kids' },
];

// Brand data with SVG logos - using reliable CDN sources
const brandsData = [
  { name: 'Nike', logo: 'https://cdn.worldvectorlogo.com/logos/nike-4.svg' },
  { name: 'Adidas', logo: 'https://cdn.worldvectorlogo.com/logos/adidas-9.svg' },
  { name: 'Puma', logo: 'https://cdn.worldvectorlogo.com/logos/puma-logo.svg' },
  { name: 'Reebok', logo: 'https://cdn.worldvectorlogo.com/logos/reebok-2019.svg' },
  { name: 'New Balance', logo: 'https://cdn.worldvectorlogo.com/logos/new-balance-2.svg' },
  { name: 'Converse', logo: 'https://cdn.worldvectorlogo.com/logos/converse-3.svg' },
  { name: 'Vans', logo: 'https://cdn.worldvectorlogo.com/logos/vans-1.svg' },
  { name: 'Jordan', logo: 'https://cdn.worldvectorlogo.com/logos/air-jordan-1.svg' },
  { name: 'Skechers', logo: 'https://cdn.worldvectorlogo.com/logos/skechers-1.svg' },
  { name: 'Fila', logo: 'https://cdn.worldvectorlogo.com/logos/fila-4.svg' },
];

// Simple brand names for backward compatibility
const brands = brandsData.map(b => b.name);

// Expanded featured products with segments, sizes, colors
const featuredProducts = [
  { 
    id: 1, 
    name: 'Air Max 90', 
    brand: 'Nike', 
    price: 12995, 
    originalPrice: 15999,
    image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&q=80',
    images: [
      'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&q=80'
    ],
    segment: 'men',
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    colors: ['Black', 'White', 'Red'],
    rating: 4.8,
    isNew: true,
    isHot: false,
    discount: 19
  },
  { 
    id: 2, 
    name: 'Ultraboost 22', 
    brand: 'Adidas', 
    price: 15999, 
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80',
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80',
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&q=80'
    ],
    segment: 'men',
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
    colors: ['White', 'Black', 'Navy'],
    rating: 4.9,
    isNew: false,
    isHot: true
  },
  { 
    id: 3, 
    name: 'RS-X', 
    brand: 'Puma', 
    price: 8999, 
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80',
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80',
      'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=400&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80'
    ],
    segment: 'women',
    sizes: ['UK 4', 'UK 5', 'UK 6', 'UK 7'],
    colors: ['Pink', 'White', 'Purple'],
    rating: 4.6,
    isNew: true,
    isHot: false
  },
  { 
    id: 4, 
    name: 'Classic Leather', 
    brand: 'Reebok', 
    price: 7499, 
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80',
      'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=400&q=80',
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&q=80'
    ],
    segment: 'women',
    sizes: ['UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8'],
    colors: ['White', 'Beige', 'Pink'],
    rating: 4.5,
    isNew: false,
    isHot: false
  },
  { 
    id: 5, 
    name: 'Air Jordan 1', 
    brand: 'Nike', 
    price: 16999, 
    originalPrice: 19999,
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&q=80',
    images: [
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&q=80',
      'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&q=80',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&q=80'
    ],
    segment: 'men',
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    colors: ['Red/Black', 'Blue/White', 'Chicago'],
    rating: 4.9,
    isNew: false,
    isHot: true,
    discount: 15
  },
  { 
    id: 6, 
    name: 'SuperStar', 
    brand: 'Adidas', 
    price: 9999, 
    image: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=400&q=80',
    images: [
      'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=400&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80',
      'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=400&q=80',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80',
      'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&q=80'
    ],
    segment: 'women',
    sizes: ['UK 4', 'UK 5', 'UK 6', 'UK 7'],
    colors: ['White/Black', 'White/Gold', 'White/Pink'],
    rating: 4.7,
    isNew: true,
    isHot: false
  },
  { 
    id: 7, 
    name: 'Future Rider', 
    brand: 'Puma', 
    price: 5999, 
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80',
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80',
      'https://images.unsplash.com/photo-1555274175-75f79b09d5b8?w=400&q=80',
      'https://images.unsplash.com/photo-1571210862729-78a52d3779a2?w=400&q=80',
      'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=400&q=80',
      'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&q=80'
    ],
    segment: 'kids',
    sizes: ['UK 1', 'UK 2', 'UK 3', 'UK 4', 'UK 5'],
    colors: ['Blue', 'Red', 'Green'],
    rating: 4.4,
    isNew: false,
    isHot: true
  },
  { 
    id: 8, 
    name: 'Kids Runner', 
    brand: 'Nike', 
    price: 4499, 
    image: 'https://images.unsplash.com/photo-1555274175-75f79b09d5b8?w=400&q=80',
    images: [
      'https://images.unsplash.com/photo-1555274175-75f79b09d5b8?w=400&q=80',
      'https://images.unsplash.com/photo-1571210862729-78a52d3779a2?w=400&q=80',
      'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=400&q=80',
      'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&q=80',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80'
    ],
    segment: 'kids',
    sizes: ['UK 1', 'UK 2', 'UK 3', 'UK 4'],
    colors: ['Blue', 'Pink', 'Green'],
    rating: 4.6,
    isNew: true,
    isHot: false
  },
];

// Rotating phrases for category section
const categoryPhrases = ["Explore for All", "Explore Our Categories", "Shop By Category"];
// Rotating subheadings for category section (short, one line)
const categorySubPhrases = [
  "For Men, Women & Kids",
  "All styles, one place",
  "Step up your look",
  "Find your perfect fit"
];

// Tab categories for trending section
const trendingCategories = [
  { id: 'all', label: 'All' },
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'kids', label: 'Kids' },
];


// Rotating phrases for Trending Now section
const trendingPhrases = [
  "Trending Now",
  "Hot Picks",
  "Best Sellers",
  "New Arrivals"
];
const trendingSubPhrases = [
  "Check out what's hot right now!",
  "Our most popular picks for you.",
  "Top-rated products customers love.",
  "Fresh styles just landed!"
];

// Product rotation interval in milliseconds (8 seconds for slower transition)
const PRODUCT_ROTATION_INTERVAL = 8000;

// Mock featured products data as fallback
const mockFeaturedProducts = featuredProducts;

export default function Index() {
  const { setSegment } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [trendingPhraseIndex, setTrendingPhraseIndex] = useState(0);
  
  // Fetch featured products from API
  const { products: apiProducts, loading: productsLoading } = useFeaturedProducts(20);
  
  // Use API products if available, fallback to mock data
  const allFeaturedProducts = useMemo(() => {
    if (apiProducts && apiProducts.length > 0) {
      return apiProducts;
    }
    return mockFeaturedProducts;
  }, [apiProducts]);
  
  // Product rotation control states
  const [isProductRotationPaused, setIsProductRotationPaused] = useState(false);
  const [isProductRotationStopped, setIsProductRotationStopped] = useState(false);
  
  // Animated heading index for service section
  const serviceHeadings = [
    "Why Shop With Us",
    "Our Service Promise",
    "Shopping Made Easy"
  ];
  const [serviceHeadingIndex, setServiceHeadingIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setServiceHeadingIndex((prev) => (prev + 1) % serviceHeadings.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter products based on active category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') {
      return allFeaturedProducts;
    }
    return allFeaturedProducts.filter(p => p.segment === activeCategory);
  }, [activeCategory, allFeaturedProducts]);

  // Featured product (left side large card)
  const featuredProduct = filteredProducts.length > 0 
    ? filteredProducts[featuredIndex % filteredProducts.length]
    : null;
  
  // Grid products (right side 2x2 grid) - exclude the featured one
  const gridProducts = filteredProducts.filter((_, i) => i !== (featuredIndex % filteredProducts.length)).slice(0, 4);

  // Auto-rotate featured product
  useEffect(() => {
    if (isProductRotationStopped || isProductRotationPaused) return;
    
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % filteredProducts.length);
    }, PRODUCT_ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, [filteredProducts.length, isProductRotationPaused, isProductRotationStopped]);

  // Reset featured index and rotation states when category changes
  useEffect(() => {
    setFeaturedIndex(0);
    setIsProductRotationPaused(false);
    setIsProductRotationStopped(false);
  }, [activeCategory]);

  // Rotate category phrases every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % categoryPhrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Rotate trending phrases every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingPhraseIndex((prev) => (prev + 1) % trendingPhrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Reset to default theme when on homepage
  useEffect(() => {
    setSegment('default');
  }, [setSegment]);

  // Auto-slide functionality
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleArrowClick = (direction) => {
    direction === 'prev' ? prevSlide() : nextSlide();
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Handler for temporary pause
  const handleTemporaryPause = useCallback((isPaused) => {
    if (!isProductRotationStopped) {
      setIsProductRotationPaused(isPaused);
    }
  }, [isProductRotationStopped]);

  // Handler for permanent stop
  const handlePermanentStop = useCallback(() => {
    setIsProductRotationStopped(true);
    setIsProductRotationPaused(false);
  }, []);

  const currentHero = heroSlides[currentSlide];

  // Animation variants
  const textVariants = {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
  };

  const imageVariants = {
    initial: { opacity: 0, x: 200, rotate: 25, scale: 0.5 },
    animate: { 
      opacity: 1, 
      x: 0, 
      rotate: -12, 
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: { opacity: 0, x: -100, rotate: -25, scale: 0.8 }
  };

  const dotVariants = {
    initial: { 
      opacity: 0, 
      scale: 0,
      x: 100,
      y: -50
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        delay: 0.6,
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    },
    exit: { opacity: 0, scale: 0 }
  };

  const priceTagVariants = {
    initial: { width: 0, opacity: 0 },
    animate: { 
      width: "auto", 
      opacity: 1,
      transition: {
        delay: 1.1,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: { width: 0, opacity: 0 }
  };

  const priceTextVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        delay: 1.4,
        duration: 0.3
      }
    },
    exit: { opacity: 0 }
  };

  const pricePulse = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 2
    }
  };

  return (
    <Layout>
      {/* Hero Section - Carousel Style */}
      <section className="relative min-h-[100svh] md:min-h-[85vh] bg-background overflow-hidden">
        {/* Infinite Grid Background with Floating Shoes */}
        <InfiniteGridBackground
          gridSize={50}
          speed={0.3}
          showBlurSpheres={true}
          floatingShoes={[
            // Mobile: fewer shoes, positioned carefully
            // Desktop: more visible positions
            {
              src: heroShoe1,
              alt: "Floating shoe 1",
              className: "w-16 md:w-24 lg:w-32 hidden md:block",
              delay: 0.5,
              duration: 6,
              initialPosition: { x: "5%", y: "15%" }
            },
            {
              src: heroShoe2,
              alt: "Floating shoe 2", 
              className: "w-12 md:w-20 lg:w-28 hidden lg:block",
              delay: 1,
              duration: 7,
              initialPosition: { x: "85%", y: "60%" }
            },
            {
              src: heroShoe3,
              alt: "Floating shoe 3",
              className: "w-14 md:w-20 lg:w-24 hidden md:block",
              delay: 1.5,
              duration: 5.5,
              initialPosition: { x: "75%", y: "10%" }
            },
            {
              src: heroShoe4,
              alt: "Floating shoe 4",
              className: "w-10 md:w-16 lg:w-20 hidden lg:block",
              delay: 2,
              duration: 6.5,
              initialPosition: { x: "10%", y: "70%" }
            },
            {
              src: heroShoe5,
              alt: "Floating shoe 5",
              className: "w-12 md:w-18 lg:w-24 hidden xl:block",
              delay: 0.8,
              duration: 5,
              initialPosition: { x: "88%", y: "35%" }
            },
          ]}
        />
        
        <div className="container h-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-0 md:gap-4 items-center min-h-[100svh] md:min-h-[85vh] py-2 md:py-4">
            {/* Left Content - Text */}
            <div className="relative z-10 order-2 lg:order-1 text-center lg:text-left mt-0 -translate-y-16 md:-translate-y-32 mb-0 pb-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-2 md:space-y-6"
                >
                  {/* Main Heading */}
                  <motion.h1 
                    variants={textVariants}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-3xl sm:text-4xl lg:text-7xl font-bold leading-tight text-foreground"
                  >
                    {currentHero.title.split(' ').slice(0, 2).join(' ')} 
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    <span className="text-foreground/80">{currentHero.title.split(' ').slice(2).join(' ')}</span>
                    <br />
                    <span className="text-foreground/60 text-xl sm:text-2xl lg:text-5xl">{currentHero.subtitle}</span>
                  </motion.h1>

                  {/* Brand Name */}
                  <motion.p 
                    variants={textVariants}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-lg sm:text-2xl lg:text-3xl font-display font-semibold text-primary"
                  >
                    {currentHero.brand}
                  </motion.p>

                  {/* CTA Button */}
                  <motion.div
                    variants={textVariants}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link to={currentHero.link}>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-6 py-4 md:px-8 md:py-6 text-base md:text-lg"
                      >
                        {currentHero.cta}
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Content - Shoe Image with Price */}
            <div className="relative flex items-center justify-center order-1 lg:order-2 mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="relative w-full max-w-[350px] sm:max-w-[450px] md:max-w-xl mx-auto"
                >
                  {/* Shoe Image */}
                  <motion.div
                    variants={imageVariants}
                    className="relative"
                  >
                    {/* Sparkle particles */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ 
                            opacity: [0, 1, 0], 
                            scale: [0, 1.5, 0],
                            x: [0, (i % 2 === 0 ? 30 : -30) * (i + 1)],
                            y: [0, (i % 3 === 0 ? -20 : 20) * (i + 1)]
                          }}
                          transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                          className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full"
                          style={{ 
                            top: `${30 + i * 10}%`, 
                            left: `${20 + i * 12}%` 
                          }}
                        />
                      ))}
                    </motion.div>

                    <motion.img
                      animate={{ 
                        y: [0, -15, 0],
                        rotate: [-12, -8, -12]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 1.5
                      }}
                      src={currentHero.image}
                      alt={currentHero.title}
                      className="w-full h-auto object-contain drop-shadow-2xl"
                    />
                    
                    {/* Floating shadow */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ 
                        opacity: [0.2, 0.3, 0.2],
                        scale: [0.9, 1, 0.9]
                      }}
                      transition={{ 
                        delay: 0.8,
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="absolute -bottom-2 md:-bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 md:h-6 bg-foreground/20 rounded-full blur-xl"
                    />
                  </motion.div>

                  {/* Price Tag Container */}
                  <div className="absolute top-1/4 md:top-1/3 left-0 z-20 flex items-center">
                    <motion.div 
                      variants={dotVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex items-center"
                    >
                      <motion.div
                        variants={priceTagVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="overflow-hidden"
                      >
                        <motion.div 
                          animate={pricePulse}
                          className="bg-destructive text-destructive-foreground px-3 py-2 md:px-6 md:py-3 rounded-l-lg font-display font-bold text-sm md:text-xl shadow-lg relative overflow-hidden whitespace-nowrap"
                        >
                          <motion.span
                            variants={priceTextVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="inline-block"
                          >
                            ₹ {currentHero.price.toLocaleString()}
                          </motion.span>
                          
                          {/* Shimmer effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: ['100%', '-100%'] }}
                            transition={{ duration: 1.5, delay: 1.6, repeat: Infinity, repeatDelay: 4 }}
                          ></motion.div>
                        </motion.div>
                      </motion.div>
                      
                      {/* Red dot */}
                      <motion.div 
                        className="w-3 h-3 md:w-5 md:h-5 bg-destructive rounded-full shadow-lg relative flex items-center justify-center"
                        animate={{ 
                          scale: [1, 1.3, 1],
                          boxShadow: [
                            '0 0 0 0 rgba(239, 68, 68, 0.4)',
                            '0 0 0 10px rgba(239, 68, 68, 0)',
                            '0 0 0 0 rgba(239, 68, 68, 0)'
                          ]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          delay: 1.5
                        }}
                      >
                        <motion.div 
                          className="w-1.5 h-1.5 md:w-2 md:h-2 bg-destructive-foreground rounded-full"
                          animate={{ scale: [1, 0.8, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Arrow Navigation */}
          <button
            onClick={() => handleArrowClick('prev')}
            className="absolute left-2 md:left-4 lg:left-8 top-1/3 md:top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-card hover:scale-110 transition-all duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={() => handleArrowClick('next')}
            className="absolute right-2 md:right-4 lg:right-8 top-1/3 md:top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-card hover:scale-110 transition-all duration-300"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Navigation Dots */}
          <div className="absolute bottom-28 md:bottom-48 left-1/2 transform -translate-x-1/2 flex items-center gap-2 md:gap-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide 
                    ? 'w-8 md:w-10 h-2 md:h-3 bg-destructive' 
                    : 'w-2 md:w-3 h-2 md:h-3 bg-muted-foreground/40 hover:bg-muted-foreground/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Brands Marquee */}
      <section className="mt-[-3rem] md:mt-[-4rem] mb-4 md:mb-8 pt-6 md:pt-8 bg-background/80 backdrop-blur-sm">
        <BrandsMarquee 
          brands={brandsData}
          speed={15}
          mobileSpeed={12}
          reverse
          pauseOnHover
          title="Our Trusted Footwear Brands"
          subtitle="Shop From The Best"
        />
      </section>

      {/* Shop by Category Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="container py-4 md:py-8"
      >
        {/* Top Divider Line */}
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="h-[2px] bg-foreground/40 mb-4 w-full"
          style={{ transformOrigin: 'left' }}
        />

        {/* Heading with rotating text */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="font-display text-3xl lg:text-4xl font-bold text-left mb-4"
        >
          <span className="relative h-[1.2em] overflow-hidden inline-flex items-center whitespace-nowrap min-w-[320px] md:min-w-[600px]">
            <AnimatePresence mode="wait">
              <motion.span 
                key={phraseIndex}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 text-[hsl(var(--navy-blue))]"
              >
                {categoryPhrases[phraseIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h2>

        {/* Bottom Divider Line */}
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="h-[2px] bg-foreground/40 mt-4 mb-3 w-full"
          style={{ transformOrigin: 'left' }}
        />
        
        {/* Subheading */}
        <span className="relative h-[1.2em] overflow-hidden inline-flex items-center whitespace-nowrap min-w-[220px] md:min-w-[350px] text-muted-foreground mt-1 mb-8">
          <AnimatePresence mode="wait">
            <motion.span 
              key={phraseIndex}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0"
            >
              {categorySubPhrases[phraseIndex]}
            </motion.span>
          </AnimatePresence>
        </span>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          {segments.map((seg, i) => (
            <motion.div
              key={seg.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                delay: 0.4 + i * 0.15, 
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <Link to={`/${seg.id}`} className="group block relative h-28 md:h-80 rounded-lg md:rounded-2xl overflow-hidden card-hover">
                <img src={seg.image} alt={seg.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className={`absolute inset-0 ${seg.color} opacity-35`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="font-display text-sm md:text-4xl font-bold text-white drop-shadow-lg">{seg.label}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Trust Features Section */}
      <section className="py-6 md:py-16 overflow-hidden">
        <div className="container">
          {/* Top Divider Line */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="h-[2px] bg-foreground/40 mb-4 w-full"
            style={{ transformOrigin: 'left' }}
          />
          
          {/* Animated heading */}
          <span className="relative h-[1.2em] overflow-hidden inline-flex items-center whitespace-nowrap min-w-[200px] font-display text-3xl lg:text-4xl font-bold text-left mb-4">
            <AnimatePresence mode="wait">
              <motion.span 
                key={serviceHeadingIndex}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-[hsl(var(--navy-blue))]"
              >
                {serviceHeadings[serviceHeadingIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
          
          {/* Bottom Divider Line */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-[2px] bg-foreground/40 mt-0 mb-3 w-full"
            style={{ transformOrigin: 'left' }}
          />
          
          {/* Subheading */}
          <span className="relative h-[1.2em] overflow-hidden inline-flex items-center whitespace-nowrap min-w-[180px] md:min-w-[300px] text-muted-foreground mt-1 mb-6">
            <AnimatePresence mode="wait">
              <motion.span 
                key={serviceHeadingIndex}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className=""
              >
                {serviceHeadingIndex === 0 && "Trusted by thousands"}
                {serviceHeadingIndex === 1 && "Hassle-free shopping"}
                {serviceHeadingIndex === 2 && "Fast delivery & support"}
              </motion.span>
            </AnimatePresence>
          </span>
          
          <div className="grid grid-cols-4 gap-2 md:gap-6">
            {[
              { 
                icon: Truck, 
                title: "Free Delivery", 
                mobileTitle: "Free Ship",
                description: "Free shipping all over India",
                mobileDesc: "Pan India",
                subtext: "Min. order ₹100",
                mobileSubtext: "Min ₹100"
              },
              { 
                icon: Headset, 
                title: "24/7 Support", 
                mobileTitle: "24/7 Help",
                description: "Always here to help you",
                mobileDesc: "Anytime",
                subtext: "Call, chat or email anytime",
                mobileSubtext: "Call/Chat"
              },
              { 
                icon: ShieldCheck, 
                title: "Easy Returns", 
                mobileTitle: "Returns",
                description: "72-hour hassle-free returns",
                mobileDesc: "72 Hours",
                subtext: "For wrong item, size or damage",
                mobileSubtext: "If issues"
              },
              { 
                icon: CreditCard, 
                title: "Secure Payments", 
                mobileTitle: "Secure Pay",
                description: "100% encrypted transactions",
                mobileDesc: "100% Safe",
                subtext: "All major cards & UPI accepted",
                mobileSubtext: "Cards & UPI"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group animated-border-card bg-card p-2 md:p-6 text-center cursor-pointer"
              >
                <div className="relative z-10">
                  <motion.div 
                    className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 rounded-full bg-white dark:bg-white/10 border border-[#C9A24D]/30 flex items-center justify-center group-hover:bg-[#C9A24D]/10 transition-colors duration-300"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <feature.icon className="w-5 h-5 md:w-8 md:h-8 text-[#C9A24D] group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                  </motion.div>
                  <h3 className="font-semibold text-[9px] md:text-lg mb-0.5 md:mb-2 group-hover:text-[#C9A24D] transition-colors duration-300 whitespace-nowrap">
                    <span className="hidden md:inline">{feature.title}</span>
                    <span className="md:hidden">{feature.mobileTitle}</span>
                  </h3>
                  <p className="text-muted-foreground text-[7px] md:text-sm group-hover:text-muted-foreground/80 transition-colors duration-300 whitespace-nowrap">
                    <span className="hidden md:inline">{feature.description}</span>
                    <span className="md:hidden">{feature.mobileDesc}</span>
                  </p>
                  <p className="text-muted-foreground/70 text-[6px] md:text-xs mt-0.5 md:mt-1 group-hover:text-muted-foreground/60 transition-colors duration-300 whitespace-nowrap">
                    <span className="hidden md:inline">{feature.subtext}</span>
                    <span className="md:hidden">{feature.mobileSubtext}</span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Trending Now */}
      <section className="bg-gradient-to-b from-accent/5 via-background to-background py-0 md:py-16">
        <div className="container">
          {/* Top Divider Line */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="h-[2px] bg-foreground/40 mb-4 w-full"
            style={{ transformOrigin: 'left' }}
          />
          
          {/* Animated Heading */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="font-display text-3xl lg:text-4xl font-bold text-left mb-4"
          >
            <span className="relative h-[1.2em] overflow-hidden inline-flex items-center whitespace-nowrap min-w-[240px] md:min-w-[450px]">
              <AnimatePresence mode="wait">
                <motion.span 
                  key={trendingPhraseIndex}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 text-[hsl(var(--navy-blue))]"
                >
                  {trendingPhrases[trendingPhraseIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h2>
          
          {/* Bottom Divider Line */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-[2px] bg-foreground/40 mt-0 mb-3 w-full"
            style={{ transformOrigin: 'left' }}
          />
          
          <p className="text-muted-foreground mt-1 mb-4">{trendingSubPhrases[trendingPhraseIndex]}</p>
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-[#F3F4F6] dark:bg-card rounded-full p-1.5 border border-border/50 shadow-sm w-fit mb-8">
            {trendingCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 md:px-5 md:py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-[#1C1C1C] text-white shadow-md dark:bg-white dark:text-[#1C1C1C]'
                    : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] dark:bg-transparent dark:text-muted-foreground dark:hover:bg-muted/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {productsLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading products...</span>
            </div>
          )}

          {/* Hybrid Layout: Featured Card and Grid */}
          {!productsLoading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6"
            >
              {/* Large Featured Product (Hero Card) */}
              <div>
                <div className="featured-glow">
                  <AnimatePresence mode="wait">
                    {featuredProduct && (
                      <motion.div
                        key={featuredProduct.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                      >
                        <FlipCard 
                          product={featuredProduct} 
                          size="large" 
                          index={0} 
                          onTemporaryPause={handleTemporaryPause}
                          onPermanentStop={handlePermanentStop}
                          isPaused={isProductRotationPaused}
                          isStopped={isProductRotationStopped}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Featured product indicator dots */}
                <div className="flex justify-center items-center gap-2 mt-4">
                  {filteredProducts.slice(0, 5).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setFeaturedIndex(i);
                        if (!isProductRotationStopped) {
                          setIsProductRotationPaused(true);
                          setTimeout(() => setIsProductRotationPaused(false), 10000);
                        }
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        (featuredIndex % filteredProducts.length) === i
                          ? 'w-6 bg-accent'
                          : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Grid of Smaller Products */}
              <div>
                <div className="grid gap-4 justify-center grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {gridProducts.map((product, i) => (
                    <FlipCard key={product.id} product={product} size="small" index={i + 1} />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          )}

          {/* View All Link */}
          <div className="flex justify-center mt-10">
            <Link to="/products">
              <Button variant="outline" size="lg" className="gap-2 px-8">
                View All Products
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="container py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-gold font-medium">Our Legacy</span>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mt-2 mb-6">30 Years of Trust</h2>
            <p className="text-muted-foreground text-lg mb-6">
              From a single store in Jodhpur to becoming a trusted name across India, HC Fashion House has been your partner in style for three decades.
            </p>
            <Link to="/about">
              <Button variant="outline" size="lg" className="gap-2">Learn Our Story <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80" alt="Store" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-gold text-foreground p-6 rounded-xl shadow-xl">
              <span className="font-display text-4xl font-bold">30+</span>
              <p className="text-sm">Years of Excellence</p>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}