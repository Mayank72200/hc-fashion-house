import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function CheckoutLoginGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7] dark:bg-[#0B0F19] transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#C9A24D] mx-auto mb-4" />
          <p className="text-[#6B7280] dark:text-[#CBD5E1] text-sm">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated - render children (checkout flow)
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // User is NOT authenticated - show login prompt
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAF9F7] dark:bg-[#0B0F19] transition-colors duration-300">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-[#C9A24D]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 p-8 sm:p-10 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 relative"
            >
              <div className="absolute inset-0 bg-[#C9A24D]/10 rounded-full" />
              <div className="absolute inset-2 bg-[#C9A24D]/20 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-8 h-8 text-[#C9A24D]" />
              </div>
            </motion.div>

            {/* Logo hint */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#C9A24D] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="font-logo text-xl font-bold text-[#C9A24D]">HC</span>
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-3">
              Sign in to continue
            </h1>

            {/* Subtitle */}
            <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1] mb-8 max-w-xs mx-auto">
              Please sign in to complete your purchase and access your cart
            </p>

            {/* Sign In Button */}
            <motion.button
              onClick={() => navigate('/login', { state: { from: { pathname: window.location.pathname } } })}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Sign In
            </motion.button>

            {/* Create Account Link */}
            <p className="mt-6 text-sm text-[#6B7280] dark:text-[#CBD5E1]">
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/register', { state: { from: { pathname: window.location.pathname } } })}
                className="text-[#1C1C1C] dark:text-[#F9FAFB] font-medium hover:text-[#C9A24D] dark:hover:text-[#C9A24D] hover:underline transition-colors"
              >
                Create one
              </button>
            </p>

            {/* Continue Shopping */}
            <button
              onClick={() => navigate('/')}
              className="mt-4 text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              ← Continue shopping
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
