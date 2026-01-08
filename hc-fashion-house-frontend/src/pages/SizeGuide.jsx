import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Ruler, User, ShoppingBag, Info } from 'lucide-react';
import { useState } from 'react';

const SizeGuide = () => {
  const [selectedCategory, setSelectedCategory] = useState('men-shoes');

  const categories = [
    { id: 'men-shoes', label: 'Men\'s Shoes', icon: User },
    { id: 'women-shoes', label: 'Women\'s Shoes', icon: User },
    { id: 'kids-shoes', label: 'Kids\' Shoes', icon: User },
  ];

  const sizeData = {
    'men-shoes': {
      title: 'Men\'s Shoe Size Chart',
      headers: ['IND', 'EU', 'Foot Length (cm)'],
      rows: [
        ['6', '40', '24.5'],
        ['7', '41', '25.0'],
        ['8', '42', '25.5'],
        ['9', '43', '26.0'],
        ['10', '44', '26.5'],
        ['11', '45', '27.0'],
        ['12', '46', '27.5'],
      ],
    },
    'women-shoes': {
      title: 'Women\'s Shoe Size Chart',
      headers: ['IND', 'EU', 'Foot Length (cm)'],
      rows: [
        ['3', '36', '22.5'],
        ['4', '37', '23.0'],
        ['5', '38', '23.5'],
        ['6', '39', '24.0'],
        ['7', '40', '24.5'],
        ['8', '41', '25.0'],
        ['9', '42', '25.5'],
      ],
    },
    'kids-shoes': {
      title: 'Kids\' Shoe Size Chart',
      headers: ['IND', 'EU', 'Foot Length (cm)'],
      rows: [
        ['8C', '25', '15.5'],
        ['9C', '26', '16.0'],
        ['10C', '27', '16.5'],
        ['11C', '28', '17.0'],
        ['12C', '29', '17.5'],
        ['13C', '30', '18.0'],
        ['1', '31', '18.5'],
        ['2', '32', '19.0'],
        ['3', '33', '19.5'],
        ['4', '34', '20.0'],
        ['5', '35', '20.5'],
      ],
    },
  };

  const measurementTips = [
    {
      title: 'Foot Length',
      description: 'Stand on a piece of paper and mark the heel and longest toe. Measure the distance between these points in centimeters.',
    },
    {
      title: 'Measure in the Evening',
      description: 'Feet tend to swell during the day, so measure in the evening for the most accurate size.',
    },
    {
      title: 'Wear Socks',
      description: 'If you usually wear socks with your shoes, wear them while measuring for accurate fit.',
    },
    {
      title: 'Measure Both Feet',
      description: 'Measure both feet as they may differ slightly. Use the larger measurement for sizing.',
    },
  ];

  const fitTips = [
    'Always refer to the specific size chart for each product',
    'When between sizes, size up for a more comfortable fit',
    'Different brands may have slight variations in sizing',
    'Check the product description for fit notes (slim fit, relaxed fit, etc.)',
    'Read customer reviews for sizing insights',
    'Contact our customer service if you need assistance',
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-pink-600 dark:from-indigo-800 dark:to-pink-800 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Ruler className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Size Guide
              </h1>
              <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
                Find your perfect fit with our comprehensive size charts and measurement tips
              </p>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Category Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCategory === category.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                  }`}
                >
                  <category.icon className={`w-6 h-6 mx-auto mb-2 ${
                    selectedCategory === category.id
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                  <p className={`text-sm font-semibold ${
                    selectedCategory === category.id
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {category.label}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Size Chart */}
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {sizeData[selectedCategory].title}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {sizeData[selectedCategory].headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sizeData[selectedCategory].rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            cellIdx === 0
                              ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Measurement Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Ruler className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                How to Measure
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {measurementTips.map((tip, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      {idx + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {tip.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {tip.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Fit Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Fit Tips & Recommendations
              </h2>
            </div>
            <ul className="space-y-3">
              {fitTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-pink-600 dark:text-pink-400 mt-1">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">{tip}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 bg-gradient-to-r from-indigo-600 to-pink-600 dark:from-indigo-800 dark:to-pink-800 rounded-lg shadow-lg p-8 text-center text-white"
          >
            <h2 className="text-2xl font-bold mb-4">Still Unsure About Your Size?</h2>
            <p className="text-indigo-100 mb-6">
              Our customer service team is here to help you find the perfect fit
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/contact-us"
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Contact Us
              </a>
              <a
                href="/all-products"
                className="bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition-colors"
              >
                Start Shopping
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default SizeGuide;
