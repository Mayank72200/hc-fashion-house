import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, Globe, Shield, CreditCard, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const shippingMethods = [
  {
    icon: Truck,
    name: 'Standard Shipping',
    duration: '3-7 Business Days',
    cost: 'Varies by product',
    belowMinCost: 'Shipping charges displayed at checkout',
    description: 'Reliable delivery via India Post (primary) or Shiprocket.',
    features: [
      'Some products include free shipping',
      'Shipping charges clearly shown at checkout',
      'Tracking details sent via email after dispatch',
      'Delivery to all pin codes in India',
    ],
  },
];

const deliveryZones = [
  {
    zone: 'Metro Cities',
    cities: 'Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad',
    standard: '3-4 days',
  },
  {
    zone: 'Tier 1 Cities',
    cities: 'Jaipur, Lucknow, Chandigarh, Kochi, Indore, Bhopal, Nagpur, Surat',
    standard: '4-5 days',
  },
  {
    zone: 'Tier 2 Cities',
    cities: 'Dehradun, Ranchi, Raipur, Guwahati, Visakhapatnam, Vadodara',
    standard: '5-6 days',
  },
  {
    zone: 'Remote Areas',
    cities: 'Hill stations, remote towns, and villages',
    standard: '6-7 days',
  },
];

const trackingSteps = [
  {
    status: 'Order Confirmed',
    description: 'Your order has been received and is being processed.',
    icon: CheckCircle,
  },
  {
    status: 'Processing',
    description: 'We\'re preparing your items for shipment.',
    icon: Package,
  },
  {
    status: 'Shipped',
    description: 'Your order is on its way! Tracking details sent via email.',
    icon: Truck,
  },
  {
    status: 'Out for Delivery',
    description: 'Your package is with our delivery partner in your area.',
    icon: MapPin,
  },
  {
    status: 'Delivered',
    description: 'Successfully delivered! Enjoy your purchase.',
    icon: CheckCircle,
  },
];

const faqs = [
  {
    question: 'How do I track my order?',
    answer: 'Once your order is dispatched, you\'ll receive tracking details via email. You can use the tracking number provided to monitor your shipment\'s progress with the shipping partner (India Post or Shiprocket).',
  },
  {
    question: 'What if I\'m not home during delivery?',
    answer: 'Our delivery partner will make up to 3 delivery attempts. If you\'re unavailable, they\'ll leave a notification with instructions. You can also contact the courier to reschedule delivery or arrange for pickup from their local office.',
  },
  {
    question: 'Can I change my shipping address after ordering?',
    answer: 'You can update your shipping address within 1 hour of placing your order by contacting customer support. Once the order is processed and shipped, address changes are not possible.',
  },
  {
    question: 'Do you ship on weekends and holidays?',
    answer: 'We process orders Monday through Saturday. Shipments don\'t go out on Sundays and national holidays. Delivery schedules depend on the shipping partner and location.',
  },
  {
    question: 'What if my package is damaged or lost?',
    answer: 'If your package arrives damaged, please don\'t accept the delivery and contact us immediately. For lost packages, we\'ll investigate with the courier and either resend your order or process a full refund.',
  },
  {
    question: 'Do you offer international shipping?',
    answer: 'Currently, we only ship within India. We\'re working on expanding to international locations. Subscribe to our newsletter to stay updated on international shipping availability.',
  },
];

const ShippingInfo = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block p-4 bg-white/10 rounded-full mb-6 backdrop-blur-sm"
            >
              <Truck className="w-12 h-12" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping Information</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Fast, reliable delivery across India with real-time tracking and multiple shipping options.
            </p>
          </div>
        </motion.div>

        {/* Shipping Methods */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {shippingMethods.map((method, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <method.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {method.name}
                </h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {method.duration}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {method.cost}
                  </p>
                  {method.belowMinCost && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {method.belowMinCost}
                    </p>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {method.description}
                </p>
                
                <ul className="space-y-2">
                  {method.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Delivery Timeline */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Delivery Timelines by Zone
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                      Zone
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                      Cities
                    </th>
                    <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                      Estimated Delivery
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryZones.map((zone, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">
                        {zone.zone}
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {zone.cities}
                      </td>
                      <td className="py-4 px-4 text-center text-blue-600 dark:text-blue-400 font-semibold">
                        {zone.standard}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Note:</strong> Delivery times are estimated and may vary due to weather conditions, 
                local holidays, courier availability, or other unforeseen circumstances. All orders are prepaid. 
                Orders are processed within stated timelines after payment confirmation.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Order Tracking Process */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Track Your Order
            </h2>
            
            <div className="relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 dark:from-blue-800 dark:via-purple-800 dark:to-green-800" />
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
                {trackingSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg relative z-10">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {step.status}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <Globe className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Pan-India Delivery
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We deliver to all pin codes across India, including remote areas and hill stations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Secure Packaging
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All items are securely packaged to ensure they arrive in perfect condition.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <CreditCard className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Prepaid Orders Only
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All orders are prepaid. Payment is required at checkout. Guest checkout is available.
              </p>
            </motion.div>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Shipping FAQs
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
                      openFAQ === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: openFAQ === index ? 'auto' : 0,
                    opacity: openFAQ === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShippingInfo;
