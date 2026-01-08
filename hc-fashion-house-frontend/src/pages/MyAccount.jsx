import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Loader2, 
  Edit2, 
  Trash2, 
  Plus, 
  X, 
  Check,
  Home,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';

// Mock data for addresses
const initialAddresses = [
  {
    id: 1,
    fullName: 'John Doe',
    phone: '+91 98765 43210',
    addressLine1: '123 Fashion Street',
    addressLine2: 'Near Central Mall',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
    type: 'home',
    isDefault: true,
  },
  {
    id: 2,
    fullName: 'John Doe',
    phone: '+91 98765 43210',
    addressLine1: 'Office Tower, 5th Floor',
    addressLine2: 'Business Park',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    country: 'India',
    type: 'work',
    isDefault: false,
  },
];



export default function MyAccount() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile state
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    whatsappSameAsPhone: false,
    dateOfBirth: '',
  });
  
  // Addresses state
  const [addresses, setAddresses] = useState(initialAddresses);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    type: 'home',
    isDefault: false,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/account' } } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Initialize profile with user data
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
        phone: user.user_metadata?.phone || '',
      }));
      setIsLoading(false);
    }
  }, [user]);

  // Handle profile change
  const handleProfileChange = (field, value) => {
    if (field === 'whatsappSameAsPhone') {
      setProfile(prev => ({
        ...prev,
        whatsappSameAsPhone: value,
        whatsapp: value ? prev.phone : prev.whatsapp,
      }));
    } else if (field === 'phone') {
      setProfile(prev => ({
        ...prev,
        phone: value,
        whatsapp: prev.whatsappSameAsPhone ? value : prev.whatsapp,
      }));
    } else {
      setProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle address form change
  const handleAddressFormChange = (field, value) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
  };

  // Open add address modal
  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddressForm({
      fullName: profile.fullName,
      phone: profile.phone,
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      type: 'home',
      isDefault: false,
    });
    setIsAddressModalOpen(true);
  };

  // Open edit address modal
  const openEditAddressModal = (address) => {
    setEditingAddress(address);
    setAddressForm({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      type: address.type,
      isDefault: address.isDefault,
    });
    setIsAddressModalOpen(true);
  };

  // Save address
  const saveAddress = () => {
    if (editingAddress) {
      // Update existing address
      setAddresses(prev => prev.map(addr => {
        if (addr.id === editingAddress.id) {
          return { ...addressForm, id: addr.id };
        }
        // Remove default from other addresses if this one is set as default
        if (addressForm.isDefault && addr.isDefault) {
          return { ...addr, isDefault: false };
        }
        return addr;
      }));
    } else {
      // Add new address
      const newAddress = {
        ...addressForm,
        id: Date.now(),
      };
      setAddresses(prev => {
        // Remove default from other addresses if this one is set as default
        if (addressForm.isDefault) {
          return [...prev.map(addr => ({ ...addr, isDefault: false })), newAddress];
        }
        return [...prev, newAddress];
      });
    }
    setIsAddressModalOpen(false);
  };

  // Delete address
  const deleteAddress = (addressId) => {
    setAddresses(prev => prev.filter(addr => addr.id !== addressId));
  };

  // Set address as default
  const setAsDefault = (addressId) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId,
    })));
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7] dark:bg-[#0B0F19]">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A24D]" />
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF9F7] dark:bg-[#0B0F19] transition-colors duration-300">
        <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1C1C1C] dark:text-[#F9FAFB] mb-2">
              My Account
            </h1>
            <p className="text-[#6B7280] dark:text-[#CBD5E1]">
              Manage your profile and addresses
            </p>
          </div>

          {/* Tab Navigation - Desktop */}
          <div className="hidden md:flex gap-2 mb-8 bg-white dark:bg-[#111827] p-2 rounded-xl shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A]'
                    : 'text-[#6B7280] dark:text-[#CBD5E1] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937]'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Navigation - Mobile */}
          <div className="flex md:hidden gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A]'
                    : 'bg-white dark:bg-[#111827] text-[#6B7280] dark:text-[#CBD5E1]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {/* Profile Section */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#C9A24D]/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-[#C9A24D]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">
                        Profile Information
                      </h2>
                      <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                        Update your personal details
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                        <input
                          type="text"
                          value={profile.fullName}
                          onChange={(e) => handleProfileChange('fullName', e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full h-12 pl-12 pr-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Email (Read-only) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                        <input
                          type="email"
                          value={profile.email}
                          readOnly
                          className="w-full h-12 pl-12 pr-4 bg-[#F3F4F6] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#6B7280] dark:text-[#9CA3AF] cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-[#9CA3AF]">Email cannot be changed</p>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => handleProfileChange('phone', e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full h-12 pl-12 pr-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                        <input
                          type="date"
                          value={profile.dateOfBirth}
                          onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                          className="w-full h-12 pl-12 pr-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] focus:outline-none focus:border-[#C9A24D] transition-colors"
                        />
                      </div>
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                        WhatsApp Number
                      </label>
                      <div className="relative">
                        <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                        <input
                          type="tel"
                          value={profile.whatsappSameAsPhone ? profile.phone : profile.whatsapp}
                          onChange={(e) => handleProfileChange('whatsapp', e.target.value)}
                          placeholder="+91 98765 43210"
                          disabled={profile.whatsappSameAsPhone}
                          className={`w-full h-12 pl-12 pr-4 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors ${
                            profile.whatsappSameAsPhone
                              ? 'bg-[#F3F4F6] dark:bg-[#1F2937] text-[#6B7280] dark:text-[#9CA3AF] cursor-not-allowed'
                              : 'bg-transparent'
                          }`}
                        />
                      </div>
                      {/* Same as phone checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer group mt-2">
                        <div
                          onClick={() => handleProfileChange('whatsappSameAsPhone', !profile.whatsappSameAsPhone)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                            profile.whatsappSameAsPhone
                              ? 'bg-[#C9A24D] border-[#C9A24D]'
                              : 'border-[#E5E7EB] dark:border-[#1F2937] group-hover:border-[#C9A24D]'
                          }`}
                        >
                          {profile.whatsappSameAsPhone && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                          Same as phone number
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="mt-8 flex justify-end">
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-3 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                      Save Changes
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Addresses Section */}
            {activeTab === 'addresses' && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#C9A24D]/10 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-[#C9A24D]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">
                          Saved Addresses
                        </h2>
                        <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                          Manage your delivery addresses
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={openAddAddressModal}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-medium rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Address</span>
                    </motion.button>
                  </div>

                  {/* Address Cards */}
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
                      <p className="text-[#6B7280] dark:text-[#CBD5E1]">
                        No addresses saved yet
                      </p>
                      <button
                        onClick={openAddAddressModal}
                        className="mt-4 text-[#C9A24D] font-medium hover:underline"
                      >
                        Add your first address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`relative p-5 rounded-xl border transition-all duration-200 ${
                            address.isDefault
                              ? 'border-[#C9A24D] bg-[#C9A24D]/5'
                              : 'border-[#E5E7EB] dark:border-[#1F2937] hover:border-[#C9A24D]/50'
                          }`}
                        >
                          {/* Type & Default Badge */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              address.type === 'home'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            }`}>
                              {address.type === 'home' ? <Home className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                              {address.type === 'home' ? 'Home' : 'Work'}
                            </span>
                            {address.isDefault && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#C9A24D]/10 text-[#C9A24D]">
                                <Check className="w-3 h-3" />
                                Default
                              </span>
                            )}
                          </div>

                          {/* Address Details */}
                          <p className="font-medium text-[#1C1C1C] dark:text-[#F9FAFB] mb-1">
                            {address.fullName}
                          </p>
                          <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1] mb-1">
                            {address.phone}
                          </p>
                          <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </p>
                          <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                            {address.country}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                            <button
                              onClick={() => openEditAddressModal(address)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#6B7280] dark:text-[#CBD5E1] hover:text-[#C9A24D] transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteAddress(address.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#6B7280] dark:text-[#CBD5E1] hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                            {!address.isDefault && (
                              <button
                                onClick={() => setAsDefault(address.id)}
                                className="ml-auto text-sm font-medium text-[#C9A24D] hover:underline"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Address Modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAddressModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111827] rounded-2xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#E5E7EB] dark:border-[#1F2937] bg-white dark:bg-[#111827]">
                <h3 className="text-xl font-semibold text-[#1C1C1C] dark:text-[#F9FAFB]">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <button
                  onClick={() => setIsAddressModalOpen(false)}
                  className="p-2 text-[#6B7280] hover:text-[#1C1C1C] dark:hover:text-[#F9FAFB] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={addressForm.fullName}
                      onChange={(e) => handleAddressFormChange('fullName', e.target.value)}
                      placeholder="John Doe"
                      className="w-full h-11 px-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => handleAddressFormChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-11 px-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors"
                    />
                  </div>
                </div>

                {/* Address Lines */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine1}
                    onChange={(e) => handleAddressFormChange('addressLine1', e.target.value)}
                    placeholder="House no., Building, Street"
                    className="w-full h-11 px-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={(e) => handleAddressFormChange('addressLine2', e.target.value)}
                    placeholder="Landmark, Area (optional)"
                    className="w-full h-11 px-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors"
                  />
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                      City *
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => handleAddressFormChange('city', e.target.value)}
                      placeholder="Mumbai"
                      className="w-full h-11 px-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                      State *
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => handleAddressFormChange('state', e.target.value)}
                      placeholder="Maharashtra"
                      className="w-full h-11 px-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) => handleAddressFormChange('pincode', e.target.value)}
                      placeholder="400001"
                      className="w-full h-11 px-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors"
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(e) => handleAddressFormChange('country', e.target.value)}
                    placeholder="India"
                    className="w-full h-11 px-4 bg-transparent border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl text-[#1C1C1C] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C9A24D] transition-colors"
                  />
                </div>

                {/* Address Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#1C1C1C] dark:text-[#F9FAFB]">
                    Address Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddressFormChange('type', 'home')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-all duration-200 ${
                        addressForm.type === 'home'
                          ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] border-transparent'
                          : 'border-[#E5E7EB] dark:border-[#1F2937] text-[#6B7280] dark:text-[#CBD5E1] hover:border-[#C9A24D]'
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      Home
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddressFormChange('type', 'work')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-all duration-200 ${
                        addressForm.type === 'work'
                          ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] border-transparent'
                          : 'border-[#E5E7EB] dark:border-[#1F2937] text-[#6B7280] dark:text-[#CBD5E1] hover:border-[#C9A24D]'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      Work
                    </button>
                  </div>
                </div>

                {/* Set as Default */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => handleAddressFormChange('isDefault', !addressForm.isDefault)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                      addressForm.isDefault
                        ? 'bg-[#C9A24D] border-[#C9A24D]'
                        : 'border-[#E5E7EB] dark:border-[#1F2937] group-hover:border-[#C9A24D]'
                    }`}
                  >
                    {addressForm.isDefault && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
                    Set as default address
                  </span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-[#E5E7EB] dark:border-[#1F2937] bg-white dark:bg-[#111827]">
                <button
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-6 py-2.5 border border-[#E5E7EB] dark:border-[#1F2937] text-[#6B7280] dark:text-[#CBD5E1] font-medium rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] transition-all duration-200"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={saveAddress}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 bg-[#1C1C1C] dark:bg-white text-white dark:text-[#0F172A] font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
