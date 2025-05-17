import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  motion,
  useAnimation,
  AnimatePresence,
  useMotionValue,
} from "framer-motion";
//import { useDrag } from "framer-motion";

const EnhancedCarousel = React.memo(({ items }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef(null);
  const controls = useAnimation();

  const startInterval = () => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, 3000);
    }
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => {
      const newSlide = (prevSlide + 1) % items.length;
      return newSlide;
    });
  };

  const handleDragEnd = (event, info) => {
    const { offset, velocity } = info;

    // Determine swipe direction based on drag offset and velocity
    if (offset.x < -100 || (velocity.x < -500 && offset.x < 0)) {
      nextSlide();
    } else if (offset.x > 100 || (velocity.x > 500 && offset.x > 0)) {
      setCurrentSlide((currentSlide - 1 + items.length) % items.length);
    }

    // Reset position
    controls.start({ x: 0, transition: { duration: 0.3 } });
  };

  useEffect(() => {
    startInterval();
    return () => stopInterval();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x: useMotionValue(0) }}
        className="touch-none"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg p-6 shadow-lg relative"
            style={{
              padding: "9px",
              height: "160px",
            }}
          >
            <div
              className="absolute inset-0 bg-center bg-no-repeat bg-contain"
              style={{
                backgroundImage: `url(${items[currentSlide].image})`,
                opacity: 0.3,
                height: "160px",
              }}
            />
            <h4 className="text-lg font-semibold text-white">
              {items[currentSlide].title}
            </h4>
            <p className="text-white/90" style={{ fontSize: "12px" }}>
              {items[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div
          style={{ bottom: "5px" }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2"
        >
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? "bg-white w-4" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
});
EnhancedCarousel.displayName = "EnhancedCarousel";

export default EnhancedCarousel;
