import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

export default function Wishlist() {
  const { items, removeItem, clearAll } = useWishlist();
  const { addItem } = useCart();

  const handleMoveToCart = (product) => {
    addItem({ ...product, quantity: 1 });
    removeItem(product.id);
    toast.success('Moved to cart!');
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Heart className="w-24 h-24 mx-auto text-muted-foreground/30 mb-6" />
            </motion.div>
            <h1 className="font-display text-3xl font-bold mb-4">Your Wishlist is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Save items you love by clicking the heart icon on products.
            </p>
            <Link to="/">
              <Button size="lg" className="btn-premium">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">My Wishlist</h1>
            <p className="text-muted-foreground mt-1">{items.length} items saved</p>
          </div>
          <Button variant="outline" onClick={clearAll}>
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative bg-card rounded-xl overflow-hidden border border-border"
            >
              <Link to={`/product/${product.id}`}>
                <div className="aspect-square bg-muted overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </Link>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(product.id)}
                className="absolute top-3 right-3 w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="p-4">
                <p className="text-sm text-muted-foreground">{product.brand}</p>
                <h3 className="font-product font-bold text-[#36454F] dark:text-[#E8E8E8] truncate">{product.name}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display font-bold">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full mt-3 gap-2"
                  onClick={() => handleMoveToCart(product)}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Move to Cart
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
