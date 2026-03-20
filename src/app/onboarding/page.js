"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

const introSlides = [
  {
    title: "Leave Beyond Expectation. Order Smarter, Leave Better",
    description: "Order money at your comfort zone without stress with fidopoint",
    image: "splash1.png",
    highlight: "Order Smarter",
  },
  {
    title: "Unlock Convenience Order in tap, Enjoy in a Snap",
    description: "Order money at your comfort zone without stress with fidopoint",
    image: "splash2.png",
    highlight: "Unlock Convenience",
  },
  {
    title: "Turn Your Spare Time Into Money By Becoming a Merchant",
    description: "Order money at your comfort zone without stress with fidopoint",
    image: "splash3.png",
    highlight: "Becoming a Merchant",
  },
];

// Animated "Unlock Convenience" text that cycles through words
const UnlockConvenienceAnimator = () => {
  const words = ["Convenience", "Freedom", "Speed", "Simplicity"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: "13px",
        color: "#9A7B2E",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginTop: "4px",
      }}
    >
      <span style={{ color: "#888", fontFamily: "Georgia, serif", fontStyle: "italic" }}>Unlock</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{
            color: "#B8922A",
            fontWeight: "700",
            borderBottom: "1.5px solid #D4AF37",
            paddingBottom: "1px",
          }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [isOverlayVisible, setOverlayVisible] = useState(true);
  const [isOverlayVisible2, setOverlayVisible2] = useState(true);
  const router = useRouter();

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { zIndex: 0, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 }),
  };

  const swipeConfidenceThreshold = 5000;
  const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

  const paginate = (newDirection) => {
    let newIndex = currentIndex + newDirection;
    if (newIndex < 0) newIndex = introSlides.length - 1;
    else if (newIndex >= introSlides.length) newIndex = 0;
    setDirection(newDirection);
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    if (!autoPlayEnabled) return;
    const timer = setInterval(() => paginate(1), 10000);
    const timer2 = setTimeout(() => setOverlayVisible(false), 3000);
    const timer3 = setTimeout(() => setOverlayVisible2(false), 4000);
    return () => {
      clearInterval(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [currentIndex, autoPlayEnabled]);

  useEffect(() => {
    router.prefetch?.("sign-up");
  }, []);

  return (
    <>
      {isOverlayVisible2 ? (
        <Overlay isVisible={isOverlayVisible} />
      ) : (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#FFFFFF",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden" }}>

            {/* Top image area */}
            <div style={{ height: "60%", width: "100%", position: "relative" }}>
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) paginate(1);
                    else if (swipe > swipeConfidenceThreshold) paginate(-1);
                  }}
                  style={{
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <motion.img
                    src={introSlides[currentIndex].image}
                    alt={introSlides[currentIndex].title}
                    style={{
                      width: "220px",
                      height: "220px",
                      objectFit: "cover",
                      borderRadius: "20px",
                    }}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom card */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                height: "44%",
                width: "100%",
                background: "#FFFFFF",
                borderTopLeftRadius: "32px",
                borderTopRightRadius: "32px",
                padding: "24px 24px 0",
                boxShadow: "0 -4px 30px rgba(0,0,0,0.06)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ textAlign: "center" }}
                >
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#111",
                      lineHeight: "1.35",
                      margin: "0 0 8px",
                      fontFamily: "'Playfair Display', Georgia, serif",
                    }}
                  >
                    {introSlides[currentIndex].title}
                  </h2>
                  <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
                    {introSlides[currentIndex].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Animated unlock convenience */}
              <div style={{ marginTop: "12px" }}>
                <UnlockConvenienceAnimator />
              </div>

              {/* Dots */}
              <div
                style={{
                  position: "absolute",
                  bottom: "84px",
                  left: 0,
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                {introSlides.map((_, i) => (
                  <motion.div
                    key={i}
                    onClick={() => {
                      setDirection(i > currentIndex ? 1 : -1);
                      setCurrentIndex(i);
                    }}
                    style={{
                      height: "8px",
                      borderRadius: "4px",
                      background: i === currentIndex ? "#B8922A" : "#DDD",
                      width: i === currentIndex ? "24px" : "8px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div
                style={{
                  position: "absolute",
                  bottom: "24px",
                  left: 0,
                  width: "100%",
                  padding: "0 24px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                {currentIndex > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => paginate(-1)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      border: "1.5px solid #D4AF37",
                      borderRadius: "999px",
                      background: "transparent",
                      color: "#9A7B2E",
                      fontWeight: "600",
                      fontSize: "15px",
                      cursor: "pointer",
                    }}
                  >
                    Back
                  </motion.button>
                )}

                {currentIndex < introSlides.length - 1 ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => paginate(1)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: "999px",
                      background: "linear-gradient(135deg, #D4AF37, #9A7B2E)",
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "15px",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(180,140,40,0.25)",
                    }}
                  >
                    Next
                  </motion.button>
                ) : (
                  <Link
                    href="/sign-up-selection"
                    style={{
                      flex: 1,
                      display: "block",
                      textAlign: "center",
                      padding: "14px",
                      borderRadius: "999px",
                      background: "linear-gradient(135deg, #D4AF37, #9A7B2E)",
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "15px",
                      textDecoration: "none",
                      boxShadow: "0 4px 16px rgba(180,140,40,0.25)",
                    }}
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Splash Overlay ──────────────────────────────────────────────────────────
const Overlay = ({ isVisible }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      {/* Gold ring pulse behind logo */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.6, 0.35],
        }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: "96px",
          height: "96px",
          borderRadius: "50%",
          border: "2px solid #D4AF37",
        }}
      />

      {/* Logo container with gold border */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          border: "2.5px solid #D4AF37",
          padding: "10px",
          background: "#fff",
          boxShadow: "0 0 24px rgba(212,175,55,0.25), 0 2px 12px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <img
          src="https://res.cloudinary.com/dvznn9s4g/image/upload/v1740400115/official_vbhxec.jpg"
          alt="Fidopoint logo"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "50%",
          }}
        />
      </motion.div>

      {/* Brand name below */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        style={{
          position: "absolute",
          bottom: "calc(50% - 80px)",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "13px",
          letterSpacing: "0.2em",
          color: "#B8922A",
          textTransform: "uppercase",
        }}
      >
        Fidopoint
      </motion.p>
    </motion.div>
  );
};