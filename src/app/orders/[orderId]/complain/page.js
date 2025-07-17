'use client';

import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

const ComplaintPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    orderNumber: '',
    issueType: '',
    description: '',
    attachments: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Complaint submitted:', formData);
    // Could add success notification and redirect
  };

  return (
    <div className="flex flex-col min-h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center space-x-4">
          <ArrowLeft 
            onClick={() => router.back()}
            className="h-6 w-6 cursor-pointer hover:text-amber-200 transition-colors"
          />
          <h1 className="text-xl font-semibold">Submit Complaint</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full mt-5">
        <Card className="bg-white shadow-lg mt-4">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6 ">
              {/* Order Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-900">
                  Order Number
                </label>
                <input
                  type="text"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
                  placeholder="Enter your order number"
                  className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
                  required
                />
              </div>

              {/* Issue Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-900">
                  Type of Issue
                </label>
                <select
                  value={formData.issueType}
                  onChange={(e) => setFormData({...formData, issueType: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
                  required
                >
                  <option value="">Select an issue type</option>
                  <option value="wrong-item">Wrong Item Received</option>
                  <option value="damaged">Damaged Product</option>
                  <option value="missing">Missing Items</option>
                  <option value="late-delivery">Late Delivery</option>
                  <option value="quality">Quality Issues</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-900">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Please describe your issue in detail..."
                  className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 min-h-32 resize-none"
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-900">
                  Attach Photos (Optional)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-4 py-6 bg-amber-50 text-amber-700 rounded-lg border-2 border-dashed border-amber-300 cursor-pointer hover:bg-amber-100 transition-colors">
                    <span className="text-sm">Click to upload photos</span>
                    <span className="text-xs text-amber-600 mt-1">Maximum 3 photos</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => setFormData({...formData, attachments: e.target.files.length})}
                    />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-amber-500 text-white py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="h-5 w-5" />
                <span>Submit Complaint</span>
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComplaintPage;