import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for Intersection Observer API
 * Useful for lazy loading, infinite scrolling, and performance optimizations
 * 
 * @param {React.RefObject} targetRef - Ref to the target element
 * @param {Object} options - Intersection Observer options
 * @param {number|number[]} options.threshold - Threshold(s) for triggering
 * @param {string} options.rootMargin - Root margin for the observer
 * @param {Element} options.root - Root element for intersection
 * @param {boolean} options.triggerOnce - Whether to trigger only once
 * @returns {[boolean, Function]} - [isIntersecting, setIsIntersecting]
 */
export const useIntersectionObserver = (
  targetRef,
  {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    triggerOnce = false,
  } = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const targetElement = targetRef?.current;
    
    if (!targetElement) {
      return;
    }

    // If already triggered once and triggerOnce is true, don't observe again
    if (triggerOnce && isIntersecting) {
      return;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        
        if (isElementIntersecting) {
          setIsIntersecting(true);
          
          // If triggerOnce is true, disconnect after first intersection
          if (triggerOnce) {
            observerRef.current?.disconnect();
          }
        } else if (!triggerOnce) {
          // Only update to false if not triggerOnce
          setIsIntersecting(false);
        }
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    // Start observing
    observerRef.current.observe(targetElement);

    // Cleanup function
    return () => {
      observerRef.current?.disconnect();
    };
  }, [targetRef, threshold, rootMargin, root, triggerOnce, isIntersecting]);

  // Manual setter for external control
  const setIntersecting = (value) => {
    setIsIntersecting(value);
  };

  return [isIntersecting, setIntersecting];
};

/**
 * Hook for multiple intersection observers
 * Useful when you need to observe multiple elements
 * 
 * @param {React.RefObject[]} targetRefs - Array of refs to observe
 * @param {Object} options - Intersection Observer options
 * @returns {boolean[]} - Array of intersection states
 */
export const useMultipleIntersectionObserver = (targetRefs, options = {}) => {
  const [intersections, setIntersections] = useState(
    new Array(targetRefs.length).fill(false)
  );
  const observerRef = useRef(null);

  useEffect(() => {
    const validRefs = targetRefs.filter(ref => ref?.current);
    
    if (validRefs.length === 0) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = targetRefs.findIndex(
            ref => ref?.current === entry.target
          );
          
          if (index !== -1) {
            setIntersections(prev => {
              const newIntersections = [...prev];
              newIntersections[index] = entry.isIntersecting;
              return newIntersections;
            });
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '0px',
        root: null,
        ...options,
      }
    );

    // Observe all valid elements
    validRefs.forEach(ref => {
      if (ref.current) {
        observerRef.current.observe(ref.current);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [targetRefs, options]);

  return intersections;
};

/**
 * Hook for lazy loading with intersection observer
 * Automatically handles loading states and triggers
 * 
 * @param {React.RefObject} targetRef - Ref to the target element
 * @param {Function} loadCallback - Function to call when element intersects
 * @param {Object} options - Intersection Observer options
 * @returns {Object} - { isVisible, isLoading, error, retry }
 */
export const useLazyLoad = (
  targetRef,
  loadCallback,
  options = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible] = useIntersectionObserver(targetRef, {
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  });

  useEffect(() => {
    if (isVisible && !hasLoaded && !isLoading) {
      setIsLoading(true);
      setError(null);
      
      Promise.resolve(loadCallback())
        .then(() => {
          setHasLoaded(true);
        })
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isVisible, hasLoaded, isLoading, loadCallback]);

  const retry = () => {
    setError(null);
    setHasLoaded(false);
  };

  return {
    isVisible,
    isLoading,
    error,
    hasLoaded,
    retry,
  };
};

/**
 * Hook for infinite scrolling with intersection observer
 * Triggers loading more content when reaching the bottom
 * 
 * @param {Function} loadMore - Function to load more content
 * @param {Object} options - Configuration options
 * @returns {Object} - { targetRef, isLoading, error, retry }
 */
export const useInfiniteScroll = (
  loadMore,
  {
    hasMore = true,
    threshold = 1.0,
    rootMargin = '100px',
    ...observerOptions
  } = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const targetRef = useRef(null);
  
  const [isIntersecting] = useIntersectionObserver(targetRef, {
    threshold,
    rootMargin,
    ...observerOptions,
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      setIsLoading(true);
      setError(null);
      
      Promise.resolve(loadMore())
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isIntersecting, hasMore, isLoading, loadMore]);

  const retry = () => {
    setError(null);
  };

  return {
    targetRef,
    isLoading,
    error,
    retry,
  };
};

export default useIntersectionObserver;
