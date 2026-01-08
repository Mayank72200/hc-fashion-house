import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  ChevronDown,
  Phone,
  Headphones,
  Zap,
  Package,
  LogOut
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', href: '/' },
  { 
    label: 'Men', 
    href: '/men',
    segment: 'men',
  },
  { 
    label: 'Women', 
    href: '/women',
    segment: 'women',
  },
  { 
    label: 'Kids', 
    href: '/kids',
    segment: 'kids',
  },
  { 
    label: 'Brands', 
    href: '/brands',
    children: [
      { label: 'Nike', href: '/brands/nike' },
      { label: 'Adidas', href: '/brands/adidas' },
      { label: 'Puma', href: '/brands/puma' },
      { label: 'Reebok', href: '/brands/reebok' },
      { label: 'Campus', href: '/brands/campus' },
      { label: 'JQR', href: '/brands/jqr' },
    ],
  },
  { label: 'New Arrivals', href: '/new-arrivals' },
  { label: 'Ongoing Offers', href: '/sale', highlight: true },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const { theme, setSegment } = useTheme();
  const { isAuthenticated, signOut } = useAuth();
  const { setIsOpen: setCartOpen, itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [location]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle user icon click
  const handleUserIconClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setIsUserDropdownOpen(!isUserDropdownOpen);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut();
    setIsUserDropdownOpen(false);
    navigate('/');
  };

  const handleSegmentClick = (segment) => {
    if (segment) {
      setSegment(segment);
    }
  };

  const isActiveLink = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled 
            ? 'shadow-lg' 
            : ''
        )}
      >
        {/* Row 1: Marquee Sale Banner */}
        <div className="top-marquee-bar py-2 text-primary-foreground text-sm">
          <div className="marquee-content">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="flex items-center mx-8">
                <Zap className="w-4 h-4 mr-2 text-yellow-300" />
                <span className="font-medium">Flat 30% Sale Going On Selected Products.</span>
              </span>
            ))}
            {[...Array(4)].map((_, i) => (
              <span key={`dup-${i}`} className="flex items-center mx-8">
                <Zap className="w-4 h-4 mr-2 text-yellow-300" />
                <span className="font-medium">Flat 30% Sale Going On Selected Products.</span>
              </span>
            ))}
          </div>
        </div>

        {/* Row 2: Logo, Search, Actions */}
        <div className={cn(
          'transition-colors duration-300',
          theme === 'dark' ? 'bg-card' : 'bg-background'
        )}>
          <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 py-4">
            <div className="flex items-center justify-between gap-4 lg:gap-8">
              {/* Left side: Hamburger + Logo */}
              <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle - Now on Left */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden hover:bg-accent/10"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </Button>

                {/* Logo */}
                <Link 
                  to="/" 
                  className="flex-shrink-0"
                  onClick={() => setSegment('default')}
                >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1"
                >
                  {/* HC with stable yellowish gold look */}
                  <span className="font-logo text-4xl lg:text-5xl font-bold logo-hc">
                    HC
                  </span>
                  
                  {/* Fashion House stacked with 5-second animation */}
                  <div className="flex flex-col leading-none ml-1 overflow-hidden">
                    <motion.span 
                      className="font-logo text-xs lg:text-sm font-semibold tracking-[0.2em] text-foreground uppercase"
                      animate={{ 
                        letterSpacing: ['0.2em', '0.3em', '0.2em'],
                        opacity: [1, 0.7, 1],
                      }}
                      transition={{ 
                        duration: 0.8,
                        repeat: Infinity,
                        repeatDelay: 4.2,
                        ease: "easeInOut"
                      }}
                    >
                      Fashion
                    </motion.span>
                    <motion.span 
                      className="font-logo text-xs lg:text-sm font-semibold tracking-[0.2em] text-foreground uppercase"
                      animate={{ 
                        letterSpacing: ['0.2em', '0.3em', '0.2em'],
                        opacity: [1, 0.7, 1],
                      }}
                      transition={{ 
                        duration: 0.8,
                        delay: 0.15,
                        repeat: Infinity,
                        repeatDelay: 4.2,
                        ease: "easeInOut"
                      }}
                    >
                      House
                    </motion.span>
                  </div>
                </motion.div>
              </Link>
              </div>

              {/* Search Bar - Desktop */}
              <div className="hidden md:flex flex-1 mx-6">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What are you looking for?"
                    className={cn(
                      'w-full py-3 px-6 pr-14 rounded-lg border transition-all duration-300',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                      theme === 'dark' 
                        ? 'bg-background border-border text-foreground placeholder:text-muted-foreground' 
                        : 'bg-card border-border text-foreground placeholder:text-muted-foreground'
                    )}
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-foreground text-background rounded-md hover:opacity-90 transition-opacity">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-6 ml-auto flex-shrink-0">

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User with Dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-accent/10 h-9 w-9 sm:h-10 sm:w-10"
                    onClick={handleUserIconClick}
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {isUserDropdownOpen && isAuthenticated && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          'absolute right-0 top-full mt-2 w-[260px] rounded-xl shadow-xl border overflow-hidden z-50',
                          theme === 'dark'
                            ? 'bg-[#111827] border-[#1F2937]'
                            : 'bg-white border-gray-200'
                        )}
                      >
                        <div className="py-2">
                          <Link
                            to="/account"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 transition-colors',
                              theme === 'dark'
                                ? 'text-[#F9FAFB] hover:bg-[#1F2937]'
                                : 'text-[#1C1C1C] hover:bg-[#F3F4F6]'
                            )}
                          >
                            <User className="w-5 h-5 text-[#9CA3AF]" />
                            <span className="font-medium">My Account</span>
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 transition-colors',
                              theme === 'dark'
                                ? 'text-[#F9FAFB] hover:bg-[#1F2937]'
                                : 'text-[#1C1C1C] hover:bg-[#F3F4F6]'
                            )}
                          >
                            <Package className="w-5 h-5 text-[#9CA3AF]" />
                            <span className="font-medium">My Orders</span>
                          </Link>
                          <div className={cn(
                            'my-2 border-t',
                            theme === 'dark' ? 'border-[#1F2937]' : 'border-gray-200'
                          )} />
                          <button
                            onClick={handleLogout}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 w-full transition-colors',
                              theme === 'dark'
                                ? 'text-[#F9FAFB] hover:bg-[#1F2937]'
                                : 'text-[#1C1C1C] hover:bg-[#F3F4F6]'
                            )}
                          >
                            <LogOut className="w-5 h-5 text-[#9CA3AF]" />
                            <span className="font-medium">Log Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Wishlist */}
                <Link to="/wishlist">
                  <Button variant="ghost" size="icon" className="relative hover:bg-accent/10 h-9 w-9 sm:h-10 sm:w-10">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                    {wishlistCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-destructive text-destructive-foreground text-[10px] sm:text-xs rounded-full flex items-center justify-center"
                      >
                        {wishlistCount}
                      </motion.span>
                    )}
                  </Button>
                </Link>

                {/* Cart */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative hover:bg-accent/10 h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[hsl(var(--gold))] text-background text-[10px] sm:text-xs rounded-full flex items-center justify-center font-medium"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Navigation Links */}
        <nav className={cn(
          'hidden lg:block transition-colors duration-300 border-t border-border',
          theme === 'dark' ? 'bg-card' : 'bg-background'
        )}>
          <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16">
            <div className="flex items-center justify-center gap-8 py-3">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    to={link.href}
                    onClick={() => handleSegmentClick(link.segment)}
                    className={cn(
                      'flex items-center gap-1 font-medium transition-colors py-2 text-sm uppercase tracking-wide',
                      link.highlight 
                        ? 'text-destructive font-semibold flex items-center gap-2' 
                        : isActiveLink(link.href)
                          ? 'text-[hsl(var(--gold))]'
                          : 'text-foreground hover:text-[hsl(var(--gold))]'
                    )}
                  >
                    {link.label}
                    {link.children && <ChevronDown className="w-4 h-4" />}
                    {link.highlight && (
                      <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                        Sale
                      </span>
                    )}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {link.children && activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-card rounded-lg shadow-xl border border-border overflow-hidden z-50"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            to={child.href}
                            className="block px-4 py-3 hover:bg-accent/10 transition-colors text-foreground hover:text-[hsl(var(--gold))]"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
          
          {/* Segment Accent Line */}
          <div className="navbar-accent-line h-[2px] w-full transition-opacity duration-200 ease-out" />
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-background shadow-2xl p-6 pt-32 overflow-y-auto">
              {/* Mobile Search */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What are you looking for?"
                    className="w-full py-3 px-4 pr-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-foreground text-background rounded-md">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <nav className="flex flex-col gap-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      onClick={() => {
                        handleSegmentClick(link.segment);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        'flex items-center justify-between py-3 text-base font-medium border-b border-border transition-colors',
                        link.highlight 
                          ? 'text-destructive' 
                          : isActiveLink(link.href)
                            ? 'text-[hsl(var(--gold))]'
                            : 'text-foreground hover:text-[hsl(var(--gold))]'
                      )}
                    >
                      <span>{link.label}</span>
                      {link.highlight && (
                        <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                          Sale
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Need Help - Mobile */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <Headphones className="w-8 h-8 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">NEED HELP?</p>
                    <p className="text-muted-foreground">0123-456-789</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link 
                  to="/account/login"
                  className="block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-light))] text-background" size="lg">
                    Sign In / Register
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-[100px] lg:h-[160px]" />
    </>
  );
}
