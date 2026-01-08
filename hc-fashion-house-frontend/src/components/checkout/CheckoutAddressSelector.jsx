import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  User,
  Phone,
  Mail,
  Home,
  AlertCircle
} from 'lucide-react';

export default function CheckoutAddressSelector({ onDeliverHere, initialData = null }) {
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [errors, setErrors] = useState({});

  // Pre-fill form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setAddressForm(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Handle form field change
  const handleChange = (field, value) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!addressForm.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!addressForm.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(addressForm.phone.replace(/\s+/g, '').replace('+91', ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    // Email is optional but must be valid if provided
    if (addressForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressForm.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!addressForm.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }

    if (!addressForm.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!addressForm.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!addressForm.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(addressForm.pincode)) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle continue to summary
  const handleContinue = () => {
    if (validateForm()) {
      onDeliverHere(addressForm);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#C9A24D]/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-[#C9A24D]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">
            Delivery Details
          </h2>
          <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
            You can checkout as a guest
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm space-y-5">
        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide">
            <User className="w-4 h-4" />
            Contact Information
          </h3>
          
          {/* Full Name */}
          <div className="space-y-1">
            <input
              type="text"
              value={addressForm.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Full Name *"
              className={`w-full h-12 px-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                errors.fullName
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Phone & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Phone Number *"
                  className={`w-full h-12 pl-11 pr-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                    errors.phone
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="email"
                  value={addressForm.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Email (optional)"
                  className={`w-full h-12 pl-11 pr-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
              {!errors.email && (
                <p className="text-xs text-[#9CA3AF]">
                  Recommended for order updates
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E7EB] dark:border-[#1F2937]" />

        {/* Delivery Address */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide">
            <Home className="w-4 h-4" />
            Delivery Address
          </h3>

          {/* Address Line 1 */}
          <div className="space-y-1">
            <input
              type="text"
              value={addressForm.addressLine1}
              onChange={(e) => handleChange('addressLine1', e.target.value)}
              placeholder="House no., Building, Street *"
              className={`w-full h-12 px-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                errors.addressLine1
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
              }`}
            />
            {errors.addressLine1 && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.addressLine1}
              </p>
            )}
          </div>

          {/* Address Line 2 */}
          <div>
            <input
              type="text"
              value={addressForm.addressLine2}
              onChange={(e) => handleChange('addressLine2', e.target.value)}
              placeholder="Landmark, Area (optional)"
              className="w-full h-12 px-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors duration-200"
            />
          </div>

          {/* City, State, Pincode */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City *"
                className={`w-full h-12 px-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                  errors.city
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                }`}
              />
              {errors.city && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.city}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <input
                type="text"
                value={addressForm.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="State *"
                className={`w-full h-12 px-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                  errors.state
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                }`}
              />
              {errors.state && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.state}
                </p>
              )}
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <input
                type="text"
                value={addressForm.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                placeholder="Pincode *"
                maxLength={6}
                className={`w-full h-12 px-4 bg-transparent border rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none transition-colors duration-200 ${
                  errors.pincode
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#C9A24D]'
                }`}
              />
              {errors.pincode && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.pincode}
                </p>
              )}
            </div>
          </div>

          {/* Country (readonly) */}
          <div>
            <input
              type="text"
              value={addressForm.country}
              readOnly
              className="w-full h-12 px-4 bg-[#F9FAFB] dark:bg-[#0B0F19] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#6B7280] dark:text-[#9CA3AF] cursor-not-allowed"
            />
          </div>
        </div>

        {/* Continue Button */}
        <motion.button
          onClick={handleContinue}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200 mt-4"
        >
          Continue to Order Summary
        </motion.button>
      </div>
    </div>
  );
}
