import { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Mail, 
  Search,
  Navigation,
  Store,
  ChevronRight
} from 'lucide-react';

const stores = [
  {
    id: 1,
    name: 'HC Fashion House - Pipar City',
    address: 'Main Market, Near Holi Dhara, Pipar City, Jodhpur, Rajasthan 342601',
    phone: '+91 1800-123-4567',
    email: 'support@hcfashionhouse.com',
    hours: 'Mon - Sat: 10:00 AM - 8:00 PM',
    city: 'Jodhpur',
    state: 'Rajasthan',
    type: 'Main Store',
  },
];

export default function StoreLocator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);

  const filteredStores = stores.filter(store => 
    store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <Store className="w-4 h-4" />
                Find Us
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
                Store <span className="text-primary">Locator</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                Visit us at our store in Jodhpur, Rajasthan for a personalized shopping experience.
              </p>

              {/* Search Bar */}
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by city, state, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg rounded-xl"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stores Grid */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-6">
              {filteredStores.length > 0 ? (
                filteredStores.map((store, index) => (
                  <motion.div
                    key={store.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`bg-card border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer ${
                      selectedStore?.id === store.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedStore(store)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-display text-xl font-bold">
                            {store.name}
                          </h3>
                          {store.type === 'Flagship Store' && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              Flagship
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {store.city}, {store.state}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Store className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          {store.address}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <a 
                          href={`tel:${store.phone}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {store.phone}
                        </a>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <a 
                          href={`mailto:${store.email}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {store.email}
                        </a>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          {store.hours}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://maps.google.com/?q=${encodeURIComponent(store.address)}`, '_blank');
                        }}
                      >
                        <Navigation className="w-4 h-4" />
                        Get Directions
                      </Button>
                      <Button 
                        className="flex-1 gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${store.phone}`;
                        }}
                      >
                        <Phone className="w-4 h-4" />
                        Call Now
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">No stores found</h3>
                  <p className="text-muted-foreground">
                    Try searching with a different city or location.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Can't Find a Store Near You?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Shop online and get your favorite footwear delivered to your doorstep with free shipping on orders over ₹999.
              </p>
              <Button size="lg" className="gap-2" asChild>
                <a href="/products">
                  Shop Online
                  <ChevronRight className="w-5 h-5" />
                </a>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
