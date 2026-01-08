import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  MapPin,
  CreditCard,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { OrderAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Mock order data
const mockOrders = [
  {
    id: 'ORD-2026-001234',
    date: '2025-12-28',
    status: 'delivered',
    total: 12999,
    items: [
      {
        id: 1,
        name: 'Classic Oxford Leather Shoes',
        image: '/assets/shoes/oxford-brown.jpg',
        size: 'UK 9',
        quantity: 1,
        price: 8999,
      },
      {
        id: 2,
        name: 'Premium Leather Belt',
        image: '/assets/shoes/belt-black.jpg',
        size: 'M',
        quantity: 1,
        price: 2500,
      },
      {
        id: 3,
        name: 'Shoe Care Kit',
        image: '/assets/shoes/care-kit.jpg',
        size: '-',
        quantity: 1,
        price: 1500,
      },
    ],
    address: {
      fullName: 'John Doe',
      line1: '123 Fashion Street, Near Central Mall',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    paymentMethod: 'Credit Card ending in 4242',
    breakdown: {
      subtotal: 12999,
      shipping: 0,
      discount: 0,
      total: 12999,
    },
  },
  {
    id: 'ORD-2026-001198',
    date: '2025-12-15',
    status: 'shipped',
    total: 6499,
    items: [
      {
        id: 4,
        name: 'Suede Loafers Navy',
        image: '/assets/shoes/loafer-navy.jpg',
        size: 'UK 10',
        quantity: 1,
        price: 6499,
      },
    ],
    address: {
      fullName: 'John Doe',
      line1: 'Office Tower, 5th Floor, Business Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
    },
    paymentMethod: 'UPI - john@upi',
    breakdown: {
      subtotal: 6499,
      shipping: 0,
      discount: 0,
      total: 6499,
    },
  },
  {
    id: 'ORD-2026-001156',
    date: '2025-11-20',
    status: 'cancelled',
    total: 4999,
    items: [
      {
        id: 5,
        name: 'Canvas Sneakers White',
        image: '/assets/shoes/sneaker-white.jpg',
        size: 'UK 8',
        quantity: 1,
        price: 4999,
      },
    ],
    address: {
      fullName: 'John Doe',
      line1: '123 Fashion Street, Near Central Mall',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    paymentMethod: 'Debit Card ending in 1234',
    breakdown: {
      subtotal: 4999,
      shipping: 0,
      discount: 0,
      total: 4999,
    },
  },
  {
    id: 'ORD-2026-001089',
    date: '2025-10-05',
    status: 'returned',
    total: 9999,
    items: [
      {
        id: 6,
        name: 'Chelsea Boots Brown',
        image: '/assets/shoes/chelsea-brown.jpg',
        size: 'UK 9',
        quantity: 1,
        price: 9999,
      },
    ],
    address: {
      fullName: 'John Doe',
      line1: '123 Fashion Street, Near Central Mall',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    paymentMethod: 'Net Banking - HDFC',
    breakdown: {
      subtotal: 9999,
      shipping: 0,
      discount: 0,
      total: 9999,
    },
  },
];

// Status config
const statusConfig = {
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
  },
  in_transit: {
    label: 'In Transit',
    icon: Truck,
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: Truck,
    bgClass: 'bg-teal-100 dark:bg-teal-900/30',
    textClass: 'text-teal-700 dark:text-teal-400',
  },
  processing: {
    label: 'Processing',
    icon: Clock,
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-400',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
    textClass: 'text-indigo-700 dark:text-indigo-400',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    bgClass: 'bg-gray-100 dark:bg-gray-900/30',
    textClass: 'text-gray-700 dark:text-gray-400',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
  },
  returned: {
    label: 'Returned',
    icon: RotateCcw,
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-400',
  },
  return_requested: {
    label: 'Return Requested',
    icon: RotateCcw,
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-400',
  },
  refunded: {
    label: 'Refunded',
    icon: CheckCircle,
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
  },
};

// Filter options
const filterOptions = [
  { value: 'all', label: 'All Orders' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
];

export default function OrderHistory() {
  const { user } = useAuth();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders on mount
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await OrderAPI.getOrders({ 
          status: activeFilter !== 'all' ? activeFilter : undefined 
        });
        
        // Transform API response to component format
        const transformedOrders = response.orders.map(order => ({
          id: order.order_number,
          date: order.created_at,
          status: order.status,
          total: order.total_amount / 100, // Convert from paise
          items: order.items.map(item => ({
            id: item.id,
            name: item.product_name,
            image: item.image_url || '/placeholder.jpg',
            size: item.size,
            quantity: item.quantity,
            price: item.unit_price / 100, // Convert from paise
          })),
          address: {
            fullName: order.shipping_address.full_name,
            line1: `${order.shipping_address.address_line1}${order.shipping_address.address_line2 ? ', ' + order.shipping_address.address_line2 : ''}`,
            city: order.shipping_address.city,
            state: order.shipping_address.state,
            pincode: order.shipping_address.pincode,
          },
          paymentMethod: order.payment_method === 'upi' ? 'UPI' : 
            order.payment_method === 'credit_card' ? 'Credit Card' :
            order.payment_method === 'debit_card' ? 'Debit Card' :
            order.payment_method === 'net_banking' ? 'Net Banking' : 'Wallet',
          breakdown: {
            subtotal: order.subtotal / 100,
            shipping: order.shipping_charge / 100,
            discount: order.discount_amount / 100,
            total: order.total_amount / 100,
          },
        }));
        
        setOrders(transformedOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, activeFilter]);

  // Filter orders (client-side for already fetched data)
  const filteredOrders = orders;

  // Toggle order expansion
  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF9F7] dark:bg-[#0B0F19] transition-colors duration-300">
        <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1C1C1C] dark:text-[#F9FAFB] mb-2">
              My Orders
            </h1>
            <p className="text-[#6B7280] dark:text-[#CBD5E1]">
              Track and manage your orders
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filterOptions.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeFilter === filter.value
                    ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A]'
                    : 'bg-white dark:bg-[#111827] text-[#6B7280] dark:text-[#CBD5E1] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {isLoading ? (
            /* Loading State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white dark:bg-[#111827] rounded-2xl shadow-sm"
            >
              <Loader2 className="w-12 h-12 text-[#C9A24D] mx-auto mb-4 animate-spin" />
              <p className="text-[#6B7280] dark:text-[#CBD5E1]">Loading your orders...</p>
            </motion.div>
          ) : error ? (
            /* Error State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white dark:bg-[#111827] rounded-2xl shadow-sm"
            >
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-2">
                Failed to load orders
              </h3>
              <p className="text-[#6B7280] dark:text-[#CBD5E1] mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-medium rounded-lg"
              >
                Try Again
              </button>
            </motion.div>
          ) : !user ? (
            /* Not Logged In State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white dark:bg-[#111827] rounded-2xl shadow-sm"
            >
              <Package className="w-16 h-16 text-[#D1D5DB] dark:text-[#4B5563] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-2">
                Sign in to view your orders
              </h3>
              <p className="text-[#6B7280] dark:text-[#CBD5E1] mb-6">
                Track your orders and manage returns after signing in
              </p>
              <Link to="/login">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Sign In
                </motion.button>
              </Link>
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white dark:bg-[#111827] rounded-2xl shadow-sm"
            >
              <ShoppingBag className="w-16 h-16 text-[#D1D5DB] dark:text-[#4B5563] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] mb-2">
                {activeFilter === 'all' 
                  ? "You haven't placed any orders yet"
                  : `No ${activeFilter} orders found`
                }
              </h3>
              <p className="text-[#6B7280] dark:text-[#CBD5E1] mb-6">
                {activeFilter === 'all'
                  ? "When you place orders, they'll appear here"
                  : "Try selecting a different filter"
                }
              </p>
              {activeFilter === 'all' && (
                <Link to="/">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-3 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    Start Shopping
                  </motion.button>
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const isExpanded = expandedOrder === order.id;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* Order Header */}
                    <div
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="p-5 cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Order Info */}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#C9A24D]/10 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-[#C9A24D]" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">
                              {order.id}
                            </p>
                            <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                              {formatDate(order.date)} • {order.items.length} item{order.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Status & Amount */}
                        <div className="flex items-center gap-4 sm:gap-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bgClass} ${status.textClass}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>
                          <p className="font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">
                            {formatCurrency(order.total)}
                          </p>
                          <button className="p-1 text-[#6B7280] dark:text-[#CBD5E1]">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Order Details (Expandable) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                            {/* Order Items */}
                            <div className="py-4 space-y-3">
                              <h4 className="text-sm font-semibold text-[#6B7280] dark:text-[#CBD5E1] uppercase tracking-wide">
                                Order Items
                              </h4>
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-4 p-3 bg-[#F9FAFB] dark:bg-[#0B0F19] rounded-xl"
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
                                    <p className="font-medium text-[#1C1C1C] dark:text-[#F9FAFB] truncate">
                                      {item.name}
                                    </p>
                                    <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                                      Size: {item.size} • Qty: {item.quantity}
                                    </p>
                                  </div>
                                  {/* Price */}
                                  <p className="font-medium text-[#1C1C1C] dark:text-[#F9FAFB] shrink-0">
                                    {formatCurrency(item.price)}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {/* Delivery Address & Payment */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                              {/* Delivery Address */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#6B7280] dark:text-[#CBD5E1] uppercase tracking-wide">
                                  <MapPin className="w-4 h-4" />
                                  Delivery Address
                                </div>
                                <div className="text-sm text-[#1C1C1C] dark:text-[#F9FAFB]">
                                  <p className="font-medium">{order.address.fullName}</p>
                                  <p className="text-[#6B7280] dark:text-[#CBD5E1]">
                                    {order.address.line1}
                                  </p>
                                  <p className="text-[#6B7280] dark:text-[#CBD5E1]">
                                    {order.address.city}, {order.address.state} - {order.address.pincode}
                                  </p>
                                </div>
                              </div>

                              {/* Payment Method */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#6B7280] dark:text-[#CBD5E1] uppercase tracking-wide">
                                  <CreditCard className="w-4 h-4" />
                                  Payment Method
                                </div>
                                <p className="text-sm text-[#1C1C1C] dark:text-[#F9FAFB]">
                                  {order.paymentMethod}
                                </p>
                              </div>
                            </div>

                            {/* Order Total Breakdown */}
                            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-[#6B7280] dark:text-[#CBD5E1]">
                                  <span>Subtotal</span>
                                  <span>{formatCurrency(order.breakdown.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-[#6B7280] dark:text-[#CBD5E1]">
                                  <span>Shipping</span>
                                  <span>{order.breakdown.shipping === 0 ? 'Free' : formatCurrency(order.breakdown.shipping)}</span>
                                </div>
                                {order.breakdown.discount > 0 && (
                                  <div className="flex justify-between text-green-600 dark:text-green-400">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(order.breakdown.discount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-semibold text-[#1C1C1C] dark:text-[#F9FAFB] pt-2 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                                  <span>Total</span>
                                  <span>{formatCurrency(order.breakdown.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
