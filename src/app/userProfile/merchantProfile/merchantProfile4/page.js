"use client";

import Link from "next/link";

export default function MerchantReviewPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navigation Bar with Amber Gradient */}
      <div className="fixed top-0 left-0 right-0 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white z-10">
        <div className="flex items-center">
          <Link href="/home" className="text-white mr-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </Link>
          <h2 className="text-lg font-semibold">Merchant Application Status</h2>
        </div>
      </div>

      {/* Main Content with padding top to account for fixed navbar */}
      <div className="flex-1 flex justify-center items-center p-4 pt-16">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex justify-center items-center mx-auto mb-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-600"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Your Merchant Application is Under Review
          </h1>

          <p className="text-gray-600 mb-8">
            Thank you for your interest in becoming a merchant! Our team is
            currently reviewing your application. This process typically takes
            1-3 business days.
          </p>

          <div className="flex items-center justify-between mb-10">
            <div className="flex flex-col items-center flex-1">
              <div className="w-5 h-5 rounded-full bg-amber-600 mb-2"></div>
              <span className="text-sm text-gray-600">Submitted</span>
            </div>
            <div className="h-0.5 bg-amber-600 flex-1"></div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-5 h-5 rounded-full bg-amber-600 mb-2 animate-pulse"></div>
              <span className="text-sm text-gray-600">Under Review</span>
            </div>
            <div className="h-0.5 bg-gray-300 flex-1"></div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-5 h-5 rounded-full bg-gray-300 mb-2"></div>
              <span className="text-sm text-gray-600">Approved</span>
            </div>
          </div>

          <p className="text-gray-600">
            We'll notify you via email once your application has been processed.
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
