import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { resetPassword } = useAuth();

  // Form validation
  const validateEmail = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsSubmitting(true);
    const { success } = await resetPassword(email);
    
    if (success) {
      setIsSuccess(true);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FAF9F7] dark:bg-[#0B0F19] transition-colors duration-300">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-[#C9A24D]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 p-8 sm:p-10">
          {/* Logo */}
          <Link to="/" className="flex justify-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-[#C9A24D] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-logo text-3xl font-bold text-[#C9A24D]">HC</span>
                <div className="flex flex-col leading-none">
                  <span className="font-logo text-[10px] font-semibold tracking-[0.15em] text-[#1C1C1C] dark:text-[#F9FAFB] uppercase">Fashion</span>
                  <span className="font-logo text-[10px] font-semibold tracking-[0.15em] text-[#1C1C1C] dark:text-[#F9FAFB] uppercase">House</span>
                </div>
              </div>
            </motion.div>
          </Link>

          {isSuccess ? (
            // Success State
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-3">
                Check Your Email
              </h1>
              <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1] mb-6">
                We've sent a password reset link to <strong className="text-[#1C1C1C] dark:text-[#F9FAFB]">{email}</strong>
              </p>
              <p className="text-xs text-[#9CA3AF] mb-8">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <motion.button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Try Different Email
                </motion.button>
                <Link 
                  to="/login"
                  className="block w-full h-12 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] font-medium hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </motion.div>
          ) : (
            // Form State
            <>
              {/* Heading */}
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-2">
                  Forgot Password?
                </h1>
                <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div className="space-y-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="E-mail"
                    className={`w-full h-12 px-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                      error 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                    }`}
                  />
                  {error && (
                    <p className="text-xs text-red-500 pl-1">{error}</p>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </motion.button>
              </form>

              {/* Back to Login */}
              <Link 
                to="/login"
                className="flex items-center justify-center gap-2 mt-6 text-sm text-[#6B7280] dark:text-[#CBD5E1] hover:text-[#C9A24D] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
