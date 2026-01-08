import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ShoppingBag, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const { signUp, signInWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    const { success, needsConfirmation } = await signUp(
      formData.email, 
      formData.password,
      {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`,
      }
    );
    
    if (success) {
      if (needsConfirmation) {
        // Email confirmation required
        navigate('/login', { 
          state: { message: 'Please check your email to confirm your account' } 
        });
      } else {
        // Direct login successful
        navigate('/');
      }
    }
    
    setIsSubmitting(false);
  };

  // Handle Google sign up
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    await signInWithGoogle();
    // Note: This will redirect to Google
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#EF4444', '#F59E0B', '#10B981', '#C9A24D'];

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
              Create Account
            </h1>
            <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
              Join HC Fashion House for exclusive offers
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className={`w-full h-12 px-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                    errors.firstName 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 pl-1">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className={`w-full h-12 px-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                    errors.lastName 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 pl-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="E-mail"
                className={`w-full h-12 px-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 pl-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className={`w-full h-12 px-4 pr-12 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 pl-1">{errors.password}</p>
              )}
              
              {/* Password Strength */}
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors duration-200"
                        style={{
                          backgroundColor: i < passwordStrength ? strengthColors[passwordStrength - 1] : '#E5E7EB',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Password strength: <span style={{ color: strengthColors[passwordStrength - 1] }}>{strengthLabels[passwordStrength - 1] || 'Too weak'}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className={`w-full h-12 px-4 pr-12 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 pl-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="space-y-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div 
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 mt-0.5 flex-shrink-0 ${
                    agreeToTerms 
                      ? 'bg-[#C9A24D] border-[#C9A24D]' 
                      : errors.terms
                        ? 'border-red-500'
                        : 'border-[#E5E7EB] dark:border-[#1F2937] group-hover:border-[#C9A24D]'
                  }`}
                  onClick={() => {
                    setAgreeToTerms(!agreeToTerms);
                    if (errors.terms) setErrors({ ...errors, terms: '' });
                  }}
                >
                  {agreeToTerms && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#1C1C1C] dark:text-[#F9FAFB] hover:text-[#C9A24D] hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#1C1C1C] dark:text-[#F9FAFB] hover:text-[#C9A24D] hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms && (
                <p className="text-xs text-red-500 pl-8">{errors.terms}</p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
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
            onClick={handleGoogleSignUp}
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

          {/* Sign In Link */}
          <p className="mt-8 text-center text-sm text-[#6B7280] dark:text-[#CBD5E1]">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-[#1C1C1C] dark:text-[#F9FAFB] font-medium hover:text-[#C9A24D] dark:hover:text-[#C9A24D] hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
