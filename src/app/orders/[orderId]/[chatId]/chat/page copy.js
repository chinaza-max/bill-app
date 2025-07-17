"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Circle, MoreVertical, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/component/protect";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import useRequest from "@/hooks/useRequest";
import { useParams } from "next/navigation";
import Image from "next/image";

let socket;

const SOCKET_SERVER_URL = "http://localhost:5000";

// Message Status Icons Component
const MessageStatusIcon = ({ status, timestamp }) => {
  switch (status) {
    case "sent":
      return <Check className="h-3 w-3 text-gray-400" />;
    case "delivered":
      return (
        <div className="flex">
          <Check className="h-3 w-3 text-gray-400" />
          <Check className="h-3 w-3 text-gray-400 -ml-1" />
        </div>
      );
    case "read":
      return (
        <div className="flex">
          <Check className="h-3 w-3 text-blue-500" />
          <Check className="h-3 w-3 text-blue-500 -ml-1" />
        </div>
      );
    default:
      return null;
  }
};

const ChatPage = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState({
    name: "",
    imageUrl: "",
    isOnline: false,
  });
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const [userType, setUserType] = useState();
  const typingTimeoutRef = useRef(null);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Sound notification refs
  const messageAudioRef = useRef(null);
  const [soundUrl, setSoundUrl] = useState("");

  const accessToken = useSelector((state) => state.user.accessToken);
  const myUserData = useSelector((state) => state.user.user);
  const {
    data: Chats,
    loading: loadingChats,
    request: fetchChat,
    error: chatError,
  } = useRequest();

  const params = useParams();
  const chatId = params?.chatId;
  const orderId = params?.orderId;

  // Track page visibility for read receipts
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);

      // Mark messages as read when page becomes visible
      if (!document.hidden && socket && chatId) {
        socket.emit("messagesRead", {
          roomId: chatId,
          userId: myUserData?.user?.id,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [chatId, myUserData]);

  // Initialize user type
  useEffect(() => {
    const storedUserType = localStorage.getItem("who");
    setUserType(storedUserType || "merchant");
  }, []);

  // Initialize sound
  useEffect(() => {
    const audioUrl =
      "https://res.cloudinary.com/dvznn9s4g/video/upload/v1749487536/mixkit-positive-notification-951_zcnfqp.wav";
    setSoundUrl(audioUrl);

    if (audioUrl && messageAudioRef.current) {
      messageAudioRef.current.load();
    }
  }, []);

  // Function to play notification sound
  const playNotificationSound = () => {
    if (messageAudioRef.current && soundUrl) {
      messageAudioRef.current.currentTime = 0;
      messageAudioRef.current.play().catch((error) => {
        console.log("Could not play sound:", error);
      });
    }
  };

  // Socket initialization
  useEffect(() => {
    if (accessToken && chatId && myUserData?.user?.id) {
      socket = io(SOCKET_SERVER_URL, {
        /* withCredentials: true,
        auth: {
          token: `Bearer ${accessToken}`,
        },*/
      });

      // Join the chat room with user ID
      socket.emit("joinRoom", {
        roomId: chatId,
        userId: myUserData.user.id,
      });

      // Listen for incoming messages
      socket.on("message", (msg) => {
        console.log("Received message:", msg);

        const actualIsSender = msg.userId1 === myUserData.user.id;

        // Play sound only for messages from other users
        if (!actualIsSender) {
          playNotificationSound();
        } else {
          return;
        }

        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const existingIndex = prev.findIndex((m) => m.id === msg.id);

          const formattedMessage = {
            ...msg,
            content: msg.message,
            isSender: actualIsSender,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: msg.messageStatus || "sent",
          };

          if (existingIndex !== -1) {
            // Update existing message
            const newMessages = [...prev];
            newMessages[existingIndex] = formattedMessage;
            return newMessages;
          } else {
            // Add new message
            return [...prev, formattedMessage];
          }
        });

        // Mark messages as read if page is visible and message is not from current user
        if (isPageVisible && !actualIsSender) {
          setTimeout(() => {
            socket.emit("messagesRead", {
              roomId: chatId,
              userId: myUserData.user.id,
            });
          }, 1000); // Delay to simulate reading time
        }
      });

      // Listen for message delivery confirmations
      socket.on("messageDelivered", ({ messageId }) => {
        console.log(messageId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, status: "delivered" } : msg
          )
        );
      });

      // Listen for messages read confirmations
      socket.on("messagesRead", ({ userId }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.isSender && msg.userId1 === myUserData.user.id
              ? { ...msg, status: "read" }
              : msg
          )
        );
      });

      // Listen for bulk delivery confirmations
      socket.on("messagesDelivered", ({ userId }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.isSender && msg.status === "sent"
              ? { ...msg, status: "delivered" }
              : msg
          )
        );
      });

      // Listen for typing indicators
      socket.on("userTyping", ({ isTyping: typing }) => {
        setOtherUserTyping(typing);
      });

      // Listen for online status updates
      socket.on("userOnlineStatus", ({ isOnline }) => {
        setOtherUser((prev) => ({ ...prev, isOnline }));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [accessToken, chatId, myUserData, isPageVisible]);

  // Fetch chat data and user information
  useEffect(() => {
    if (accessToken && userType && orderId) {
      async function fetchChatData() {
        const queryParams = new URLSearchParams({
          token: accessToken,
          apiType: "getChatHistory",
          orderId,
          userType,
        }).toString();

        await fetchChat(`/api/user?${queryParams}`, "GET");
      }

      fetchChatData();
    }
  }, [accessToken, userType, orderId]);

  // Handle chat data response
  useEffect(() => {
    if (Chats?.data?.data && myUserData) {
      const { chat, user } = Chats.data.data;

      setOtherUser({
        name: user.name || "Unknown User",
        imageUrl: user.imageUrl || "/avatar.jpg",
        isOnline: user.isOnline || false,
      });

      if (chat && Array.isArray(chat)) {
        const formattedMessages = chat.map((msg) => {
          let isSender = false;
          let senderName = "";
          let senderAvatar = "";

          if (msg.userId1 === myUserData.user.id) {
            isSender = true;
            senderName = "You";
            senderAvatar = myUserData.user?.imageUrl || "/avatar.jpg";
          } else {
            isSender = false;
            senderName = user.name || "Unknown User";
            senderAvatar = user.imageUrl || "/avatar.jpg";
          }

          return {
            id: msg.id,
            content: msg.message,
            sender: senderName,
            isSender: isSender,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            avatar: senderAvatar,
            status: msg.messageStatus || "sent",
            userId1: msg.userId1,
          };
        });
        setMessages(formattedMessages);
      }
    }
  }, [Chats, userType, myUserData]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle typing indicator
  const handleTyping = (value) => {
    setMessage(value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { roomId: chatId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing", { roomId: chatId, isTyping: false });
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (isTyping) {
      setIsTyping(false);
      socket.emit("typing", { roomId: chatId, isTyping: false });
    }

    const tempId = Date.now();
    const newMessage = {
      userId1: myUserData.user.id,
      userId2: Chats.data.data.user.id,
      roomId: chatId,
      messageType: "text",
      content: message.trim(),
    };

    // Optimistically add message to UI
    const optimisticMessage = {
      id: tempId,
      sender: "You",
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isSender: true,
      avatar: myUserData?.user?.imageUrl || "/avatar.jpg",
      status: "sent",
      userId1: myUserData.user.id,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    socket.emit("message", newMessage);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Loading state
  if (loadingChats) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-amber-50">
          <div className="text-amber-600">Loading chat...</div>
        </div>
      </ProtectedRoute>
    );
  }

  // Error state
  if (chatError) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-screen bg-amber-50">
          <div className="text-red-600">
            Error loading chat: {chatError.message}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        {/* Hidden audio element for notification sound */}
        <audio ref={messageAudioRef} preload="auto" style={{ display: "none" }}>
          {soundUrl && <source src={soundUrl} type="audio/mpeg" />}
          {soundUrl && <source src={soundUrl} type="audio/wav" />}
          {soundUrl && <source src={soundUrl} type="audio/ogg" />}
        </audio>

        {/* Top Navigation */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowLeft
                onClick={() => router.back()}
                className="h-6 w-6 cursor-pointer hover:text-amber-200 transition-colors"
              />
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={otherUser.imageUrl}
                      alt={otherUser.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/avatar.jpg";
                      }}
                    />
                  </div>
                  {otherUser.isOnline && (
                    <div className="absolute -bottom-1 -right-1">
                      <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{otherUser.name}</h1>
                  <span className="text-xs text-amber-100">
                    {otherUser.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
            <MoreVertical className="h-6 w-6 cursor-pointer hover:text-amber-200 transition-colors" />
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                msg.isSender ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] ${
                  msg.isSender ? "order-2" : "order-1"
                }`}
              >
                {!msg.isSender && (
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-amber-100 overflow-hidden">
                      <img
                        src={msg.avatar || otherUser.imageUrl}
                        alt={msg.sender || otherUser.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/avatar.jpg";
                        }}
                      />
                    </div>
                    <span className="text-sm text-amber-700">
                      {msg.sender || otherUser.name}
                    </span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 shadow-sm ${
                    msg.isSender
                      ? "bg-amber-500 text-white"
                      : "bg-white text-amber-900 border border-amber-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs opacity-70">{msg.timestamp}</p>
                    {msg.isSender && (
                      <MessageStatusIcon
                        status={msg.status}
                        timestamp={msg.timestamp}
                      />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {otherUserTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-start"
            >
              <div className="max-w-[75%]">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-amber-100 overflow-hidden">
                    <Image
                      src={otherUser.imageUrl}
                      alt={otherUser.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/avatar.jpg";
                      }}
                    />
                  </div>
                  <span className="text-sm text-amber-700">
                    {otherUser.name}
                  </span>
                </div>
                <div className="bg-white text-amber-900 border border-amber-100 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-amber-200 p-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-amber-50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
              disabled={loadingChats}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!message.trim() || loadingChats}
              className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-6 w-6" />
            </motion.button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ChatPage;
