import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Shield, Lock, Eye, Database, UserCheck, Mail, Phone, MapPin } from 'lucide-react';

const sections = [
  {
    id: 'information-collection',
    icon: Database,
    title: '1. Information We Collect',
    content: [
      {
        subtitle: '1.1 Personal Information',
        text: 'When you create an account, place an order, or interact with our services, we may collect:',
        list: [
          'Name, email address, phone number',
          'Shipping and billing addresses',
          'Payment information (processed securely through our payment partners)',
          'Order history and preferences',
          'Account credentials',
        ],
      },
      {
        subtitle: '1.2 Automatically Collected Information',
        text: 'We automatically collect certain information when you visit our website:',
        list: [
          'Browser type and version',
          'IP address and device information',
          'Pages visited and time spent on our site',
          'Referring website addresses',
          'Cookies and similar tracking technologies',
        ],
      },
    ],
  },
  {
    id: 'use-of-information',
    icon: UserCheck,
    title: '2. How We Use Your Information',
    content: [
      {
        text: 'We use the collected information for the following purposes:',
        list: [
          'Process and fulfill your orders',
          'Provide customer support and respond to inquiries',
          'Send order confirmations and shipping updates',
          'Personalize your shopping experience',
          'Send promotional emails and special offers (with your consent)',
          'Improve our website, products, and services',
          'Detect and prevent fraud or unauthorized activities',
          'Comply with legal obligations',
        ],
      },
    ],
  },
  {
    id: 'information-sharing',
    icon: Eye,
    title: '3. Information Sharing and Disclosure',
    content: [
      {
        text: 'We do not sell your personal information. We may share your information with:',
        list: [
          'Service Providers: Third-party companies that help us operate our business (e.g., payment processors, shipping companies, email service providers)',
          'Legal Requirements: When required by law, court order, or government authorities',
          'Business Transfers: In connection with a merger, acquisition, or sale of assets',
          'With Your Consent: When you explicitly authorize us to share your information',
        ],
      },
    ],
  },
  {
    id: 'data-security',
    icon: Lock,
    title: '4. Data Security',
    content: [
      {
        text: 'We implement industry-standard security measures to protect your personal information:',
        list: [
          'SSL/TLS encryption for data transmission',
          'Secure payment processing through PCI-DSS compliant partners',
          'Regular security audits and updates',
          'Access controls and authentication measures',
          'Employee training on data protection',
        ],
      },
      {
        text: 'However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.',
      },
    ],
  },
  {
    id: 'cookies',
    icon: Database,
    title: '5. Cookies and Tracking Technologies',
    content: [
      {
        text: 'We use cookies and similar technologies to:',
        list: [
          'Remember your preferences and settings',
          'Analyze website traffic and usage patterns',
          'Provide personalized content and advertisements',
          'Enable shopping cart functionality',
        ],
      },
      {
        text: 'You can control cookies through your browser settings. Note that disabling cookies may limit some website functionality.',
      },
    ],
  },
  {
    id: 'your-rights',
    icon: Shield,
    title: '6. Your Rights and Choices',
    content: [
      {
        text: 'You have the following rights regarding your personal information:',
        list: [
          'Access: Request a copy of the personal information we hold about you',
          'Correction: Update or correct inaccurate information',
          'Deletion: Request deletion of your personal information (subject to legal obligations)',
          'Opt-out: Unsubscribe from marketing emails at any time',
          'Data Portability: Request your data in a structured, commonly used format',
        ],
      },
      {
        text: 'To exercise these rights, please contact us using the information provided below.',
      },
    ],
  },
  {
    id: 'children',
    icon: UserCheck,
    title: '7. Children\'s Privacy',
    content: [
      {
        text: 'Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.',
      },
    ],
  },
  {
    id: 'changes',
    icon: Database,
    title: '8. Changes to This Privacy Policy',
    content: [
      {
        text: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by:',
        list: [
          'Posting the updated policy on our website',
          'Updating the "Last Updated" date',
          'Sending an email notification for significant changes',
        ],
      },
      {
        text: 'Your continued use of our services after changes become effective constitutes acceptance of the updated policy.',
      },
    ],
  },
];

export default function PrivacyPolicy() {
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
                <Shield className="w-4 h-4" />
                Legal
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
                Privacy <span className="text-primary">Policy</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
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
                  HC Fashion House ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
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
                <h2 className="font-display text-2xl font-bold mb-6">Contact Us</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Email</p>
                      <a href="mailto:privacy@hcfashion.com" className="text-primary hover:underline">
                        privacy@hcfashion.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Phone</p>
                      <a href="tel:+919876543210" className="text-primary hover:underline">
                        +91 98765 43210
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Address</p>
                      <p className="text-muted-foreground">
                        HC Fashion House<br />
                        123 Fashion Street<br />
                        Mumbai, Maharashtra 400001<br />
                        India
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
