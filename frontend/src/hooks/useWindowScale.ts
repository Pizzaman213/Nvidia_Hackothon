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

      // Calculate scale based on both width and height, use the smaller one
      const widthScale = width / baseWidth;
      const heightScale = height / baseHeight;
      const scale = Math.min(widthScale, heightScale, 1); // Never scale up beyond 1

      setWindowScale({
        scale,
        width,
        height,
      });
    };

    // Calculate initial scale
    calculateScale();

    // Recalculate on window resize
    window.addEventListener('resize', calculateScale);
    window.addEventListener('orientationchange', calculateScale);

    return () => {
      window.removeEventListener('resize', calculateScale);
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
