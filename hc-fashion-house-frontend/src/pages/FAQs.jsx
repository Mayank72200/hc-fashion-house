import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { HelpCircle, ChevronDown, Search, ShoppingBag, Truck, RotateCcw, CreditCard, Shield, Package } from 'lucide-react';
import { useState } from 'react';

const categories = [
  { id: 'all', name: 'All Questions', icon: HelpCircle },
  { id: 'orders', name: 'Orders', icon: ShoppingBag },
  { id: 'shipping', name: 'Shipping', icon: Truck },
  { id: 'returns', name: 'Returns & Exchanges', icon: RotateCcw },
  { id: 'payment', name: 'Payment', icon: CreditCard },
  { id: 'account', name: 'Account', icon: Shield },
  { id: 'products', name: 'Products', icon: Package },
];

const faqs = [
  {
    category: 'orders',
    question: 'How do I place an order?',
    answer: 'Browse our collection, select your desired products, choose size and quantity, add to cart, and proceed to checkout. You\'ll need to create an account or log in to complete your purchase. Follow the prompts to enter shipping information and payment details.',
  },
  {
    category: 'orders',
    question: 'Can I modify or cancel my order?',
    answer: 'You can modify or cancel your order within 1 hour of placing it. Go to "My Account" > "Order History" and select the order you wish to modify. If the order has already been processed, please contact our customer support for assistance.',
  },
  {
    category: 'orders',
    question: 'How can I track my order?',
    answer: 'Once your order is shipped, you\'ll receive a tracking number via email. You can also track your order by logging into your account and visiting the "Order History" section. Click on the specific order to view real-time tracking information.',
  },
  {
    category: 'shipping',
    question: 'What are the shipping charges?',
    answer: 'We offer free standard shipping on all orders above ₹999. For orders below ₹999, a flat shipping fee of ₹99 applies. Express shipping is available for ₹199 and delivers within 1-2 business days in major cities.',
  },
  {
    category: 'shipping',
    question: 'How long does delivery take?',
    answer: 'Standard shipping typically takes 3-7 business days depending on your location. Metro cities usually receive orders within 3-4 days, while remote areas may take up to 7 days. Express shipping delivers within 1-2 business days in major cities.',
  },
  {
    category: 'shipping',
    question: 'Do you ship internationally?',
    answer: 'Currently, we only ship within India. We\'re working on expanding our services to international locations. Please subscribe to our newsletter to stay updated on international shipping availability.',
  },
  {
    category: 'shipping',
    question: 'What if I\'m not available for delivery?',
    answer: 'Our delivery partner will attempt delivery 3 times. If you\'re unavailable, they\'ll leave a notification with instructions. You can also contact the courier to reschedule delivery or arrange for pickup from their local office.',
  },
  {
    category: 'returns',
    question: 'What is your return policy?',
    answer: 'We accept returns within 72 hours of delivery for wrong items, wrong size, or damaged products. Products must be unused with original tags attached. Items approved during video call packing are not eligible for return. Visit our Returns page for complete details.',
  },
  {
    category: 'returns',
    question: 'How do I initiate a return?',
    answer: 'Contact us via email at returns@hcfashionhouse.com within 72 hours of delivery. Provide your order number, reason for return (wrong item/size/damaged), photos, and unboxing video if applicable. We will review and provide return instructions.',
  },
  {
    category: 'returns',
    question: 'Can I exchange an item for a different size?',
    answer: 'Yes, you can request a size exchange within 72 hours of delivery if you received the wrong size. Contact us via email at returns@hcfashionhouse.com with your order number and the correct size needed. Exchanges are subject to availability.',
  },
  {
    category: 'returns',
    question: 'When will I receive my refund?',
    answer: 'Refunds are processed within 5-7 business days after we receive and verify your returned item at our warehouse. Refunds are processed via UPI only. Please allow an additional 3-5 business days for the amount to reflect in your account.',
  },
  {
    category: 'payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept Credit Cards (Visa, MasterCard, RuPay), Debit Cards, Net Banking, UPI, and popular digital wallets (Paytm, PhonePe, Google Pay). All orders are prepaid only.',
  },
  {
    category: 'payment',
    question: 'Is it safe to use my credit card on your website?',
    answer: 'Yes, absolutely! We use industry-standard SSL encryption to protect your payment information. All transactions are processed through secure payment gateways certified by PCI-DSS. We never store your complete credit card details on our servers.',
  },
  {
    category: 'payment',
    question: 'Do you offer EMI options?',
    answer: 'Yes, we offer No Cost EMI options on orders above ₹3,000 through select credit cards and digital payment providers. Available EMI tenures include 3, 6, 9, and 12 months. Check eligibility at checkout.',
  },
  {
    category: 'payment',
    question: 'What should I do if my payment fails?',
    answer: 'If your payment fails, please check your card limits, account balance, and internet connection. Try again after a few minutes. If the issue persists, try a different payment method or contact your bank. You can also reach our support team for assistance.',
  },
  {
    category: 'account',
    question: 'How do I create an account?',
    answer: 'Click on the "Sign Up" button in the top right corner of our website. Enter your email address, create a password, and fill in your basic information. You\'ll receive a verification email to activate your account.',
  },
  {
    category: 'account',
    question: 'I forgot my password. What should I do?',
    answer: 'Click on "Forgot Password" on the login page. Enter your registered email address, and we\'ll send you a password reset link. Click the link in the email and follow the instructions to create a new password.',
  },
  {
    category: 'account',
    question: 'How do I update my account information?',
    answer: 'Log into your account and go to "My Account" > "Profile Settings." Here you can update your personal information, email address, phone number, and saved addresses. Don\'t forget to save your changes.',
  },
  {
    category: 'account',
    question: 'Can I have multiple addresses saved?',
    answer: 'Yes! You can save multiple shipping addresses in your account. Go to "My Account" > "Address Book" to add, edit, or delete addresses. You can set a default address for faster checkout.',
  },
  {
    category: 'products',
    question: 'How do I know which size to order?',
    answer: 'Each product page has a detailed size guide. Click on "Size Guide" near the size selector. We provide measurements in both Indian and international sizing. If you\'re between sizes, we recommend sizing up for a more comfortable fit.',
  },
  {
    category: 'products',
    question: 'Are the product colors accurate?',
    answer: 'We strive to display accurate product colors, but slight variations may occur due to monitor settings and lighting. Product descriptions include detailed color information. Check customer reviews for real-life photos and feedback.',
  },
  {
    category: 'products',
    question: 'Do you restock sold-out items?',
    answer: 'Popular items are typically restocked, but availability depends on the manufacturer. Click "Notify Me" on sold-out product pages to receive an email when the item is back in stock. Follow us on social media for restock announcements.',
  },
  {
    category: 'products',
    question: 'Are your products authentic?',
    answer: 'Yes, we guarantee 100% authentic products. We source directly from authorized distributors and brands. Every product comes with authenticity certificates and original packaging. We have a strict no-counterfeit policy.',
  },
];

const FAQs = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

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
              <HelpCircle className="w-12 h-12" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Find answers to common questions about orders, shipping, returns, and more.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-white/50 focus:outline-none shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md hover:scale-105'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  {category.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* FAQ List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto space-y-4"
          >
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  No FAQs found matching your search.
                </p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">
                  Try adjusting your search terms or browse by category.
                </p>
              </div>
            ) : (
              filteredFAQs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                        {faq.question}
                      </h3>
                    </div>
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
                    <div className="px-6 pb-5 pl-[52px]">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Still Need Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-2xl p-8 text-center text-white shadow-xl"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Still Have Questions?
            </h2>
            <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our customer support team is here to help!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                Contact Support
              </a>
              <a
                href="tel:+911800123456"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Us: 1800-123-4567
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQs;
