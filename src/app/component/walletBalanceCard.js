import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const WalletBalanceCard = ({ balance, onToggleVisibility, isVisible }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 shadow-lg text-white mb-4"
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-white/90">Wallet Balance</p>
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold">
              {isVisible ? `₦${balance.toLocaleString()}` : "••••••"}
            </h3>
            <button onClick={onToggleVisibility} className="focus:outline-none">
              {isVisible ? (
                <EyeOff className="h-5 w-5 text-white/80" />
              ) : (
                <Eye className="h-5 w-5 text-white/80" />
              )}
            </button>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            window.location.href = "/userProfile/fundwallet";
          }}
          className="bg-white text-amber-600 text-xs font-medium px-3 py-1 rounded-full hover:bg-amber-50 transition-colors"
        >
          Fund Wallet
        </button>
      </div>
    </motion.div>
  );
};

export default WalletBalanceCard;
