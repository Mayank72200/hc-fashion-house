import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import AllProducts from "./pages/AllProducts";
import Segment from "./pages/Segment";
import Product from "./pages/Product";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import MyAccount from "./pages/MyAccount";
import OrderHistory from "./pages/OrderHistory";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import StoreLocator from "./pages/StoreLocator";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import FAQs from "./pages/FAQs";
import ShippingInfo from "./pages/ShippingInfo";
import Returns from "./pages/Returns";
import SizeGuide from "./pages/SizeGuide";
import TrackOrder from "./pages/TrackOrder";

// Admin pages
import {
  AdminLayout,
  AdminDashboard,
  AdminProducts,
  AdminProductForm,
  AdminCategories,
  AdminStock,
  AdminOrders,
} from "./pages/admin";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <TooltipProvider>
                  {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/products" element={<AllProducts />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/account" element={<MyAccount />} />
                    <Route path="/orders" element={<OrderHistory />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/stores" element={<StoreLocator />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/faqs" element={<FAQs />} />
                    <Route path="/shipping" element={<ShippingInfo />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/size-guide" element={<SizeGuide />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="products/new" element={<AdminProductForm />} />
                      <Route path="products/:id/edit" element={<AdminProductForm />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="stock" element={<AdminStock />} />
                      <Route path="orders" element={<AdminOrders />} />
                    </Route>
                    
                    <Route path="/:segment" element={<Segment />} />
                    <Route path="/product/:id" element={<Product />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TooltipProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
