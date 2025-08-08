/**
 * Optimized Image Component
 * Features: lazy loading, progressive enhancement, error handling, and performance monitoring
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIntersectionObserver } from '@shared/hooks/useIntersectionObserver';
import { useMemoryTracker } from '@utils/memoryOptimization';
import LoadingSkeleton from './LoadingSkeleton';

// Image optimization configuration
const IMAGE_CONFIG = {
  // Loading states
  LOADING_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Intersection observer options
  INTERSECTION_OPTIONS: {
    threshold: 0.1,
    rootMargin: '50px',
  },
  
  // Image quality settings
  QUALITY_SETTINGS: {
    low: 0.3,
    medium: 0.7,
    high: 0.9,
  },
  
  // Placeholder settings
  PLACEHOLDER_COLOR: '#f3f4f6',
  BLUR_PLACEHOLDER: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==',
};

// Image loading states
const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
};

/**
 * Generate responsive image sources
 */
const generateSrcSet = (src, sizes = []) => {
  if (!sizes.length) return '';
  
  return sizes
    .map(size => {
      const url = new URL(src, window.location.origin);
      url.searchParams.set('w', size.toString());
      return `${url.toString()} ${size}w`;
    })
    .join(', ');
};

/**
 * Generate sizes attribute for responsive images
 */
const generateSizes = (breakpoints = []) => {
  if (!breakpoints.length) return '100vw';
  
  return breakpoints
    .map(bp => `(max-width: ${bp.maxWidth}px) ${bp.size}`)
    .join(', ') + ', 100vw';
};

/**
 * OptimizedImage Component
 */
