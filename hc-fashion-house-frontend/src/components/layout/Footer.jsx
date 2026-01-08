import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Facebook, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  ArrowRight,
  Heart,
  ChevronUp,
  ShoppingBag,
  Users,
  Baby,
  Sparkles,
  Tag,
  MessageCircle,
  HelpCircle,
  Truck,
  RotateCcw,
  Ruler,
  Package,
  Building2,
  BookOpen,
  Map,
  Newspaper,
  Shield,
  FileText,
  CreditCard,
  Banknote,
  Wallet,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const footerLinks = {
  shop: [
    { name: 'Men', href: '/men', icon: Users },
    { name: 'Women', href: '/women', icon: Users },
    { name: 'Kids', href: '/kids', icon: Baby },
    { name: 'New Arrivals', href: '/new-arrivals', icon: Sparkles },
    { name: 'Sale', href: '/sale', icon: Tag },
  ],
  support: [
    { name: 'Contact Us', href: '/contact', icon: MessageCircle },
    { name: 'FAQs', href: '/faqs', icon: HelpCircle },
    { name: 'Shipping Info', href: '/shipping', icon: Truck },
    { name: 'Returns & Exchanges', href: '/returns', icon: RotateCcw },
    { name: 'Size Guide', href: '/size-guide', icon: Ruler },
    { name: 'Track Order', href: '/track-order', icon: Package },
  ],
  company: [
    { name: 'About Us', href: '/about', icon: Building2 },
    { name: 'Store Locator', href: '/stores', icon: Map },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy', icon: Shield },
    { name: 'Terms of Service', href: '/terms', icon: FileText },
  ],
};

const socialLinks = [
  { 
    name: 'Facebook', 
    icon: Facebook, 
    href: 'https://facebook.com/hcfashion', 
    bgColor: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    followers: '25K'
  },
  { 
    name: 'Instagram', 
    icon: Instagram, 
    href: 'https://instagram.com/hcfashion', 
    bgColor: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    hoverColor: 'hover:opacity-90',
    followers: '50K'
  },
];

