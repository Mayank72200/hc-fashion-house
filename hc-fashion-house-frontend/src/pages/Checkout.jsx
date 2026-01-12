import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CreditCard, ShoppingBag, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import CheckoutAddressSelector from '@/components/checkout/CheckoutAddressSelector';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import { OrderAPI } from '@/lib/api';
import { getImageProps } from '@/utils/imageUtils';

export default function Checkout() {
  const { items, subtotal, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('address'); // 'address' | 'summary' | 'payment'
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // If cart is empty, show empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] dark:bg-[#0B0F19] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-[#F3F4F6] dark:bg-[#1F2937] flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-[#9CA3AF] dark:text-[#6B7280]" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-2">
              Your cart is empty
            </h2>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-6">
              Add some items to your cart to proceed with checkout
            </p>
            <Link to="/products">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Start Shopping
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format cart items for checkout summary
  const cartItemsForSummary = items.map(item => ({
    id: item.id,
    name: item.name,
    image: item.image,
    size: item.selectedSize?.uk ? `UK ${item.selectedSize.uk}` : 'One Size',
    color: item.selectedColor,
    quantity: item.quantity,
    price: item.price,
  }));

  // Handle address/contact form submission
  const handleDeliverHere = (details) => {
    setDeliveryDetails(details);
    setStep('summary');
  };

  // Handle proceed to payment (submits order to backend)
  const handleProceedToPayment = async () => {
    setIsSubmitting(true);
    setOrderError(null);

    try {
      // Build order data for API
      const orderData = {
        // Guest info (only for non-authenticated users)
        guest_info: !user ? {
          email: deliveryDetails.email,
          phone: deliveryDetails.phone,
          full_name: deliveryDetails.fullName,
        } : undefined,
        
        // Shipping address
        shipping_address: {
          full_name: deliveryDetails.fullName,
          phone: deliveryDetails.phone,
          email: deliveryDetails.email || undefined,
          address_line1: deliveryDetails.addressLine1,
          address_line2: deliveryDetails.addressLine2 || undefined,
          landmark: deliveryDetails.landmark || undefined,
          city: deliveryDetails.city,
          state: deliveryDetails.state,
          pincode: deliveryDetails.pincode,
          is_default: false,
        },
        
        // Order items
        items: items.map(item => ({
          product_id: item.id,
          variant_id: item.variantId || null,
          option_id: item.optionId || null,
          product_name: item.name,
          variant_name: item.variantName || null,
          size: item.selectedSize?.ind || item.selectedSize?.uk?.toString() || 'One Size',
          color: item.selectedColor || null,
          quantity: item.quantity,
          unit_price: item.price * 100, // Convert to paise
          image_url: item.image,
        })),
        
        // Payment info (prepaid only - UPI default)
        payment_method: 'upi',
        payment_transaction_id: `TXN${Date.now()}`, // Mock transaction ID
        
        order_notes: deliveryDetails.orderNotes || undefined,
      };

      // Call API to create order
      const order = await OrderAPI.createOrder(orderData);
      
      // Store order details for success page
      const orderDetails = {
        orderId: order.order_number,
        items: cartItemsForSummary,
        deliveryDetails,
        subtotal,
        email: deliveryDetails?.email || null,
        createdAt: order.created_at,
        estimatedDelivery: order.estimated_delivery,
      };
      
      // Clear cart after successful order
      clearCart();
      
      // Navigate to order success page with order data
      navigate('/order-success', { 
        state: { orderData: orderDetails },
        replace: true 
      });
    } catch (error) {
      console.error('Order creation failed:', error);
      setOrderError(error.message || 'Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] dark:bg-[#0B0F19] transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#1F2937] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => step === 'address' ? navigate(-1) : setStep('address')}
                className="p-2 rounded-lg text-[#6B7280] hover:text-[#1C1C1C] dark:text-[#9CA3AF] dark:hover:text-[#F9FAFB] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-display text-xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">
                Checkout
              </h1>
            </div>
            
            {/* Step indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                step === 'address' 
                  ? 'bg-[#C9A24D]/10 text-[#C9A24D]' 
                  : 'bg-[#10B981]/10 text-[#10B981]'
              }`}>
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </div>
              <div className="w-4 h-px bg-[#E5E7EB] dark:bg-[#374151]" />
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                step === 'summary' 
                  ? 'bg-[#C9A24D]/10 text-[#C9A24D]' 
                  : step === 'payment' 
                    ? 'bg-[#10B981]/10 text-[#10B981]'
                    : 'bg-[#F3F4F6] dark:bg-[#1F2937] text-[#9CA3AF]'
              }`}>
                <ShoppingBag className="w-4 h-4" />
                <span>Summary</span>
              </div>
              <div className="w-4 h-px bg-[#E5E7EB] dark:bg-[#374151]" />
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                step === 'payment' 
                  ? 'bg-[#C9A24D]/10 text-[#C9A24D]' 
                  : 'bg-[#F3F4F6] dark:bg-[#1F2937] text-[#9CA3AF]'
              }`}>
                <CreditCard className="w-4 h-4" />
                <span>Payment</span>
              </div>
            </div>

            {/* Cart count */}
            <div className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              <ShoppingBag className="w-4 h-4" />
              <span>{itemCount} items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 'address' && (
          <div className="max-w-3xl mx-auto">
            <CheckoutAddressSelector 
              onDeliverHere={handleDeliverHere}
              initialData={deliveryDetails}
            />
          </div>
        )}

        {step === 'summary' && (
          <div className="max-w-3xl mx-auto">
            {orderError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{orderError}</p>
              </div>
            )}
            <CheckoutSummary 
              cartItems={cartItemsForSummary}
              deliveryAddress={deliveryDetails}
              onProceedToPayment={handleProceedToPayment}
              onChangeAddress={() => setStep('address')}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
