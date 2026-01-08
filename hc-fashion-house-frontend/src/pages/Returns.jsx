import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { RotateCcw, Package, Clock, CreditCard, AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';

const sections = [
  {
    id: 'policy',
    icon: RotateCcw,
    title: 'Our Return Policy',
    content: [
      {
        text: 'At HC Fashion House, we want you to be completely satisfied with your purchase. If you receive a wrong item, wrong size, or damaged product, you may request a return within 72 hours of delivery.',
      },
      {
        text: 'A video call is conducted during order packing to verify items. Products approved during the video call packing are not eligible for return. All returned items must be unused, with original tags attached, and in the same condition as shipped.',
      },
    ],
  },
  {
    id: 'eligible',
    icon: CheckCircle,
    title: 'Eligible Items',
    content: [
      {
        text: 'Returns are accepted only for:',
        list: [
          'Wrong item received',
          'Wrong size delivered',
          'Damaged or defective product',
          'Items must be unused with all original tags intact',
        ],
      },
      {
        subtitle: 'Return Window & Eligibility',
        text: 'You have 72 hours from the delivery date to request a return if you receive the wrong item, wrong size, or a damaged product. Items approved during the video call packing process are not eligible for return. Returns requested after 72 hours or for other reasons will not be accepted.',
      },
    ],
  },
  {
    id: 'non-returnable',
    icon: XCircle,
    title: 'Non-Returnable Items',
    content: [
      {
        text: 'The following items cannot be returned or exchanged:',
        list: [
          'Products approved during video call packing',
          'Items returned after 72 hours of delivery',
          'Used or worn items',
          'Items without original tags or packaging',
          'Sale or clearance items (unless damaged or wrong item)',
          'Customized or personalized items',
        ],
      },
    ],
  },
  {
    id: 'process',
    icon: Package,
    title: 'How to Return',
    content: [
      {
        subtitle: 'Step 1: Contact Us',
        text: 'Contact customer support via email at returns@hcfashionhouse.com within 72 hours of delivery. Provide your order number, reason for return (wrong item/size/damaged), and photos if applicable.',
      },
      {
        subtitle: 'Step 2: Prepare Documentation',
        text: 'Prepare an unboxing video if you received a damaged or wrong item. Ensure the product is unused with all original tags attached and in the original packaging.',
      },
      {
        subtitle: 'Step 3: Ship Your Return',
        text: 'After your return request is approved, you will be provided with the return address. Please ship the parcel via India Post (recommended for secure and legitimate delivery) or other courier services. Return shipping costs are to be borne by the customer.',
      },
      {
        subtitle: 'Step 4: Quality Check & Refund',
        text: 'Once we receive the returned product at our warehouse, a quality check will be performed. The product must be unused with all original tags intact. Refunds are processed within 5-7 business days and credited to your original payment method.',
      },
    ],
  },
  {
    id: 'exchanges',
    icon: RotateCcw,
    title: 'Exchanges',
    content: [
      {
        text: 'Exchanges are available only if you received the wrong size. Contact us within 72 hours of delivery.',
      },
      {
        subtitle: 'Exchange Process',
        list: [
          'Contact customer support via email at returns@hcfashionhouse.com',
          'Provide your order number and the correct size needed',
          'Follow instructions to return the incorrect size',
          'The correct size will be shipped once we receive and verify the return',
        ],
      },
      {
        subtitle: 'Size Exchange Policy',
        text: 'Size exchanges are subject to availability. If the desired size is out of stock, we will process a full refund to your original payment method.',
      },
    ],
  },
  {
    id: 'refunds',
    icon: CreditCard,
    title: 'Refund Information',
    content: [
      {
        subtitle: 'Refund Timeline',
        text: 'Refunds are processed within 5-7 business days after we receive and approve your return. Please allow an additional 5-10 business days for the refund to appear in your account, depending on your bank or payment provider.',
      },
      {
        subtitle: 'Refund Methods',
        list: [
          'UPI: Refunds are processed only via UPI transfer',
        ],
      },
      {
        subtitle: 'Shipping Costs',
        text: 'Shipping charges are refundable only if the return is due to our error (wrong item sent or damaged/defective product received).',
      },
    ],
  },
  {
    id: 'defective',
    icon: AlertCircle,
    title: 'Damaged or Defective Items',
    content: [
      {
        text: 'If you receive a damaged or defective item, please contact us within 72 hours at returns@hcfashionhouse.com.',
      },
      {
        subtitle: 'What to Do',
        list: [
          'Prepare an unboxing video showing the damage',
          'Take clear photos of the damaged/defective item',
          'Contact us within 72 hours of delivery',
          'Provide your order number, photos, and video',
          'After approval, ship the product to our address via India Post (recommended)',
        ],
      },
      {
        text: 'Refunds for damaged items will be processed after the product is received and verified at our warehouse.',
      },
    ],
  },
  {
    id: 'timeframe',
    icon: Clock,
    title: 'Important Timeframes',
    content: [
      {
        list: [
          'Return/Exchange Request: Within 72 hours of delivery',
          'Damaged Item Report: Within 72 hours of delivery',
          'Refund Processing: 5-7 business days after receipt and quality check',
          'Refund Crediting: 5-10 business days after processing',
          'Exchange Shipping: 3-7 business days after we receive and verify original item',
        ],
      },
    ],
  },
  {
    id: 'contact',
    icon: FileText,
    title: 'Need Help?',
    content: [
      {
        text: 'Our customer service team is here to assist you with any questions about returns and exchanges.',
      },
      {
        list: [
          'Email: returns@hcfashionhouse.com',
          'Phone: 1800-XXX-XXXX (Mon-Sat, 9 AM - 6 PM)',
          'Live Chat: Available on our website',
          'Visit: Any HC Fashion House retail store',
        ],
      },
    ],
  },
];

const Returns = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <RotateCcw className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Returns & Exchanges
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Your satisfaction is our priority. Returns accepted within 72 hours for wrong items, wrong size, or damaged products.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">72 Hours</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Return Window</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Free Pickup</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select Cities</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">5-7 Days</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Refund Process</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-teal-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Easy Exchange</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Size & Color</p>
            </div>
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <section.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {section.title}
                    </h2>
                    <div className="space-y-4">
                      {section.content.map((item, idx) => (
                        <div key={idx}>
                          {item.subtitle && (
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                              {item.subtitle}
                            </h3>
                          )}
                          {item.text && (
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                              {item.text}
                            </p>
                          )}
                          {item.list && (
                            <ul className="mt-2 space-y-2">
                              {item.list.map((listItem, listIdx) => (
                                <li
                                  key={listIdx}
                                  className="flex items-start gap-2 text-gray-600 dark:text-gray-300"
                                >
                                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                                  <span>{listItem}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 rounded-lg shadow-lg p-8 text-center text-white"
          >
            <h2 className="text-2xl font-bold mb-4">Ready to Return or Exchange?</h2>
            <p className="text-blue-100 mb-6">
              Log into your account to start the process
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/my-account"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Go to My Account
              </a>
              <a
                href="/contact-us"
                className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Returns;
