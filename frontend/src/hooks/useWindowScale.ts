// ============================================================================
// useWindowScale - Custom hook for dynamic window-based scaling
// ============================================================================

import { useEffect, useState } from 'react';

interface WindowScale {
  scale: number;
  width: number;
  height: number;
}

/**
 * Custom hook that calculates the optimal scale factor based on window size
 * @param baseWidth - Base width to scale from (default: 1920)
 * @param baseHeight - Base height to scale from (default: 1080)
 * @returns Object containing scale factor and window dimensions
 */
export const useWindowScale = (
  baseWidth: number = 1920,
  baseHeight: number = 1080
): WindowScale => {
  const [windowScale, setWindowScale] = useState<WindowScale>({
    scale: 1,
    width: typeof window !== 'undefined' ? window.innerWidth : baseWidth,
    height: typeof window !== 'undefined' ? window.innerHeight : baseHeight,
  });

  useEffect(() => {
    const calculateScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Use a more conservative scaling approach
      // Only scale down significantly on very small screens
      let scale = 1;

      if (width < 768) {
        // Mobile devices - use minimal scaling, let responsive design handle it
        scale = 1;
      } else if (width < 1024) {
        // Tablets - slight scaling if needed
        scale = Math.max(width / baseWidth, 0.85);
      } else {
        // Desktop - only scale down on smaller desktop screens
        scale = Math.min(Math.max(width / baseWidth, 0.9), 1);
      }

      setWindowScale({
        scale,
        width,
        height,
      });
    };

    // Calculate initial scale
    calculateScale();

    // Recalculate on window resize with debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedCalculate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateScale, 100);
    };

    window.addEventListener('resize', debouncedCalculate);
    window.addEventListener('orientationchange', calculateScale);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedCalculate);
      window.removeEventListener('orientationchange', calculateScale);
    };
  }, [baseWidth, baseHeight]);

  return windowScale;
};

/**
 * Hook that provides CSS style object for scaling
 */
export const useScaleStyle = (
  baseWidth?: number,
  baseHeight?: number
): React.CSSProperties => {
  const { scale } = useWindowScale(baseWidth, baseHeight);

  return {
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    width: `${100 / scale}%`,
    height: `${100 / scale}%`,
  };
};
