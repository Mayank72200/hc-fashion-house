import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(undefined);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hc-wishlist');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('hc-wishlist', JSON.stringify(items));
  }, [items]);

  const addItem = (product) => {
    setItems(prev => {
      if (prev.some(item => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const toggleItem = (product) => {
    if (isInWishlist(product.id)) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  };

  const isInWishlist = (productId) => {
    return items.some(item => item.id === productId);
  };

  const clearAll = () => {
    setItems([]);
  };

  const value = {
    items,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearAll,
    itemCount: items.length,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
