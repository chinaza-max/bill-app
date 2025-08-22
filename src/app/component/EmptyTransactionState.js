import {
  motion,

} from "framer-motion";

import {

  Package2,

} from "lucide-react";
  export const EmptyTransactionState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-3 px-4 bg-white rounded-lg shadow-sm"
    >
      <div className="w-16 h-16 mb-4 bg-amber-100 rounded-full flex items-center justify-center">
        <Package2 className="h-8 w-8 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold text-amber-900 mb-2">
        No Transactions Yet
      </h3>
      <p className="text-amber-600 text-center text-sm mb-6">
        Start your journey by making your first transaction. It is quick and
        easy!
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          handleTabChange("userProfile/fundwallet");
        }}
        className="px-6 py-2 bg-amber-100 text-amber-600 rounded-full font-medium text-sm"
      >
        Fund wallet for easy ordering
      </motion.button>
    </motion.div>
  );