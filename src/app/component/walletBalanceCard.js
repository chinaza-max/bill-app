import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowDownLeft, ArrowUpRight } from "lucide-react";

const WalletBalanceCard = ({ balance = 125000, isVisible: isVisibleProp, onToggleVisibility }) => {
  const [isVisible, setIsVisible] = useState(isVisibleProp ?? true);
  const [activeCard, setActiveCard] = useState(0);

  const toggleVisibility = () => {
    if (onToggleVisibility) onToggleVisibility();
    else setIsVisible((v) => !v);
  };

  const effectiveVisible = onToggleVisibility ? isVisibleProp : isVisible;

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -50 && activeCard === 0) setActiveCard(1);
    if (info.offset.x > 50 && activeCard === 1) setActiveCard(0);
  };

  return (
    <div className="px-4 pt-4 select-none">
      <div className="relative" style={{ height: 170 }}>
        <AnimatePresence mode="wait">
          {activeCard === 0 ? (
            /* ── FIAT NGN CARD ── */
            <motion.div
              key="ngn"
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 10% 90%, #fff 0%, transparent 40%), radial-gradient(circle at 90% 10%, #fff 0%, transparent 40%)",
                }}
              />

              <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(0,0,0,0.45)" }}>
                    Wallet Balance
                  </p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-3xl font-extrabold" style={{ color: "#1a0a00", letterSpacing: "-0.5px" }}>
                      {effectiveVisible ? `₦${balance.toLocaleString()}` : "••••••"}
                    </h3>
                    <button
                      onClick={toggleVisibility}
                      className="rounded-full p-1 focus:outline-none"
                      style={{ background: "rgba(0,0,0,0.12)" }}
                    >
                      {effectiveVisible ? (
                        <EyeOff className="h-4 w-4" style={{ color: "rgba(0,0,0,0.55)" }} />
                      ) : (
                        <Eye className="h-4 w-4" style={{ color: "rgba(0,0,0,0.55)" }} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => (window.location.href = "/userProfile/fundwallet")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-opacity active:opacity-80"
                    style={{ background: "#1a0a00", color: "#fbbf24" }}
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    Fund Wallet
                  </button>
                  <button
                    onClick={() => (window.location.href = "/userProfile/withdraw")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-opacity active:opacity-80"
                    style={{ background: "#ffffff", color: "#92400e" }}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Withdraw
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── CRYPTO CARD (Coming Soon) ── mirrors fiat layout exactly ── */
            <motion.div
              key="crypto"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
              style={{
                background: "linear-gradient(135deg, #451a03 0%, #78350f 45%, #92400e 100%)",
              }}
            >
              {/* gold shimmer */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 85% 15%, rgba(251,191,36,0.35) 0%, transparent 55%), radial-gradient(circle at 15% 90%, rgba(251,191,36,0.18) 0%, transparent 45%)",
                }}
              />

              <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                {/* Top — mirrors fiat: label + balance + eye */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Crypto Balance
                    </p>
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{
                        background: "rgba(251,191,36,0.18)",
                        border: "1px solid rgba(251,191,36,0.45)",
                        color: "#fcd34d",
                      }}
                    >
                      Coming Soon
                    </span>
                  </div>

                  {/* Balance row — same structure as fiat */}
                  <div className="flex items-center gap-2">
                    <h3 className="text-3xl font-extrabold text-white" style={{ letterSpacing: "-0.5px" }}>
                      ••••••
                    </h3>
                    {/* eye icon placeholder — disabled */}
                    <div
                      className="rounded-full p-1"
                      style={{ background: "rgba(255,255,255,0.1)" }}
                    >
                      <Eye className="h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                    </div>
                  </div>

                  {/* SOL / USDT sub-label */}
                  <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                    SOL &amp; USDT on Solana
                  </p>
                </div>

                {/* Bottom — mirrors fiat: Fund + Withdraw buttons, disabled */}
                <div className="flex gap-3">
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed"
                    style={{ background: "rgba(0,0,0,0.25)", color: "rgba(251,191,36,0.45)" }}
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    Fund Wallet
                  </button>
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed"
                    style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.35)" }}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Withdraw
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center items-center gap-1.5 mt-2.5">
        {[0, 1].map((i) => (
          <button
            key={i}
            onClick={() => setActiveCard(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: activeCard === i ? 20 : 6,
              height: 6,
              background: activeCard === i ? "#f59e0b" : "#d1d5db",
            }}
          />
        ))}
      </div>

      <p className="text-center text-gray-400 text-[10px] mt-1 tracking-wide">
        {activeCard === 0 ? "Swipe left for Crypto →" : "← Swipe right for NGN"}
      </p>
    </div>
  );
};

export default WalletBalanceCard;