const paymentMethods = [
  { name: 'Visa', icon: CreditCard },
  { name: 'Mastercard', icon: CreditCard },
  { name: 'UPI', icon: Wallet },
  { name: 'COD', icon: Banknote },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubscribing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Thank you for subscribing! 🎉');
    setEmail('');
    setIsSubscribing(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#F3F4F6] dark:bg-[#0B0F19] border-t border-border overflow-hidden">
      {/* Decorative Background Elements - Light mode only */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden dark:hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Newsletter Section */}
      <div className="relative border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-transparent dark:via-transparent dark:to-transparent" />
        <div className="container relative py-10 md:py-14">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Newsletter Text */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex-1 text-center lg:text-left"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Mail className="w-4 h-4" />
                  Newsletter
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Stay in the Loop
                </h3>
                <p className="text-muted-foreground text-sm md:text-base max-w-md">
                  Subscribe for exclusive offers, new arrivals & 10% off your first order!
                </p>
              </motion.div>

              {/* Newsletter Form */}
              <motion.form 
                onSubmit={handleNewsletterSubmit} 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-1 w-full max-w-md"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 bg-white dark:bg-background border-[#D1D5DB] dark:border-border focus:border-primary rounded-xl"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="h-12 px-6 gap-2 rounded-xl shadow-lg shadow-primary/20"
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      />
                    ) : (
                      <>
                        Subscribe
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 text-center sm:text-left">
                  By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
                </p>
              </motion.form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container relative py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-6">
          
          {/* Brand Column - Takes more space */}
          <div className="col-span-2 md:col-span-3 lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold">
                <span className="text-primary">HC</span>
                <span className="text-[#1F2937] dark:text-foreground"> Fashion</span>
              </h2>
            </Link>
            
            <p className="text-[#6B7280] dark:text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
              Your trusted destination for premium footwear since 1994. Step into style with our curated collection of shoes for men, women & kids.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <a 
                href="tel:+919876543210" 
                className="flex items-center gap-3 text-sm text-[#6B7280] dark:text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-muted/80 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Phone className="w-4 h-4 text-[#9CA3AF] dark:text-inherit" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] dark:text-muted-foreground/70 uppercase tracking-wider">Call Us</p>
                  <p className="font-medium text-[#1F2937] dark:text-foreground group-hover:text-primary transition-colors">+91 98765 43210</p>
                </div>
              </a>
              
              <a 
                href="mailto:support@hcfashion.com" 
                className="flex items-center gap-3 text-sm text-[#6B7280] dark:text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-muted/80 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Mail className="w-4 h-4 text-[#9CA3AF] dark:text-inherit" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] dark:text-muted-foreground/70 uppercase tracking-wider">Email Us</p>
                  <p className="font-medium text-[#1F2937] dark:text-foreground group-hover:text-primary transition-colors">support@hcfashion.com</p>
                </div>
              </a>
              
              <div className="flex items-start gap-3 text-sm text-[#6B7280] dark:text-muted-foreground">
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-muted/80 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-[#9CA3AF] dark:text-inherit" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] dark:text-muted-foreground/70 uppercase tracking-wider">Visit Us</p>
                  <p className="font-medium text-[#1F2937] dark:text-foreground text-xs leading-relaxed">123 Fashion Street, Mumbai, Maharashtra 400001</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-[#6B7280] dark:text-muted-foreground">
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-muted/80 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#9CA3AF] dark:text-inherit" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] dark:text-muted-foreground/70 uppercase tracking-wider">Working Hours</p>
                  <p className="font-medium text-[#1F2937] dark:text-foreground text-xs">Mon - Sat: 10AM - 9PM</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-xs font-semibold text-[#1F2937] dark:text-foreground uppercase tracking-wider mb-3">Follow Us</p>
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-all duration-300 ${social.bgColor} ${social.hoverColor} shadow-lg`}
                    aria-label={social.name}
                  >
                    <social.icon className="w-5 h-5" />
                    <div className="hidden sm:block">
                      <p className="text-xs font-semibold">{social.name}</p>
                      <p className="text-[10px] opacity-80">{social.followers} followers</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="font-semibold text-[#1F2937] dark:text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Shop
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-sm text-[#6B7280] dark:text-muted-foreground hover:text-primary transition-all duration-200 inline-flex items-center gap-2 group"
                  >
                    <link.icon className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-inherit opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="font-semibold text-[#1F2937] dark:text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Support
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-sm text-[#6B7280] dark:text-muted-foreground hover:text-primary transition-all duration-200 inline-flex items-center gap-2 group"
                  >
                    <link.icon className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-inherit opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal Links */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="font-semibold text-[#1F2937] dark:text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Company
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-sm text-[#6B7280] dark:text-muted-foreground hover:text-primary transition-all duration-200 inline-flex items-center gap-2 group"
                  >
                    <link.icon className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-inherit opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Legal */}
            <h4 className="font-semibold text-[#1F2937] dark:text-foreground mb-4 mt-6 text-sm uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Legal
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-sm text-[#6B7280] dark:text-muted-foreground hover:text-primary transition-all duration-200 inline-flex items-center gap-2 group"
                  >
                    <link.icon className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-inherit opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment & Trust Section */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <h4 className="font-semibold text-[#1F2937] dark:text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              We Accept
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {paymentMethods.map((method) => (
                <div 
                  key={method.name}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-muted/50 rounded-lg border border-[#D1D5DB] dark:border-border/50"
                >
                  <method.icon className="w-4 h-4 text-[#9CA3AF] dark:text-muted-foreground" />
                  <span className="text-xs font-medium text-[#1F2937] dark:text-foreground">{method.name}</span>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-muted-foreground">
                <Shield className="w-4 h-4 text-green-500" />
                <span>100% Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-muted-foreground">
                <Truck className="w-4 h-4 text-blue-500" />
                <span>Free Shipping Over ₹999</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-muted-foreground">
                <RotateCcw className="w-4 h-4 text-orange-500" />
                <span>72-Hour Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-[#D1D5DB] dark:border-white/10 bg-white/50 dark:bg-white/5">
        <div className="container py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-[#6B7280] dark:text-muted-foreground text-center sm:text-left">
              <p className="flex items-center gap-1.5">
                <span>©</span>
                <span>{currentYear}</span>
                <span className="font-semibold text-[#1F2937] dark:text-foreground">HC Fashion House</span>
              </p>
              <span className="hidden sm:inline text-[#D1D5DB] dark:text-border">|</span>
              <p>All rights reserved.</p>
            </div>

            {/* Made with Love */}
            <div className="flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-muted-foreground">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
              <span>in</span>
              <span className="font-semibold text-[#1F2937] dark:text-foreground">India 🇮🇳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <motion.button
        onClick={scrollToTop}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl transition-all"
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-6 h-6" />
      </motion.button>
    </footer>
  );
}