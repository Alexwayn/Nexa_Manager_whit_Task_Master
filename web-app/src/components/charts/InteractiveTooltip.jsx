import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InteractiveTooltip = ({ isVisible, content, position, children }) => {
  return (
    <div className="relative inline-block">
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: position?.x || '50%',
              top: position?.y || '-100%',
              transform: 'translateX(-50%) translateY(-8px)',
              minWidth: '120px',
              maxWidth: '250px'
            }}
          >
            <div className="text-center">
              {typeof content === 'string' ? (
                <span>{content}</span>
              ) : (
                <div className="space-y-1">
                  {content.title && (
                    <div className="font-semibold">{content.title}</div>
                  )}
                  {content.value && (
                    <div className="text-gray-300">{content.value}</div>
                  )}
                  {content.description && (
                    <div className="text-xs text-gray-400">{content.description}</div>
                  )}
                </div>
              )}
            </div>
            {/* Arrow */}
            <div 
              className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
              style={{
                left: '50%',
                bottom: '-4px',
                transform: 'translateX(-50%) rotate(45deg)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveTooltip;
