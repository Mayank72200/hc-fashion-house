import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { FileText, ShoppingBag, CreditCard, Truck, RotateCcw, Shield, AlertTriangle } from 'lucide-react';

const sections = [
  {
    id: 'acceptance',
    icon: FileText,
    title: '1. Acceptance of Terms',
    content: [
      {
        text: 'By accessing and using HC Fashion House website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',
      },
      {
        text: 'These terms apply to all users of the site, including browsers, customers, merchants, and contributors of content.',
      },
    ],
  },
  {
    id: 'account',
    icon: Shield,
    title: '2. User Accounts',
    content: [
      {
        subtitle: '2.1 Account Creation',
        text: 'To make purchases, you must create an account. You agree to:',
        list: [
          'Provide accurate, current, and complete information',
          'Maintain and promptly update your account information',
          'Maintain the security of your password',
          'Accept responsibility for all activities under your account',
          'Notify us immediately of any unauthorized use',
        ],
      },
      {
        subtitle: '2.2 Account Termination',
        text: 'We reserve the right to suspend or terminate your account if you violate these terms or engage in fraudulent or illegal activities.',
      },
    ],
  },
  {
    id: 'products-orders',
    icon: ShoppingBag,
    title: '3. Products and Orders',
    content: [
      {
        subtitle: '3.1 Product Information',
        text: 'We strive to provide accurate product descriptions and images. However:',
        list: [
          'Colors may vary due to monitor settings',
          'Product availability is subject to change',
          'Prices are subject to change without notice',
          'We reserve the right to limit quantities',
        ],
      },
      {
        subtitle: '3.2 Order Acceptance',
        text: 'Your order is an offer to purchase. We reserve the right to:',
        list: [
          'Accept or decline any order',
          'Limit order quantities',
          'Cancel orders due to pricing errors',
          'Verify payment information before processing',
        ],
      },
      {
        subtitle: '3.3 Pricing',
        text: 'All prices are in Indian Rupees (INR) and include applicable taxes unless otherwise stated. We reserve the right to correct pricing errors.',
      },
    ],
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: '4. Payment Terms',
    content: [
      {
        text: 'We accept the following payment methods:',
        list: [
          'Credit and Debit Cards (Visa, Mastercard, RuPay)',
          'UPI and Digital Wallets',
          'Net Banking',
        ],
      },
      {
        text: 'All orders are prepaid only. Cash on Delivery (COD) is not available.',
      },
      {
        text: 'Payment processing is handled by secure third-party payment gateways. We do not store complete credit card information on our servers.',
      },
      {
        text: 'You agree to pay all charges at the prices in effect when you place your order, including shipping fees and taxes.',
      },
    ],
  },
  {
    id: 'shipping',
    icon: Truck,
    title: '5. Shipping and Delivery',
    content: [
      {
        subtitle: '5.1 Shipping',
        list: [
          'Standard delivery: 5-7 business days',
          'Express delivery: 2-3 business days (additional charges apply)',
          'Free shipping on orders over ₹999',
          'Delivery times are estimates and not guaranteed',
        ],
      },
      {
        subtitle: '5.2 Delivery',
        text: 'You are responsible for:',
        list: [
          'Providing accurate shipping information',
          'Being available to receive deliveries',
          'Additional charges for re-delivery attempts',
        ],
      },
      {
        text: 'Risk of loss and title for items pass to you upon delivery to the carrier.',
      },
    ],
  },
  {
    id: 'returns',
    icon: RotateCcw,
    title: '6. Returns and Refunds',
    content: [
      {
        subtitle: '6.1 Return Policy',
        text: 'We accept returns within 72 hours of delivery for the following reasons:',
        list: [
          'Wrong item received',
          'Wrong size delivered',
          'Damaged or defective product',
          'Products must be unused with original tags and packaging intact',
          'Items approved during video call packing are not eligible for return',
        ],
      },
      {
        subtitle: '6.2 Refund Process',
        list: [
          'Refunds processed within 5-7 business days after receiving and verifying returned item',
          'Refunds are processed via UPI only',
          'Customer is responsible for return shipping via India Post (recommended)',
        ],
      },
      {
        subtitle: '6.3 Exchanges',
        text: 'Size exchanges are available within 72 hours of delivery if you received the wrong size. Exchanges are subject to availability.',
      },
    ],
  },
  {
    id: 'intellectual-property',
    icon: Shield,
    title: '7. Intellectual Property',
    content: [
      {
        text: 'All content on our website, including:',
        list: [
          'Text, graphics, logos, images',
          'Product descriptions and photography',
          'Software and code',
          'Design and layout',
        ],
      },
      {
        text: 'Is the property of HC Fashion House or our licensors and is protected by copyright, trademark, and other intellectual property laws.',
      },
      {
        text: 'You may not reproduce, distribute, modify, or create derivative works without our explicit written permission.',
      },
    ],
  },
  {
    id: 'prohibited-uses',
    icon: AlertTriangle,
    title: '8. Prohibited Uses',
    content: [
      {
        text: 'You agree not to:',
        list: [
          'Use our services for any unlawful purpose',
          'Impersonate any person or entity',
          'Transmit viruses or malicious code',
          'Attempt to gain unauthorized access',
          'Collect user information without consent',
          'Use automated systems to access the site',
          'Engage in any fraudulent activities',
          'Post offensive or inappropriate content',
        ],
      },
    ],
  },
  {
    id: 'liability',
    icon: Shield,
    title: '9. Limitation of Liability',
    content: [
      {
        text: 'To the fullest extent permitted by law:',
        list: [
          'We are not liable for any indirect, incidental, or consequential damages',
          'Our total liability shall not exceed the amount you paid for the product',
          'We do not warrant that our service will be uninterrupted or error-free',
          'We are not responsible for third-party content or services',
        ],
      },
    ],
  },
  {
    id: 'indemnification',
    icon: Shield,
    title: '10. Indemnification',
    content: [
      {
        text: 'You agree to indemnify and hold harmless HC Fashion House and its officers, directors, employees, and agents from any claims, losses, damages, liabilities, and expenses arising from:',
        list: [
          'Your use of our services',
          'Your violation of these terms',
          'Your violation of any rights of another party',
          'Your violation of any applicable laws',
        ],
      },
    ],
  },
  {
    id: 'governing-law',
    icon: FileText,
    title: '11. Governing Law',
    content: [
      {
        text: 'These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.',
      },
    ],
  },
  {
    id: 'changes',
    icon: FileText,
    title: '12. Changes to Terms',
    content: [
      {
        text: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of our services after changes constitutes acceptance of the modified terms.',
      },
      {
        text: 'We will notify you of significant changes via email or website notification.',
      },
    ],
  },
];

