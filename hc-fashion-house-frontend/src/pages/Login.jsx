import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const { sendOtp, verifyOtp, signInWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill email if passed from order success page
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const returnTo = location.state?.returnTo || location.state?.from?.pathname || '/';
      console.log('User authenticated, redirecting to:', returnTo);
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  // Validate email
  const validateEmail = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate OTP
  const validateOtp = () => {
    const newErrors = {};

    if (!otp) {
      newErrors.otp = 'Verification code is required';
    } else if (otp.length !== 6) {
      newErrors.otp = 'Please enter a 6-digit code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsSubmitting(true);
    const { success } = await sendOtp(email);
    
    if (success) {
      setStep('otp');
      setOtp('');
    }
    
    setIsSubmitting(false);
  };

  // Handle verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!validateOtp()) return;
    
    setIsSubmitting(true);
    const { success } = await verifyOtp(email, otp);
    
    if (success) {
      const returnTo = location.state?.returnTo || location.state?.from?.pathname || '/';
      navigate(returnTo, { replace: true });
    }
    
    setIsSubmitting(false);
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    // Save return URL before OAuth redirect
    const returnTo = location.state?.returnTo || location.state?.from?.pathname || '/';
    sessionStorage.setItem('authReturnTo', returnTo);
    await signInWithGoogle();
    // Note: This will redirect to Google, so no need to handle response here
  };

  // Go back to email step
  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setErrors({});
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7] dark:bg-[#0B0F19]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A24D]" />
      </div>
    );
  }

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

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-2">
              {step === 'email' ? 'Welcome Back' : 'Enter Verification Code'}
            </h1>
            <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
              {step === 'email' 
                ? 'Sign in with your email to continue' 
                : `We've sent a 6-digit code to ${email}`}
            </p>
          </div>

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="Enter your email"
                    className={`w-full h-12 pl-12 pr-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 pl-1">{errors.email}</p>
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
                    Sending code...
                  </>
                ) : (
                  'Continue with Email'
                )}
              </motion.button>
            </form>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* Back button */}
              <button
                type="button"
                onClick={handleBackToEmail}
                className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1C1C1C] dark:hover:text-[#F9FAFB] transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Change email
              </button>

              {/* OTP Input */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    if (errors.otp) setErrors({ ...errors, otp: '' });
                  }}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className={`w-full h-14 text-center text-2xl font-mono tracking-[0.5em] bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] placeholder:tracking-normal placeholder:text-base focus:outline-none transition-colors duration-200 ${
                    errors.otp 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                  }`}
                />
                {errors.otp && (
                  <p className="text-xs text-red-500 text-center">{errors.otp}</p>
                )}
              </div>

              {/* Resend code */}
              <p className="text-center text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSubmitting}
                  className="text-[#C9A24D] hover:underline font-medium disabled:opacity-50"
                >
                  Resend
                </button>
              </p>

              {/* Verify Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-12 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </motion.button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB] dark:border-[#1F2937]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-[#111827] text-[#6B7280] dark:text-[#CBD5E1]">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login - Google Only */}
          <motion.button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-12 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] font-medium hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </motion.button>

          {/* Info text */}
          <p className="mt-6 text-center text-xs text-[#9CA3AF]">
            No password needed. We'll send you a secure verification code.
          </p>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-[#9CA3AF]">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="hover:text-[#C9A24D] hover:underline transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="hover:text-[#C9A24D] hover:underline transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
