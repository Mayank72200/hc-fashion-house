'use client';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import useMeasure from 'react-use-measure';

type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  duration?: number;
  direction?: 'horizontal' | 'vertical';
  reverse?: boolean;
  className?: string;
  speed?: number;
  speedOnHover?: number;
  pauseOnHover?: boolean;
};

export function InfiniteSlider({
  children,
  gap = 16,
  duration = 25,
  direction = 'horizontal',
  reverse = false,
  className,
  speed,
  pauseOnHover = true,
}: InfiniteSliderProps) {
  // Support both speed and duration props (speed overrides duration)
  const effectiveDuration = speed ? 100 / speed : duration;
  
  const [ref, { width }] = useMeasure();
  const [isHovering, setIsHovering] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(effectiveDuration);
  
  // Calculate animation duration based on content width
  useEffect(() => {
    if (width > 0) {
      // Base duration scales with content width for consistent speed
      const baseDuration = (width / 500) * effectiveDuration;
      setAnimationDuration(baseDuration);
    }
  }, [width, effectiveDuration]);

  return (
    <div 
      className={cn('overflow-hidden', className)} 
      onMouseEnter={() => pauseOnHover && setIsHovering(true)}
      onMouseLeave={() => pauseOnHover && setIsHovering(false)}
    >
      <div
        ref={ref}
        className="flex w-max"
        style={{
          gap: `${gap}px`,
          flexDirection: direction === 'horizontal' ? 'row' : 'column',
          animationName: reverse ? 'marquee-scroll-reverse' : 'marquee-scroll',
          animationDuration: `${animationDuration}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationPlayState: isHovering ? 'paused' : 'running',
          willChange: 'transform',
        }}
      >
        {children}
        {children}
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0) translateZ(0);
          }
          100% {
            transform: translateX(-50%) translateZ(0);
          }
        }
        @keyframes marquee-scroll-reverse {
          0% {
            transform: translateX(-50%) translateZ(0);
          }
          100% {
            transform: translateX(0) translateZ(0);
          }
        }
      `}</style>
    </div>
  );
}
