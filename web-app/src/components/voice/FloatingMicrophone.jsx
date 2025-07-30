import React, { useState, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Floating microphone component for voice assistant
 */
const FloatingMicrophone = ({
  isListening = false,
  isProcessing = false,
  onToggle,
  position = 'bottom-right',
  className = '',
  size = 'medium',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      // In a real implementation, you'd update the position
      // For now, just prevent default behavior
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const getStatusColor = () => {
    if (isProcessing) return 'bg-yellow-500';
    if (isListening) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Listening...';
    return 'Click to speak';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={`
            fixed ${positionClasses[position]} z-50 
            ${className}
          `}
          data-testid="floating-microphone"
          {...props}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={isListening ? { 
              scale: [1, 1.1, 1],
              transition: { repeat: Infinity, duration: 1 }
            } : {}}
            onClick={onToggle}
            onMouseDown={handleMouseDown}
            className={`
              ${sizeClasses[size]}
              ${getStatusColor()}
              rounded-full shadow-lg hover:shadow-xl
              flex items-center justify-center
              text-white transition-all duration-200
              cursor-pointer select-none
              ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
            `}
            title={getStatusText()}
            data-testid="floating-microphone-button"
          >
            {isListening ? (
              <StopIcon className="w-6 h-6" />
            ) : (
              <MicrophoneIcon className="w-6 h-6" />
            )}
          </motion.button>

          {/* Status indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isListening || isProcessing ? 1 : 0, y: 0 }}
            className="absolute -top-12 left-1/2 transform -translate-x-1/2"
          >
            <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {getStatusText()}
            </div>
          </motion.div>

          {/* Pulse animation when listening */}
          {isListening && (
            <motion.div
              animate={{
                scale: [1, 2, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5
              }}
              className={`
                absolute inset-0 ${getStatusColor()} 
                rounded-full pointer-events-none
              `}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingMicrophone;