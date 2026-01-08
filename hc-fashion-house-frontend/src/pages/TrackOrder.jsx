import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Package, Search, Truck, CheckCircle, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import { OrderAPI } from '@/lib/api';

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock tracking data - replace with actual API call
  const mockTrackingData = {
    orderId: 'HC-2026-001234',
    orderDate: '2026-01-02',
    estimatedDelivery: '2026-01-07',
    currentStatus: 'in-transit',
    trackingNumber: 'TRK1234567890',
    carrier: 'BlueDart',
    items: [
      { name: 'Classic White Sneakers', quantity: 1, size: 'UK 9' },
      { name: 'Cotton T-Shirt', quantity: 2, size: 'M' },
    ],
    timeline: [
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Your order has been received and confirmed',
        date: '2026-01-02',
        time: '10:30 AM',
        completed: true,
      },
      {
        status: 'processing',
        title: 'Processing',
        description: 'Your order is being prepared for shipment',
        date: '2026-01-02',
        time: '02:15 PM',
        completed: true,
      },
      {
        status: 'shipped',
        title: 'Shipped',
        description: 'Your order has been dispatched',
        date: '2026-01-03',
        time: '09:00 AM',
        completed: true,
      },
      {
        status: 'in-transit',
        title: 'In Transit',
        description: 'Your package is on the way',
        date: '2026-01-04',
        time: '11:45 AM',
        completed: true,
      },
      {
        status: 'out-for-delivery',
        title: 'Out for Delivery',
        description: 'Your package is out for delivery',
        date: 'Expected today',
        time: '',
        completed: false,
      },
      {
        status: 'delivered',
        title: 'Delivered',
        description: 'Package delivered successfully',
        date: 'Expected 2026-01-07',
        time: '',
        completed: false,
      },
    ],
    shippingAddress: {
      name: 'John Doe',
      address: '123 Main Street, Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91 98765 43210',
    },
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!orderId.trim() || !email.trim()) {
      setError('Please enter both Order ID and Email');
      setIsLoading(false);
      return;
    }

    try {
      const tracking = await OrderAPI.trackOrder(orderId.trim(), email.trim());
      
      // Transform API response to component format
      const formattedData = {
        orderId: tracking.order_number,
        orderDate: new Date(tracking.timeline[0]?.timestamp).toISOString().split('T')[0],
        estimatedDelivery: tracking.estimated_delivery 
          ? new Date(tracking.estimated_delivery).toISOString().split('T')[0]
          : 'Calculating...',
        currentStatus: tracking.status,
        trackingNumber: tracking.tracking_number || 'Awaiting pickup',
        carrier: tracking.shipping_partner === 'india_post' ? 'India Post' : 'Shiprocket',
        items: tracking.items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          size: item.size,
        })),
        timeline: tracking.timeline.map((event, index) => ({
          status: event.status,
          title: event.title,
          description: event.description,
          date: new Date(event.timestamp).toLocaleDateString('en-IN'),
          time: new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          completed: index <= tracking.timeline.findIndex(t => t.status === tracking.status),
        })),
        shippingAddress: {
          name: tracking.shipping_address.full_name,
          address: `${tracking.shipping_address.address_line1}${tracking.shipping_address.address_line2 ? ', ' + tracking.shipping_address.address_line2 : ''}`,
          city: tracking.shipping_address.city,
          state: tracking.shipping_address.state,
          pincode: tracking.shipping_address.pincode,
          phone: tracking.shipping_address.phone,
        },
      };
      
      setTrackingData(formattedData);
    } catch (err) {
      setError(err.message || 'Order not found. Please check your Order ID and Email.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status, completed) => {
    if (completed) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (status === trackingData?.currentStatus) {
      return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />;
    } else {
      return <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-800 dark:to-teal-800 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Package className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Track Your Order
              </h1>
              <p className="text-xl text-green-100 max-w-3xl mx-auto">
                Enter your order details to see real-time tracking information
              </p>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Tracking Form */}
          {!trackingData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Search className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Enter Order Details
                </h2>
              </div>

              <form onSubmit={handleTrackOrder} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g., HC-2026-001234"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Tracking...' : 'Track Order'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Where to find your Order ID?</strong>
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Check your order confirmation email</li>
                  <li>• Visit "My Account" → "Order History"</li>
                  <li>• Look in your SMS notifications</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Tracking Results */}
          {trackingData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Order Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Order {trackingData.orderId}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Placed on {new Date(trackingData.orderDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setTrackingData(null)}
                    className="text-green-600 hover:text-green-700 dark:text-green-400 font-semibold"
                  >
                    Track Another Order
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Carrier</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {trackingData.carrier}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tracking #</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {trackingData.trackingNumber}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Est. Delivery</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(trackingData.estimatedDelivery).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {trackingData.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.name} (Size: {item.size})
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Tracking History
                </h3>
                <div className="space-y-6">
                  {trackingData.timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        {getStatusIcon(event.status, event.completed)}
                        {idx < trackingData.timeline.length - 1 && (
                          <div className={`w-0.5 h-16 mt-2 ${
                            event.completed 
                              ? 'bg-green-500' 
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`font-semibold ${
                              event.completed 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {event.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {event.description}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                            <p>{event.date}</p>
                            {event.time && <p>{event.time}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Delivery Address
                  </h3>
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <p className="font-semibold">{trackingData.shippingAddress.name}</p>
                  <p>{trackingData.shippingAddress.address}</p>
                  <p>{trackingData.shippingAddress.city}, {trackingData.shippingAddress.state} - {trackingData.shippingAddress.pincode}</p>
                  <p className="mt-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {trackingData.shippingAddress.phone}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-800 dark:to-teal-800 rounded-lg shadow-lg p-8 text-center text-white"
          >
            <h2 className="text-2xl font-bold mb-4">Need Help with Your Order?</h2>
            <p className="text-green-100 mb-6">
              Our customer support team is available to assist you
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/contact-us"
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Contact Support
              </a>
              <a
                href="/faqs"
                className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors"
              >
                View FAQs
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default TrackOrder;
