"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConstructionIcon, Volume2, VolumeX } from "lucide-react";

const title = "Leave Beyond Expectation. Order Smarter, Leave Better";

const introSlides = [
  {
    title: "Leave Beyond Expectation. Order Smarter, Leave Better",
    description:
      "Order money at your comfort zone without stress with fintread",
    image: "splash1.png",
    audio:
      "Welcome to Fintread. Live beyond expectation. Order smarter, live better.",
  },
  {
    title: "Unlock Convenience Order in tap, Enjoy in a Snap",
    description:
      "Order money at your comfort zone without stress with fintread",
    image: "splash2.png",
    audio: "Unlock convenience. Order in a tap, enjoy in a snap.",
  },
  {
    title: "Turn Your Spare Time Into Money By Becoming a Merchant",
    description:
      "Order money at your comfort zone without stress with fintread",
    image: "splash3.png",
    audio:
      "Turn your spare time into money by becoming a merchant with Fintread.",
  },
];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [isOverlayVisible, setOverlayVisible] = useState(true);
  const [isOverlayVisible2, setOverlayVisible2] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const synth = useRef(null);
  const utteranceRef = useRef(null);

  const router = useRouter();

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 0,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 5000;
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
    // Initialize speech synthesis with permission check
    if (typeof window !== "undefined") {
      synth.current = window.speechSynthesis;

      // Check if the browser supports speech synthesis
      if (!synth.current) {
        setPermissionError("Speech synthesis is not supported in this browser");
        setIsMuted(true);
        return;
      }

      const getVoices = () => {
        const availableVoices = synth.current.getVoices();
        console.log("Available voices:", availableVoices);
        setVoices(availableVoices);
        setSelectedVoice(
          availableVoices.find((voice) => voice.default) || availableVoices[0]
        );
      };

      // Ensure voices are loaded
      if (synth.current.onvoiceschanged !== undefined) {
        synth.current.onvoiceschanged = getVoices;
      } else {
        getVoices();
      }

      // Request permission for audio playback
      const requestPermission = async () => {
        try {
          // Try to get audio permission
          const result = await navigator.permissions.query({
            name: "notifications",
          });

          if (result.state === "granted") {
            setPermissionGranted(true);
          } else if (result.state === "prompt") {
            // We need to trigger speech on user interaction
            setPermissionGranted(false);
          } else {
            setPermissionError("Permission denied for audio playback");
            setIsMuted(true);
          }
        } catch (error) {
          // Fall back to a user interaction requirement
          console.log(
            "Permission API not supported, will require user interaction"
          );
          setPermissionGranted(false);
        }
      };

      requestPermission();
    }
  }, []);

  const playAudio = (text) => {
    return;
    console.log(synth.current);
    console.log(isMuted);

    if (synth.current && !isMuted) {
      try {
        // Cancel any ongoing speech
        //synth.current.cancel();
        console.log("test test ", selectedVoice);

        // Create new utterance
        utteranceRef.current = new SpeechSynthesisUtterance(text);
        utteranceRef.current.rate = 1.0;
        utteranceRef.current.pitch = 1.0;
        utteranceRef.current.voice = selectedVoice;

        // Add error handling
        utteranceRef.current.onerror = (event) => {
          console.error("Speech synthesis error:", event);

          setPermissionError("Error playing audio. Please try again.");
        };

        // Handle the first user interaction
        if (!permissionGranted) {
          setPermissionGranted(true);
        }

        // Play the speech
        synth.current.speak(utteranceRef.current);
      } catch (error) {
        console.error("Speech synthesis error:", error);
        setPermissionError("Error initializing audio playback");
        setIsMuted(true);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      if (!prev) {
        // If we're muting, cancel any ongoing speech
        //synth.current?.cancel();
      }
      return !prev;
    });
  };

  useEffect(() => {
    setTimeout(() => {
      if (!isMuted) {
        console.log("ddddddddddd");
        ///playAudio(title);
      }
    }, 40000);
  }, [isMuted]);

  useEffect(() => {
    // Play audio when slide changes

    setTimeout(() => {
      if (!isOverlayVisible2 && !isMuted) {
        //playAudio(introSlides[currentIndex].audio);
      }
    }, 40000);
  }, [currentIndex, isOverlayVisible2, isMuted]);

  useEffect(() => {
    return () => {
      if (synth.current) {
        synth.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!autoPlayEnabled) return;

    const timer = setInterval(() => {
      paginate(1); // This will use the looping logic we already have in the paginate function
    }, 10000);

    const timer2 = setTimeout(() => {
      setOverlayVisible(false);
    }, 3000);

    const timer3 = setTimeout(() => {
      setOverlayVisible2(false);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(timer2);
      clearInterval(timer3);
    };
  }, [currentIndex, autoPlayEnabled]);

  useEffect(() => {
    fetch("api/auth?apiType=ping");
    setTimeout(() => {
      fetch("api/auth?apiType=ping");
    }, 3000);
  }, [router]);

  return (
    <>
      {isOverlayVisible2 ? (
        <Overlay isVisible={isOverlayVisible} />
      ) : (
        <div className="fixed inset-0 bg-gradient-to-b  bg-white">
          <div className="relative h-full w-full overflow-hidden">
            <motion.button
              className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
              onClick={toggleMute}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {/*isMuted ? (
                <VolumeX className="w-6 h-6 text-gray-600" />
              ) : (
                <Volume2 className="w-6 h-6 text-gray-600" />
              )*/}
            </motion.button>

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
                    opacity: { duration: 0.2 },
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
                      style={{ marginTop: "30%" }}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

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
                      index === currentIndex
                        ? "w-6 bg-black"
                        : "w-2 bg-gray-300"
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
                        console.log(
                          "Back button clicked, current index:",
                          currentIndex
                        );
                        paginate(-1);
                      }}
                      className="flex-1 text-center py-4 text-gray-500 "
                      style={{ zIndex: 10 }}
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
                    <Link
                      //onClick={() => router.push('/auth/sign-up')}
                      href="/sign-up"
                      className="flex-1 text-center rounded-full bg-primary-600 py-3 text-white font-semibold"
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {permissionError && (
        <div className="absolute top-16 right-6 z-50 p-2 bg-red-100 text-red-600 rounded-md text-sm">
          {permissionError}
        </div>
      )}
    </>
  );
}

const Overlay = ({ isVisible }) => {
  const imageVariants = {
    initial: {
      scale: 0.8,
      opacity: 0,
      y: 50,
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.2,
      },
    },
    exit: {
      scale: 1.2,
      opacity: 0,
      y: -30,
      transition: {
        duration: 0.4,
        ease: "easeIn",
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: isVisible ? "block" : "none",
        zIndex: 1000,
        background: "white",
        color: "black",
        alignItems: "center",
        justifyContent: "center",
        display: "flex",
      }}
    >
      <motion.img
        src={
          "https://res.cloudinary.com/dvznn9s4g/image/upload/v1740400115/official_vbhxec.jpg"
        }
        alt={"logo"}
        className="w-48  h-18"
        variants={imageVariants}
        initial="initial"
        animate="animate"
      />
    </motion.div>
  );
};
