import React from "react";
import { Loader2 } from "lucide-react";

const PinVerificationLoader = ({ message = "Verifying Pin..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        <Loader2
          className="h-12 w-12 animate-spin text-blue-500"
          strokeWidth={2}
        />
        <p className="text-white text-lg font-semibold">{message}</p>
      </div>
    </div>
  );
};

export default PinVerificationLoader;
