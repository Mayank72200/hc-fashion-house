import { motion } from 'framer-motion';
import { MapPin, Edit2, ShoppingBag, Truck, Shield, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock cart items (can be passed as props)
const mockCartItems = [
  {
    id: 1,
    name: 'Classic Oxford Leather Shoes',
    image: '/assets/shoes/oxford-brown.jpg',
    size: 'UK 9',
    color: 'Brown',
    quantity: 1,
    price: 8999,
  },
  {
    id: 2,
    name: 'Premium Leather Belt',
    image: '/assets/shoes/belt-black.jpg',
    size: 'M',
    color: 'Black',
    quantity: 1,
    price: 2500,
  },
];

// Mock address (can be passed as props)
const mockAddress = {
  fullName: 'John Doe',
  phone: '+91 98765 43210',
  addressLine1: '123 Fashion Street',
  addressLine2: 'Near Central Mall',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  country: 'India',
};

export default function CheckoutSummary({ 
  cartItems = mockCartItems, 
  deliveryAddress = mockAddress,
  onProceedToPayment,
  onChangeAddress,
  isSubmitting = false
}) {
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 ? 0 : 99; // Free shipping over ₹999
  const tax = 0; // Calculated at payment
  const total = subtotal + shipping + tax;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle proceed to payment
  const handleProceedToPayment = () => {
    if (onProceedToPayment) {
      onProceedToPayment();
    } else {
      // Placeholder - will be replaced with actual payment redirect
      console.log('Proceeding to payment...');
    }
  };

  // No address selected state
  if (!deliveryAddress) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-[#111827] rounded-2xl">
        <div className="w-16 h-16 rounded-full bg-[#C9A24D]/10 flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-[#C9A24D]" />
        </div>
        <h3 className="text-xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-2">
          Please select a delivery address
        </h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-6">
          You need to add a delivery address before proceeding
        </p>
        <Link to="/checkout/address">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Select Address
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1C1C1C] dark:text-[#F9FAFB]">
          Order Summary
        </h1>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
          Review your order before proceeding to payment
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Section: Delivery Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C9A24D]/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#C9A24D]" />
                </div>
                <h2 className="text-lg font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">
                  Deliver To
                </h2>
              </div>
              <button
                onClick={onChangeAddress}
                className="flex items-center gap-1.5 text-sm font-medium text-[#C9A24D] hover:underline transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Change
              </button>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">
                {deliveryAddress.fullName}
              </p>
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                {deliveryAddress.phone}
              </p>
              {deliveryAddress.email && (
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                  {deliveryAddress.email}
                </p>
              )}
              <div className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                <p>{deliveryAddress.addressLine1}</p>
                {deliveryAddress.addressLine2 && (
                  <p>{deliveryAddress.addressLine2}</p>
                )}
                <p>
                  {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}
                </p>
                <p>{deliveryAddress.country}</p>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#1F2937]">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">
                  Expected delivery in <span className="font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">3-5 business days</span>
                </span>
              </div>
            </div>
          </div>

          {/* Security Note - Desktop only */}
          <div className="hidden lg:flex items-center gap-3 p-4 bg-[#F3F4F6] dark:bg-[#1F2937] rounded-xl">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Your payment information is processed securely. We do not store your card details.
            </p>
          </div>
        </div>

        {/* Right Section: Order Summary */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#C9A24D]/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#C9A24D]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">
                Order Summary
              </h2>
              <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
              </span>
            </div>

            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-[#F9FAFB] dark:bg-[#0B0F19] rounded-xl"
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-[#E5E7EB] dark:bg-[#1F2937] rounded-lg overflow-hidden shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1C1C1C] dark:text-[#F9FAFB] text-sm truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                      {item.color} • Size {item.size}
                    </p>
                    <p className="text-xs text-[#9CA3AF] dark:text-[#6B7280] mt-1">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  {/* Item Price */}
                  <p className="font-semibold text-[#111827] dark:text-[#F9FAFB] shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-[#E5E7EB] dark:border-[#1F2937] pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Subtotal</span>
                <span className="text-[#1C1C1C] dark:text-[#F9FAFB] font-medium">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Shipping</span>
                <span className={`font-medium ${shipping === 0 ? 'text-green-600 dark:text-green-400' : 'text-[#1C1C1C] dark:text-[#F9FAFB]'}`}>
                  {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Taxes</span>
                <span className="text-[#9CA3AF] dark:text-[#6B7280] text-xs">
                  Calculated at payment
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                <span className="text-[#1C1C1C] dark:text-[#F9FAFB] font-semibold">
                  Total
                </span>
                <span className="font-display text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-6 space-y-4">
              <motion.button
                onClick={handleProceedToPayment}
                disabled={isSubmitting}
                whileHover={{ y: isSubmitting ? 0 : -1 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="w-full py-4 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </motion.button>

              <p className="text-center text-xs text-[#9CA3AF] dark:text-[#6B7280]">
                You will be redirected to PhonePe to choose your preferred payment method.
              </p>
            </div>
          </div>

          {/* Security Note - Mobile only */}
          <div className="flex lg:hidden items-center gap-3 p-4 mt-4 bg-[#F3F4F6] dark:bg-[#1F2937] rounded-xl">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Your payment information is processed securely. We do not store your card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
