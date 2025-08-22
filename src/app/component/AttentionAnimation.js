import {
  motion
} from "framer-motion";

export const AttentionAnimation = ({ isVisible, duration = 2 }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 rounded bg-green-400 opacity-0 z-0"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{
        scale: [0.85, 1.05, 0.95, 1.02, 1],
        opacity: [0, 0.3, 0.2, 0.1, 0],
      }}
      transition={{
        duration: duration,
        times: [0, 0.25, 0.5, 0.75, 1],
        ease: "easeInOut",
        repeat: 1,
      }}
    />
  );
};