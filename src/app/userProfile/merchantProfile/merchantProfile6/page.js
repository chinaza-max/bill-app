"use client";

import Link from "next/link";

export default function MerchantSuspendedPage() {
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
          <h2 className="text-lg font-semibold">Account Status</h2>
        </div>
      </div>

      {/* Main Content with padding top to account for fixed navbar */}
      <div className="flex-1 flex justify-center items-center p-4 pt-16">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex justify-center items-center mx-auto mb-8">
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
              className="text-orange-500"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Your Account Has Been Temporarily Suspended
          </h1>

          <p className="text-gray-600 mb-8">
            We've temporarily suspended your account privileges due to activity
            that may not align with our platform's policies. This suspension is
            in place while we review your account.
          </p>

          <div className="flex items-center justify-between mb-10">
            <div className="flex flex-col items-center flex-1">
              <div className="w-5 h-5 rounded-full bg-amber-600 mb-2"></div>
              <span className="text-sm text-gray-600">Active</span>
            </div>
            <div className="h-0.5 bg-amber-600 flex-1"></div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-5 h-5 rounded-full bg-orange-500 mb-2"></div>
              <span className="text-sm text-gray-600">Under Review</span>
            </div>
            <div className="h-0.5 bg-orange-500 flex-1"></div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-5 h-5 rounded-full bg-orange-500 mb-2"></div>
              <span className="text-sm text-gray-600">Suspended</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="font-semibold text-gray-700 mb-2">
              What happens now?
            </h3>
            <p className="text-gray-600 text-sm">
              During this temporary suspension, some account features will be
              limited. Our team is reviewing your account and will provide an
              update within 2-3 business days. Please check your email for
              additional information.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-8">
            <h3 className="font-semibold text-blue-700 mb-2">
              Common Reasons for Suspension
            </h3>
            <ul className="text-gray-600 text-sm text-left list-disc pl-5">
              <li>Unusual account activity</li>
              <li>Policy violation</li>
              <li>Information verification needed</li>
              <li>Payment or billing issues</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support"
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/appeal"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Submit Appeal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
