import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, History, Users, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

export default function bottomNav({ activeTabP, handleTabChangeP }) {
  const router = useRouter();

  useEffect(() => {
    // Prefetch the merchant route when component mounts
    router.prefetch("orders");
  }, [router]);

  return (
    <div className="bg-white border-t border-amber-200">
      <div className="flex justify-around py-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTabChangeP("home")}
          className={`flex flex-col items-center p-2 ${
            activeTabP === "home" ? "text-amber-600" : "text-amber-400"
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTabChangeP("orders")}
          className={`flex flex-col items-center p-2 ${
            activeTabP === "order" ? "text-amber-600" : "text-amber-400"
          }`}
        >
          <ShoppingBag className="h-6 w-6" />
          <span className="text-xs mt-1">Orders</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTabChangeP("history")}
          className={`flex flex-col items-center p-2 ${
            activeTabP === "history" ? "text-amber-600" : "text-amber-400"
          }`}
        >
          <History className="h-6 w-6" />
          <span className="text-xs mt-1">History</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            handleTabChangeP("p2p");
          }}
          className={`flex flex-col items-center p-2 ${
            activeTabP === "p2p" ? "text-amber-600" : "text-amber-400"
          }`}
        >
          <Users className="h-6 w-6" />
          <span className="text-xs mt-1">P2P</span>
        </motion.button>
      </div>
    </div>
  );
}
