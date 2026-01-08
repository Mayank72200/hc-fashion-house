import React, { useRef, useId } from 'react';
import { 
  motion, 
  useMotionValue, 
  useMotionTemplate, 
  useAnimationFrame 
} from "framer-motion";
import { cn } from '@/lib/utils';

/**
 * Helper component for the SVG grid pattern.
 */
const GridPattern = ({ offsetX, offsetY, size, patternId }: { offsetX: any; offsetY: any; size: number; patternId: string }) => {
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id={patternId}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d={`M ${size} 0 L 0 0 0 ${size}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-foreground/60" 
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};

interface FloatingShoe {
  src: string;
  alt: string;
  className?: string;
  delay?: number;
  duration?: number;
  initialPosition?: { x: string; y: string };
}

interface InfiniteGridBackgroundProps {
  className?: string;
  gridSize?: number;
  speed?: number;
  showBlurSpheres?: boolean;
  floatingShoes?: FloatingShoe[];
  children?: React.ReactNode;
}

/**
 * The Infinite Grid Background Component
 * Displays a scrolling background grid that reveals an active layer on mouse hover.
 * Can include floating shoe images with animations.
 */
export function InfiniteGridBackground({ 
  className,
  gridSize = 40,
  speed = 0.5,
  showBlurSpheres = true,
  floatingShoes = [],
  children 
}: InfiniteGridBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();

  // Track mouse position with Motion Values for performance (avoids React re-renders)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  // Grid offsets for infinite scroll animation
  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  useAnimationFrame(() => {
    const currentX = gridOffsetX.get();
    const currentY = gridOffsetY.get();
    // Reset offset at pattern width to simulate infinity
    gridOffsetX.set((currentX + speed) % gridSize);
    gridOffsetY.set((currentY + speed) % gridSize);
  });

  // Create a dynamic radial mask for the "flashlight" effect
  // Responsive: smaller on mobile, larger on desktop
  const maskImage = useMotionTemplate`radial-gradient(180px circle at ${mouseX}px ${mouseY}px, black, transparent)`;
  const maskImageMd = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, black, transparent)`;
  const maskImageLg = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "absolute inset-0 overflow-hidden",
        className
      )}
    >
      {/* Layer 1: Subtle background grid (always visible) - increased opacity for visibility */}
      <div className="absolute inset-0 z-0 opacity-[0.15] dark:opacity-[0.12]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} patternId={`grid-bg-${uniqueId}`} />
      </div>

      {/* Layer 2: Highlighted grid (revealed by mouse mask) - Responsive */}
      <motion.div 
        className="absolute inset-0 z-[1] opacity-50 dark:opacity-60 hidden lg:block"
        style={{ maskImage: maskImageLg, WebkitMaskImage: maskImageLg }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} patternId={`grid-hover-lg-${uniqueId}`} />
      </motion.div>
      <motion.div 
        className="absolute inset-0 z-[1] opacity-45 dark:opacity-55 hidden md:block lg:hidden"
        style={{ maskImage: maskImageMd, WebkitMaskImage: maskImageMd }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} patternId={`grid-hover-md-${uniqueId}`} />
      </motion.div>
      <motion.div 
        className="absolute inset-0 z-[1] opacity-40 dark:opacity-50 md:hidden"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} patternId={`grid-hover-sm-${uniqueId}`} />
      </motion.div>

      {/* Decorative Blur Spheres */}
      {showBlurSpheres && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Top right sphere - orange/gold accent */}
          <div className="absolute right-[-15%] md:right-[-10%] top-[-15%] md:top-[-10%] w-[50%] md:w-[35%] h-[40%] md:h-[35%] rounded-full bg-orange-500/20 dark:bg-orange-600/15 blur-[80px] md:blur-[120px]" />
          <div className="absolute right-[5%] md:right-[15%] top-[-5%] md:top-[0%] w-[25%] md:w-[18%] h-[20%] md:h-[18%] rounded-full bg-primary/20 blur-[60px] md:blur-[100px]" />
          {/* Bottom left sphere - blue accent */}
          <div className="absolute left-[-15%] md:left-[-5%] bottom-[-20%] md:bottom-[-15%] w-[50%] md:w-[35%] h-[40%] md:h-[35%] rounded-full bg-blue-500/20 dark:bg-blue-600/15 blur-[80px] md:blur-[120px]" />
        </div>
      )}

      {/* Floating Shoe Images */}
      {floatingShoes.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-[1]">
          {floatingShoes.map((shoe, index) => (
            <motion.div
              key={index}
              initial={{ 
                opacity: 0, 
                scale: 0.8,
                rotate: -15 + Math.random() * 30
              }}
              animate={{ 
                opacity: [0, 0.6, 0.4, 0.6],
                scale: [0.8, 1, 0.95, 1],
                y: [0, -10, 0, -8, 0],
                rotate: [-15 + index * 5, -10 + index * 5, -15 + index * 5]
              }}
              transition={{ 
                delay: shoe.delay || index * 0.3,
                duration: shoe.duration || 5 + index,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={cn(
                "absolute",
                shoe.className
              )}
              style={{
                left: shoe.initialPosition?.x,
                top: shoe.initialPosition?.y,
              }}
            >
              <img
                src={shoe.src}
                alt={shoe.alt}
                className="w-full h-auto object-contain drop-shadow-lg opacity-40 dark:opacity-30"
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Children content */}
      {children}
    </div>
  );
}

export default InfiniteGridBackground;
