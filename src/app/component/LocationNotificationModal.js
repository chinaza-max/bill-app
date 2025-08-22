import React from 'react';

export const LocationNotificationModal = ({ 
  error, 
  isRetrying, 
  onRetry, 
  onDismiss 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="bg-orange-100 rounded-full p-2 mr-3">
            <svg 
              className="w-6 h-6 text-orange-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Location Access Needed
          </h3>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            {error || "We need access to your location to provide better service."}
          </p>
          
          {isRetrying && (
            <div className="flex items-center text-blue-600 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Trying to get your location...
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRetrying ? 'Trying...' : 'Try Again'}
          </button>
          
          <button
            onClick={onDismiss}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Dismiss
          </button>
        </div>

        {/* Help text */}
        <div className="mt-4 text-xs text-gray-500">
          <p>If location is not working:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Check if location services are enabled on your device</li>
            <li>Allow location access in your browser settings</li>
            <li>Make sure you have a good GPS signal</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationNotificationModal;