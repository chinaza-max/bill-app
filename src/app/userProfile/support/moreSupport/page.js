'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageCircle,
  User,
  Mail,
  Phone,
  FileText,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const GeneralInquiryPage = () => {
  const router = useRouter();
  const [inquiryType, setInquiryType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: '',
    message: ''
  });

  const handleBack = () => {
    router.back();
  };

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-emerald-700 px-4 mb-2">{title}</h2>
      <div className="bg-white rounded-lg shadow-sm">{children}</div>
    </div>
  );

  const InquiryTypes = [
    {
      icon: User,
      title: 'Account Inquiry',
      subtitle: 'Questions about your account',
      value: 'account'
    },
    {
      icon: Mail,
      title: 'Billing Inquiry',
      subtitle: 'Billing and payment related',
      value: 'billing'
    },
    {
      icon: Phone,
      title: 'Technical Support',
      subtitle: 'General technical questions',
      value: 'technical'
    },
    {
      icon: FileText,
      title: 'General Questions',
      subtitle: 'Other types of inquiries',
      value: 'general'
    }
  ];

  const MenuItem = ({ icon: Icon, title, subtitle, value, highlight }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-between p-4 border-b border-amber-100 last:border-0 hover:bg-emerald-50/30"
      onClick={() => {
        setInquiryType(value);
        setFormData(prev => ({
          ...prev,
          inquiryType: value
        }));
      }}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full ${highlight ? 'bg-emerald-50' : 'bg-amber-50'} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${highlight ? 'text-emerald-600' : 'text-amber-600'}`} />
        </div>
        <div className="text-left">
          <div className="text-amber-900 font-medium">{title}</div>
          {subtitle && (
            <div className={`text-sm ${highlight ? 'text-emerald-600' : 'text-amber-500'}`}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <ChevronRight className={`h-5 w-5 ${highlight ? 'text-emerald-400' : 'text-amber-400'}`} />
    </motion.button>
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement actual submission logic
    console.log('Inquiry Submitted:', formData);
    router.push('/support');
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft className="h-6 w-6 cursor-pointer" onClick={handleBack} />
          <h1 className="text-lg font-semibold">General Inquiry</h1>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-auto py-4">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-amber-900 mb-2" htmlFor="name">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-amber-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-amber-900 mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-amber-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-amber-900 mb-2" htmlFor="phone">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-amber-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-amber-900 mb-2" htmlFor="message">
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full border border-amber-200 rounded-lg p-3 h-32 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe your inquiry in detail"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Submit Inquiry
              </motion.button>
            </form>

        {/* Additional Information */}
        <Section title="Need More Help?">
          <div className="p-4 text-center">
            <p className="text-amber-700 mb-2">
              Our support team is ready to assist you.
            </p>
            <p className="text-amber-600 text-sm">
              Response time: Within 24-48 hours
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default GeneralInquiryPage;