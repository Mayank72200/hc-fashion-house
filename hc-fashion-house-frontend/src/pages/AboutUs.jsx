import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { 
  ShoppingBag, 
  Users, 
  Award, 
  TrendingUp, 
  Heart, 
  Globe, 
  Target,
  Zap,
  Shield,
  Clock
} from 'lucide-react';

const stats = [
  { label: 'Years in Business', value: '30+', icon: Clock },
  { label: 'Happy Customers', value: '50K+', icon: Users },
  { label: 'Products', value: '5000+', icon: ShoppingBag },
  { label: 'Pin Codes Served', value: '1000+', icon: Globe },
];

const values = [
  {
    icon: Heart,
    title: 'Customer First',
    description: 'Every decision we make puts our customers at the center. Your satisfaction drives everything we do.',
  },
  {
    icon: Award,
    title: 'Quality Guaranteed',
    description: 'We source only the finest footwear from trusted brands and ensure every product meets our high standards.',
  },
  {
    icon: Shield,
    title: 'Authenticity',
    description: '100% genuine products. We stand behind every pair of shoes we sell with our authenticity guarantee.',
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'Constantly evolving to bring you the latest trends and the most convenient shopping experience.',
  },
];

const milestones = [
  {
    year: '1994',
    title: 'The Beginning',
    description: 'HC Fashion House was founded with a single store in Jodhpur, Rajasthan, driven by a passion for quality footwear.',
  },
  {
    year: '2005',
    title: 'Wholesale Expansion',
    description: 'Expanded into wholesale business, growing to 100+ wholesale customers who purchase from us and sell goods at their shops across the region.',
  },
  {
    year: '2015',
    title: 'Authorized Retailer',
    description: 'Became authorized retailers for premium brands including Campus, JQR, and BATA. Expanded our store size to serve customers better.',
  },
  {
    year: '2024',
    title: 'Going Digital',
    description: 'Launched our e-commerce platform, bringing our curated collection of quality footwear to customers across India through online shopping.',
  },
];

export default function AboutUs() {
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
                <Users className="w-4 h-4" />
                Our Story
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
                About <span className="text-primary">HC Fashion House</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                For over 30 years, we've been helping people step into style with premium footwear from trusted brands like Campus, JQR, and BATA.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 border-b">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div className="font-display text-3xl md:text-4xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-6" id="story">
                  Our Journey
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  What started as a small family-owned shoe store in Jodhpur has grown into a trusted footwear destination with a strong wholesale network and now an online presence.
                </p>
              </motion.div>

              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row gap-6 items-start"
                  >
                    <div className="flex-shrink-0 w-24">
                      <div className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                        {milestone.year}
                      </div>
                    </div>
                    <div className="flex-1 bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <h3 className="font-display text-xl font-bold mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                Our Values
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The principles that guide everything we do and make HC Fashion House a trusted name in footwear.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-3">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary text-primary-foreground mb-6">
                  <Target className="w-8 h-8" />
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                  Our Mission
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  To make premium, stylish, and comfortable footwear accessible to everyone. We believe that the right pair of shoes can change how you walk through life, and we're here to help you find that perfect pair.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Quality First</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border">
                    <Heart className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Customer Focused</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Excellence Always</span>
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
