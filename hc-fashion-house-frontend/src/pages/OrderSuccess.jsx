import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Mail, ArrowRight, ShoppingBag, Home } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const orderData = location.state?.orderData;

  // If no order data, redirect to home
  useEffect(() => {
    if (!orderData) {
      navigate('/', { replace: true });
    }
  }, [orderData, navigate]);

  if (!orderData) {
    return null;
  }

  const { orderId, email, subtotal } = orderData;

  return (
    <div className="min-h-screen bg-[#FAF9F7] dark:bg-[#0B0F19] transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-[#10B981]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-12 sm:py-20">
        {/* Success Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 p-8 sm:p-10 text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 relative"
          >
            <div className="absolute inset-0 bg-[#10B981]/10 rounded-full animate-ping" />
            <div className="absolute inset-0 bg-[#10B981]/20 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-[#10B981]" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-display text-2xl sm:text-3xl font-bold text-[#1C1C1C] dark:text-[#F9FAFB] mb-3"
          >
            Order Placed Successfully!
          </motion.h1>

          {/* Order ID */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] dark:bg-[#1F2937] rounded-full mb-6"
          >
            <Package className="w-4 h-4 text-[#C9A24D]" />
            <span className="text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
              Order ID: <span className="font-mono">{orderId}</span>
            </span>
          </motion.div>

          {/* Amount */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-lg text-[#6B7280] dark:text-[#9CA3AF] mb-8"
          >
            Total Amount: <span className="font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">₹{subtotal?.toLocaleString()}</span>
          </motion.p>

          {/* Email notification info */}
          {email ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-3 p-4 bg-[#C9A24D]/5 dark:bg-[#C9A24D]/10 rounded-xl mb-8"
            >
              <Mail className="w-5 h-5 text-[#C9A24D] shrink-0" />
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] text-left">
                Order details will be sent to <span className="font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">{email}</span>
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-4 bg-[#F3F4F6] dark:bg-[#1F2937] rounded-xl mb-8"
            >
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                You checked out as a guest. To track your order later, you can verify your email in My Account.
              </p>
            </motion.div>
          )}

          {/* Track Order CTA - Only show if not authenticated */}
          {!isAuthenticated && email && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="mb-8"
            >
              <div className="p-4 border border-dashed border-[#C9A24D]/30 rounded-xl bg-[#C9A24D]/5 dark:bg-[#C9A24D]/10">
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mb-3">
                  Want to track your order later? Use email verification to access your orders.
                </p>
                <Link to="/login" state={{ email, returnTo: '/orders' }}>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#C9A24D] hover:bg-[#C9A24D]/10 rounded-lg transition-colors"
                  >
                    Verify Email & Track Order
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isAuthenticated && (
              <Link to="/orders" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-6 py-3 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  View My Orders
                </motion.button>
              </Link>
            )}
            
            <Link to="/products" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full sm:w-auto px-6 py-3 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  isAuthenticated
                    ? 'border border-[#E5E7EB] dark:border-[#1F2937] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#C9A24D] hover:text-[#C9A24D]'
                    : 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] hover:shadow-lg'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </motion.button>
            </Link>
          </motion.div>

          {/* Back to Home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6"
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-6 text-xs text-[#9CA3AF]"
        >
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
            Secure Payment
          </span>
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-[#C9A24D]" />
            Fast Delivery
          </span>
        </motion.div>
      </div>
    </div>
  );
}
