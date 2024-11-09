'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Circle, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'John Carter',
      avatar: '../../avatar.jpg',
      content: 'Hello! I received your transfer request.',
      timestamp: '09:30 AM',
      isSender: false,
    },
    {
      id: 2,
      sender: 'You',
      content: 'Hi John! Yes, I would like to proceed with the transfer.',
      timestamp: '09:31 AM',
      isSender: true,
    },
    {
      id: 3,
      sender: 'John Carter',
      avatar: '../../avatar.jpg',
      content: 'Great! Please confirm the amount and I will provide my account details.',
      timestamp: '09:32 AM',
      isSender: false,
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'You',
        content: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSender: true
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-amber-50">
      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ArrowLeft
                onClick={() => router.back() }
            className="h-6 w-6 cursor-pointer" />
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <img
                    src="../../avatar.jpg"
                    alt="John Carter"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-semibold">John Carter</h1>
                <span className="text-xs text-amber-100">Online</span>
              </div>
            </div>
          </div>
          <MoreVertical className="h-6 w-6 cursor-pointer" />
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.isSender ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${msg.isSender ? 'order-2' : 'order-1'}`}>
              {!msg.isSender && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-amber-100 overflow-hidden">
                    <img
                      src={msg.avatar}
                      alt={msg.sender}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm text-amber-700">{msg.sender}</span>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-2 ${
                  msg.isSender
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-amber-900'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-amber-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-amber-50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
          >
            <Send className="h-6 w-6" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;