export default function TermsOfService() {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          
          <div className="container relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <FileText className="w-4 h-4" />
                Legal
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
                Terms of <span className="text-primary">Service</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Please read these terms carefully before using our services. By using HC Fashion House, you agree to these terms.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Last Updated: January 4, 2026
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              {/* Introduction */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-12 prose prose-lg dark:prose-invert max-w-none"
              >
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Welcome to HC Fashion House. These Terms of Service ("Terms") govern your use of our website and services. Please read them carefully.
                </p>
              </motion.div>

              {/* Sections */}
              <div className="space-y-12">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="scroll-mt-24"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <section.icon className="w-6 h-6" />
                      </div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold flex-1">
                        {section.title}
                      </h2>
                    </div>

                    <div className="pl-16 space-y-6">
                      {section.content.map((block, blockIndex) => (
                        <div key={blockIndex}>
                          {block.subtitle && (
                            <h3 className="font-semibold text-lg mb-3">
                              {block.subtitle}
                            </h3>
                          )}
                          {block.text && (
                            <p className="text-muted-foreground leading-relaxed mb-3">
                              {block.text}
                            </p>
                          )}
                          {block.list && (
                            <ul className="space-y-2">
                              {block.list.map((item, itemIndex) => (
                                <li 
                                  key={itemIndex}
                                  className="flex items-start gap-3 text-muted-foreground"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                  <span className="leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mt-16 p-8 bg-muted/30 rounded-2xl"
              >
                <h2 className="font-display text-2xl font-bold mb-6">Questions About These Terms?</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:legal@hcfashion.com" className="text-primary hover:underline">
                      legal@hcfashion.com
                    </a>
                  </p>
                  <p>
                    <strong>Phone:</strong>{' '}
                    <a href="tel:+919876543210" className="text-primary hover:underline">
                      +91 98765 43210
                    </a>
                  </p>
                  <p>
                    <strong>Address:</strong> HC Fashion House, 123 Fashion Street, Mumbai, Maharashtra 400001, India
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
