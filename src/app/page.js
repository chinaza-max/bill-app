'use client';

import Image from "next/image";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const introSlides = [
  {
    title: "Live Beyond Expectation. Order Smarter, Live Better",
    description: "Order money at your comfort zone without stress with billbolt",
    image: "splash1.png",
  },
  {
    title: "Unlock Convenience Order in tap, Enjoy in a Snap",
    description: "Order money at your comfort zone without stress with billbolt",
    image: "splash2.png",
  },
  {
    title: "Turn Your Spare Time Into Money By Becoming a Merchant",
    description: "Order money at your comfort zone without stress with billbolt",
    image: "splash3.png",
  }
];


export default function Home() {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);


  const router = useRouter();

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 0,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection) => {

    let newIndex = currentIndex + newDirection;
  
    // Handle looping
    if (newIndex < 0) {
      newIndex = introSlides.length - 1;
    } else if (newIndex >= introSlides.length) {
      newIndex = 0;
    }
    
    setDirection(newDirection);
    setCurrentIndex(newIndex);
  };


  useEffect(() => {
    if (!autoPlayEnabled) return;
    
    const timer = setInterval(() => {
      paginate(1); // This will use the looping logic we already have in the paginate function
    }, 10000);
  
    return () => clearInterval(timer);
  }, [currentIndex, autoPlayEnabled]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b  bg-white">
      <div className="relative h-full w-full overflow-hidden">
        {/* Image Section */}
        <div className="h-[10%] w-full">
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
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute h-full w-full flex justify-center"
            >
              <div className="relative h-64 w-64">
                <motion.img
                  src={introSlides[currentIndex].image}
                  alt={introSlides[currentIndex].title}
                  className="h-full w-full object-cover rounded-2xl"
                  style={{ marginTop: '30%' }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                />

              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Text Content */}
        <div className="absolute bottom-0 h-[40%] w-full bg-white rounded-t-[32px] px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-1"
            >
              <h2 className="text-2xl font-bold text-center text-black">
                {introSlides[currentIndex].title}
              </h2>
              <p className="text-center text-gray-600">
                {introSlides[currentIndex].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="absolute bottom-24 left-0 w-full flex justify-center space-x-3">
            {introSlides.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full ${
                  index === currentIndex ? 'w-6 bg-black' : 'w-2 bg-gray-300'
                }`}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="absolute bottom-8 left-0 w-full px-6">
  <div className="flex gap-4 items-center justify-between">
    {currentIndex > 0 && (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => {
          console.log('Back button clicked, current index:', currentIndex);
          paginate(-1);
        }}
        className="flex-1 text-center py-4 text-gray-500 "
        style={{zIndex: 10}}
      >
        Back
      </motion.button>
    )}
    
    {currentIndex < introSlides.length - 1 ? (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => paginate(1)}
        className="flex-1 rounded-full bg- py-4 text-gray-500 font-semibold"
      >
        Next
      </motion.button>
    ) : (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push('/home')}
        className="flex-1 rounded-full bg-primary-600 py-3 text-white font-semibold"
      >
        Get Started
      </motion.button>
    )}
  </div>
</div>
        </div>

      </div>
    </div>
  );
};

