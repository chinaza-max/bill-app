"use client";

import React from 'react';
import { MapPin, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LocationStatusIndicator = ({ 
  status = 'idle', // 'idle' | 'pending' | 'success' | 'error'
  accuracy = null,
  lastUpdate = null,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: Check,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          label: 'Location Updated',
          showPulse: true
        };
      case 'pending':
        return {
          icon: Loader2,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300',
          label: 'Updating Location...',
          animate: 'animate-spin'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          label: 'Location Failed'
        };
      default:
        return {
          icon: MapPin,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300',
          label: 'Location Idle'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatTimestamp = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${className}`}
      >
        {/* Icon with optional pulse animation */}
        <div className="relative">
          <Icon className={`h-4 w-4 ${config.color} ${config.animate || ''}`} />
          
          {config.showPulse && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-green-400"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-green-400"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
        </div>

        {/* Status text and details */}
        <div className="flex flex-col">
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
          {(accuracy || lastUpdate) && (
            <span className="text-[10px] text-gray-500">
              {accuracy && `±${Math.round(accuracy)}m`}
              {accuracy && lastUpdate && ' • '}
              {lastUpdate && formatTimestamp(lastUpdate)}
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Compact version for header/navbar
export const LocationStatusBadge = ({ 
  status = 'idle',
  size = 'sm' // 'xs' | 'sm' | 'md'
}) => {
  const sizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3'
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'pending': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="relative inline-flex">
      <div className={`rounded-full ${getStatusColor()} ${sizeClasses[size]}`} />
      
      {status === 'success' && (
        <>
          <motion.div
            className={`absolute inset-0 rounded-full bg-green-400 ${sizeClasses[size]}`}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.div
            className={`absolute inset-0 rounded-full bg-green-400 ${sizeClasses[size]}`}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}
      
      {status === 'pending' && (
        <motion.div
          className={`absolute inset-0 rounded-full bg-blue-400 ${sizeClasses[size]}`}
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  );
};