"use client";

"use client";

import Link from "next/link";

export default function MerchantRejectedPage() {
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
          <div className="w-24 h-24 bg-red-50 rounded-full flex justify-center items-center mx-auto mb-8">
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
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Your Merchant Application Was Not Approved
          </h1>

          <p className="text-gray-600 mb-8">
            Thank you for your interest in becoming a merchant. After careful
            review, we are unable to approve your application at this time. This
            decision may be based on our current business requirements or
            verification criteria.
          </p>

          <div className="flex items-center justify-between mb-10">
            <div className="flex flex-col items-center flex-1">
              <div className="w-5 h-5 rounded-full bg-amber-600 mb-2"></div>
              <span className="text-sm text-gray-600">Submitted</span>
            </div>
            <div className="h-0.5 bg-amber-600 flex-1"></div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-5 h-5 rounded-full bg-amber-600 mb-2"></div>
              <span className="text-sm text-gray-600">Reviewed</span>
            </div>
            <div className="h-0.5 bg-red-500 flex-1"></div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-5 h-5 rounded-full bg-red-500 mb-2"></div>
              <span className="text-sm text-gray-600">Not Approved</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="font-semibold text-gray-700 mb-2">
              What does this mean?
            </h3>
            <p className="text-gray-600 text-sm">
              You can continue to use our platform as a regular user with all
              standard features. However, merchant-specific features will not be
              available to your account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support"
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/home"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
