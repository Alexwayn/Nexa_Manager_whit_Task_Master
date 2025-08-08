import React, { memo, useEffect, useRef, Profiler } from 'react';
import Logger from '@/utils/Logger';

// Performance monitoring hook
const usePerformanceMonitor = componentName => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    if (!componentName) return;

    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (import.meta.env?.MODE === 'development') {
      Logger.info(
        `[Performance] ${componentName} rendered ${renderCount.current} times, ${timeSinceLastRender}ms since last render`,
      );
    }
  });

  return { renderCount: renderCount.current };
};

// Profiler callback for measuring performance
const onRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
  interactions,
) => {
  if (import.meta.env?.MODE === 'development' && actualDuration > 16) {
    // Log slow renders (>16ms)
    Logger.warn(`[Performance Warning] ${id} took ${actualDuration}ms to render (${phase} phase)`);
    Logger.info({
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      interactions: Array.from(interactions),
    });
  }
};

const PerformanceWrapper = memo(
  ({
    children,
    componentName = 'UnnamedComponent',
    enableProfiling = import.meta.env?.MODE === 'development',
    enableMonitoring = import.meta.env?.MODE === 'development',
    warnThreshold = 16, // milliseconds
  }) => {
    const { renderCount } = usePerformanceMonitor(enableMonitoring ? componentName : null);

    if (enableProfiling) {
      return (
        <Profiler id={componentName} onRender={onRenderCallback}>
          {children}
        </Profiler>
      );
    }

    return children;
  },
);

PerformanceWrapper.displayName = 'PerformanceWrapper';

export default PerformanceWrapper;

// Higher-order component for easy wrapping
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  const WithPerformanceMonitoring = memo(props => (
    <PerformanceWrapper
      componentName={componentName || WrappedComponent.displayName || WrappedComponent.name}
    >
      <WrappedComponent {...props} />
    </PerformanceWrapper>
  ));

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return WithPerformanceMonitoring;
};
