import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const CartContext = createContext(undefined);

// Stock inventory - tracks available quantity per product variant (color + size)
// In production, this would come from an API/database
const stockInventory = {
  // Product ID -> Color -> Size (UK) -> Available Stock
  // Default stock for products not explicitly listed
  _default: 10,
};

// Get available stock for a specific variant
export const getStockForVariant = (productId, color, sizeUk) => {
  // Check if there's specific inventory for this product
  if (stockInventory[productId]?.[color]?.[sizeUk] !== undefined) {
    return stockInventory[productId][color][sizeUk];
  }
  // Return default stock
  return stockInventory._default;
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hc-cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('hc-cart', JSON.stringify(items));
  }, [items]);

  // Get quantity of a specific variant already in cart
  const getCartQuantity = (productId, sizeUk, color) => {
    const item = items.find(
      (item) => 
        item.id === productId && 
        item.selectedSize?.uk === sizeUk &&
        item.selectedColor === color
    );
    return item?.quantity || 0;
  };

  // Check if can add more of this variant
  const canAddToCart = (productId, sizeUk, color, quantityToAdd = 1) => {
    const currentInCart = getCartQuantity(productId, sizeUk, color);
    const availableStock = getStockForVariant(productId, color, sizeUk);
    return (currentInCart + quantityToAdd) <= availableStock;
  };

  // Get remaining stock for a variant (considering cart)
  const getRemainingStock = (productId, sizeUk, color) => {
    const currentInCart = getCartQuantity(productId, sizeUk, color);
    const availableStock = getStockForVariant(productId, color, sizeUk);
    return Math.max(0, availableStock - currentInCart);
  };

  const addItem = (product) => {
    const { id, selectedSize, selectedColor, quantity = 1 } = product;
    const sizeUk = selectedSize?.uk;
    
    // Stock validation
    const currentInCart = getCartQuantity(id, sizeUk, selectedColor);
    const availableStock = getStockForVariant(id, selectedColor, sizeUk);
    const maxCanAdd = availableStock - currentInCart;

    if (maxCanAdd <= 0) {
      toast.error(`Sorry, this item is out of stock`);
      return false;
    }

    if (quantity > maxCanAdd) {
      toast.error(`Only ${maxCanAdd} more available in stock`);
      return false;
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === id && 
          item.selectedSize?.uk === sizeUk &&
          item.selectedColor === selectedColor
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [...prev, { ...product, quantity }];
    });
    
    return true;
  };

  const removeItem = (productId, selectedSize, selectedColor) => {
    setItems((prev) => prev.filter((item) => 
      !(item.id === productId && 
        item.selectedSize?.uk === selectedSize?.uk && 
        item.selectedColor === selectedColor)
    ));
  };

  const updateQuantity = (productId, selectedSize, selectedColor, quantity) => {
    if (quantity < 1) {
      removeItem(productId, selectedSize, selectedColor);
      return true;
    }

    const sizeUk = selectedSize?.uk;
    const availableStock = getStockForVariant(productId, selectedColor, sizeUk);

    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} available in stock`);
      return false;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === productId && 
        item.selectedSize?.uk === sizeUk && 
        item.selectedColor === selectedColor
          ? { ...item, quantity }
          : item
      )
    );
    
    return true;
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savings = items.reduce((sum, item) => {
    if (item.originalPrice) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);

  const value = {
    items,
    isOpen,
    setIsOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    savings,
    // Stock helpers
    getCartQuantity,
    canAddToCart,
    getRemainingStock,
    getStockForVariant,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
