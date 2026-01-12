import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import { getImageProps } from '@/utils/imageUtils';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal, itemCount, getStockForVariant } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[85%] max-w-[420px] bg-white dark:bg-[#0B0F19] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] dark:border-[#1F2937]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[#1C1C1C] dark:text-[#F9FAFB]" />
                <h2 className="font-display text-xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">Your Cart</h2>
                <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-[#6B7280] hover:text-[#1C1C1C] dark:text-[#9CA3AF] dark:hover:text-[#F9FAFB] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-[#F3F4F6] dark:bg-[#1F2937] flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-[#9CA3AF] dark:text-[#6B7280]" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-6 text-sm">
                    Looks like you haven't added anything yet
                  </p>
                  <Link to="/products" onClick={() => setIsOpen(false)}>
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                      Start Shopping
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${item.selectedSize?.uk}-${item.selectedColor}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 p-4 bg-[#F9FAFB] dark:bg-[#1F2937] rounded-xl"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-[#E5E7EB] dark:bg-[#374151] rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] truncate text-sm">
                          {item.name}
                        </h4>
                        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                          {item.brand}
                        </p>
                        <p className="text-xs text-[#9CA3AF] dark:text-[#6B7280] mt-1">
                          {item.selectedColor} • Size {item.selectedSize?.uk || 'One Size'}
                        </p>
                        
                        {/* Price & Quantity Row */}
                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#374151] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#C9A24D] hover:text-[#C9A24D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#E5E7EB] disabled:hover:text-[#6B7280]"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                              disabled={item.quantity >= getStockForVariant(item.id, item.selectedColor, item.selectedSize?.uk)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#374151] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#C9A24D] hover:text-[#C9A24D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#E5E7EB] disabled:hover:text-[#6B7280]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            {item.quantity >= getStockForVariant(item.id, item.selectedColor, item.selectedSize?.uk) && (
                              <span className="text-[10px] text-orange-500 ml-1">Max</span>
                            )}
                          </div>
                          
                          {/* Price */}
                          <p className="font-semibold text-[#111827] dark:text-[#F9FAFB]">
                            ₹{item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)}
                        className="self-start p-1.5 text-[#9CA3AF] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[#E5E7EB] dark:border-[#1F2937] p-5 space-y-4 bg-white dark:bg-[#0B0F19]">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280] dark:text-[#9CA3AF] font-medium">Subtotal</span>
                  <span className="font-display text-xl font-bold text-[#111827] dark:text-[#F9FAFB]">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>
                
                <p className="text-xs text-[#9CA3AF] dark:text-[#6B7280]">
                  Shipping & taxes calculated at checkout
                </p>
                
                {/* Checkout Button */}
                <Link to="/checkout" onClick={() => setIsOpen(false)} className="block">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    Proceed to Checkout
                  </motion.button>
                </Link>
                
                {/* Continue Shopping */}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 text-center text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#C9A24D] transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
