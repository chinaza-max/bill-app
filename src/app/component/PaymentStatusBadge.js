// Improved Payment Status Badge Component




export const PaymentStatusBadge = ({ status }) => {
  const statusStyles = {
    successful: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    failed: "bg-red-100 text-red-800 border-red-200",
  };

  const iconStyles = {
    successful: "text-green-500",
    pending: "text-yellow-500",
    failed: "text-red-500",
  };

  const statusIcons = {
    successful: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    pending: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    failed: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      <span className={`mr-1 ${iconStyles[status] || iconStyles.pending}`}>
        {statusIcons[status] || statusIcons.pending}
      </span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};