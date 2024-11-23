'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageCircle,
  AlertOctagon,
  Send,
  Book,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const SupportPage = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleBack = () => {
    router.push('/home');
  };

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-emerald-700 px-4 mb-2">{title}</h2>
      <div className="bg-white rounded-lg shadow-sm">{children}</div>
    </div>
  );

  const SupportCategories = [
    {
      icon: MessageCircle,
      title: 'General Inquiry',
      subtitle: 'Ask about our services',
      path: '/userProfile/support/general',
      content: (
        <div className="p-4 space-y-3">  
          <textarea 
            className="w-full border border-amber-200 rounded-lg p-3 h-32 focus:ring-2 focus:ring-emerald-500"
            placeholder="Type your general inquiry here..."
          />
          <button className="w-full bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600">
            Send Inquiry
          </button>
        </div>
      )
    },
    {
      icon: AlertOctagon,
      title: 'Report Issue',
      subtitle: 'Technical problems or bugs',
      path: '/support/report-issue',
      content: (
        <div className="p-4 space-y-3">
          <select className="w-full border border-amber-200 rounded-lg p-3">
            <option>Select Issue Type</option>
            <option>App Crash</option>
            <option>Payment Problem</option>
            <option>Login Issues</option>
            <option>Other Technical Issue</option>
          </select>
          <textarea 
            className="w-full border border-amber-200 rounded-lg p-3 h-32 focus:ring-2 focus:ring-emerald-500"
            placeholder="Describe the issue in detail..."
          />
          <button className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">
            Submit Issue Report
          </button>
        </div>
      )
    },
    {
      icon: Send,
      title: 'Submit Suggestion',
      subtitle: 'Help us improve',
      path: '/support/suggestions',
      content: (
        <div className="p-4 space-y-3">
          <textarea 
            className="w-full border border-amber-200 rounded-lg p-3 h-32 focus:ring-2 focus:ring-emerald-500"
            placeholder="Share your ideas to improve our service..."
          />
          <button className="w-full bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600">
            Send Suggestion
          </button>
        </div>
      )
    },
    {
      icon: Book,
      title: 'Frequently Asked Questions',
      subtitle: 'Quick answers to common questions',
      path: '/support/faqs',
      content: (
        <div className="p-4 space-y-3">
          <div className="border-b border-amber-200 pb-2">
            <h3 className="font-medium text-amber-900">How do I reset my password?</h3>
            <p className="text-sm text-amber-600">Go to Settings `{'>'}` Security`{'>'}` Reset Password</p>
          </div>
          <div className="border-b border-amber-200 pb-2">
            <h3 className="font-medium text-amber-900">How can I update my profile?</h3>
            <p className="text-sm text-amber-600">Navigate to Profile `{'>'}` Edit Profile</p>
          </div>
          <a href="#" className="text-emerald-600 text-sm hover:underline">
            View All FAQs
          </a>
        </div>
      )
    }
  ];

  const MenuItem = ({ icon: Icon, title, subtitle, path, highlight }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-between p-4 border-b border-amber-100 last:border-0 hover:bg-emerald-50/30"
      onClick={() => {
        if (path) {
          //router.push(path);
        }
        setSelectedCategory(
          selectedCategory === SupportCategories.findIndex(cat => cat.path === path) 
            ? null 
            : SupportCategories.findIndex(cat => cat.path === path)
        );
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

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-3">
          <ArrowLeft className="h-6 w-6 cursor-pointer" onClick={handleBack} />
          <h1 className="text-lg font-semibold">Support & Help</h1>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-auto py-4">
        <Section title="Support Options">
          {SupportCategories.map((category, index) => (
            <MenuItem
              key={index}
              icon={category.icon}
              title={category.title}
              subtitle={category.subtitle}
              path={category.path}
              highlight={index === selectedCategory}
            />
          ))}
        </Section>

        {/* Expanded Category Content */}
        {selectedCategory !== null && (
          <div className="p-4 m-4 bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">
              {SupportCategories[selectedCategory].title}
            </h2>
            {SupportCategories[selectedCategory].content}
          </div>
        )}

        {/* Additional Support */}
        <Section title="More Support">
          <MenuItem
            icon={HelpCircle}
            title="Contact Support Team"
            subtitle="Direct help from our experts"
            path="/support/contact"
          />
        </Section>
      </div>
    </div>
  );
};

export default SupportPage;