const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  width,
  height,
  placeholder = 'blur',
  quality = 'medium',
  lazy = true,
  progressive = true,
  retries = IMAGE_CONFIG.RETRY_ATTEMPTS,
  onLoad,
  onError,
  onLoadStart,
  sizes = [],
  breakpoints = [],
  priority = false,
  fallbackSrc,
  ...props
}) => {
  // Component tracking
  useMemoryTracker('OptimizedImage');
  
  // State management
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadTime, setLoadTime] = useState(null);
  
  // Refs
  const imgRef = useRef(null);
  const loadStartTime = useRef(null);
  const retryTimeout = useRef(null);
  
  // Intersection observer for lazy loading
  const [isVisible, targetRef] = useIntersectionObserver({
    threshold: IMAGE_CONFIG.INTERSECTION_OPTIONS.threshold,
    rootMargin: IMAGE_CONFIG.INTERSECTION_OPTIONS.rootMargin,
    freezeOnceVisible: true,
  });
  
  // Determine if image should load
  const shouldLoad = !lazy || priority || isVisible;
  
  // Handle image load start
  const handleLoadStart = useCallback(() => {
    setLoadingState(LOADING_STATES.LOADING);
    loadStartTime.current = performance.now();
    onLoadStart?.();
  }, [onLoadStart]);
  
  // Handle successful image load
  const handleLoad = useCallback((event) => {
    const endTime = performance.now();
    const duration = loadStartTime.current ? endTime - loadStartTime.current : 0;
    
    setLoadingState(LOADING_STATES.LOADED);
    setLoadTime(duration);
    
    if (import.meta.env.DEV && duration > 2000) {
      console.warn(`🐌 Slow image load: ${src} took ${duration.toFixed(2)}ms`);
    }
    
    onLoad?.(event);
  }, [src, onLoad]);
  
  // Handle image load error
  const handleError = useCallback((event) => {
    console.error(`❌ Image load failed: ${currentSrc}`, event);
    
    if (retryCount < retries) {
      // Retry loading
      const delay = IMAGE_CONFIG.RETRY_DELAY * (retryCount + 1);
      
      retryTimeout.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setLoadingState(LOADING_STATES.IDLE);
        
        // Force reload by adding timestamp
        const url = new URL(src, window.location.origin);
        url.searchParams.set('retry', Date.now().toString());
        setCurrentSrc(url.toString());
      }, delay);
    } else if (fallbackSrc) {
      // Use fallback image
      setCurrentSrc(fallbackSrc);
      setRetryCount(0);
    } else {
      // Give up
      setLoadingState(LOADING_STATES.ERROR);
    }
    
    onError?.(event);
  }, [currentSrc, retryCount, retries, src, fallbackSrc, onError]);
  
  // Effect to start loading when conditions are met
  useEffect(() => {
    if (shouldLoad && !currentSrc && src) {
      setCurrentSrc(src);
    }
  }, [shouldLoad, currentSrc, src]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  }, []);
  
  // Generate responsive attributes
  const srcSet = sizes.length > 0 ? generateSrcSet(src, sizes) : undefined;
  const sizesAttr = breakpoints.length > 0 ? generateSizes(breakpoints) : undefined;
  
  // Determine placeholder content
  const renderPlaceholder = () => {
    if (placeholder === 'blur') {
      return (
        <img
          src={IMAGE_CONFIG.BLUR_PLACEHOLDER}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            loadingState === LOADING_STATES.LOADED ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        />
      );
    }
    
    if (placeholder === 'skeleton') {
      return (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            loadingState === LOADING_STATES.LOADED ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <LoadingSkeleton type="default" className="w-full h-full" />
        </div>
      );
    }
    
    if (placeholder === 'color') {
      return (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            loadingState === LOADING_STATES.LOADED ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backgroundColor: IMAGE_CONFIG.PLACEHOLDER_COLOR }}
          aria-hidden="true"
        />
      );
    }
    
    return null;
  };
  
  // Render error state
  if (loadingState === LOADING_STATES.ERROR) {
    return (
      <div
        ref={targetRef}
        className={`relative inline-block bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
        {...props}
      >
        <div className="text-center p-4">
          <svg
            className="w-8 h-8 text-gray-400 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">Failed to load image</p>
          {retries > 0 && (
            <button
              onClick={() => {
                setRetryCount(0);
                setLoadingState(LOADING_STATES.IDLE);
                setCurrentSrc(src);
              }}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={targetRef}
      className={`relative inline-block ${className}`}
      style={{ width, height, ...style }}
      {...props}
    >
      {/* Placeholder */}
      {loadingState !== LOADING_STATES.LOADED && renderPlaceholder()}
      
      {/* Main image */}
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={srcSet}
          sizes={sizesAttr}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loadingState === LOADING_STATES.LOADED ? 'opacity-100' : 'opacity-0'
          }`}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding={progressive ? 'async' : 'sync'}
        />
      )}
      
      {/* Loading indicator */}
      {loadingState === LOADING_STATES.LOADING && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
        </div>
      )}
      
      {/* Development info */}
      {import.meta.env.DEV && loadTime && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-br">
          {loadTime.toFixed(0)}ms
        </div>
      )}
    </div>
  );
};

// Higher-order component for image optimization
export const withImageOptimization = (Component) => {
  const OptimizedComponent = React.memo((props) => {
    return <Component {...props} />;
  });
  
  OptimizedComponent.displayName = `OptimizedImage(${Component.displayName || Component.name})`;
  
  return OptimizedComponent;
};

// Preload image utility
export const preloadImage = (src, options = {}) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = reject;
    
    // Set attributes
    if (options.crossOrigin) img.crossOrigin = options.crossOrigin;
    if (options.referrerPolicy) img.referrerPolicy = options.referrerPolicy;
    
    img.src = src;
  });
};

// Batch preload images
export const preloadImages = async (sources, options = {}) => {
  const { concurrency = 3, timeout = 10000 } = options;
  
  const results = [];
  
  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    
    const batchPromises = batch.map(src => 
      Promise.race([
        preloadImage(src, options),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ])
        .then(img => ({ src, success: true, img }))
        .catch(error => ({ src, success: false, error }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

// Image format detection
export const getSupportedImageFormat = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  // Check WebP support
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }
  
  // Check AVIF support
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif';
  }
  
  return 'jpeg';
};

// Image optimization utilities
export const imageUtils = {
  preloadImage,
  preloadImages,
  getSupportedImageFormat,
  generateSrcSet,
  generateSizes,
};

export default React.memo(OptimizedImage);
