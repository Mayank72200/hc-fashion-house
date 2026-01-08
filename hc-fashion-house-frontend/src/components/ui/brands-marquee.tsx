import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type Brand = {
  name: string;
  logo?: string;
};

type BrandsMarqueeProps = {
  brands: Brand[];
  className?: string;
  speed?: number;
  mobileSpeed?: number;
  pauseOnHover?: boolean;
  reverse?: boolean;
  title?: string;
  subtitle?: string;
};

export function BrandsMarquee({ 
  brands, 
  className,
  speed = 40,
  mobileSpeed = 12,
  pauseOnHover = true,
  reverse = false,
  title,
  subtitle
}: BrandsMarqueeProps) {
  const isMobile = useIsMobile();
  const effectiveSpeed = isMobile ? mobileSpeed : speed;
  return (
    <div className={cn(
      "relative mx-auto w-full",
      className
    )}>
      {/* Header Section */}
      {(title || subtitle) && (
        <div className="text-center mb-4 md:mb-6 px-4">
          {/* Top decorative line */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="h-px w-12 md:w-24 bg-gradient-to-r from-transparent to-[#E5E7EB] dark:to-border" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#E5E7EB] dark:bg-primary/60" />
            <div className="h-px w-12 md:w-24 bg-gradient-to-l from-transparent to-[#E5E7EB] dark:to-border" />
          </div>
          
          {subtitle && (
            <p className="text-xs md:text-sm text-[#6B7280] dark:text-muted-foreground uppercase tracking-widest mb-1">
              {subtitle}
            </p>
          )}
          
          {title && (
            <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-[#1C1C1C] dark:text-foreground">
              {title}
            </h2>
          )}
          
          {/* Bottom decorative line */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent via-[#E5E7EB] dark:via-primary/40 to-transparent" />
          </div>
        </div>
      )}

      {/* Top border line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" style={{ top: title || subtitle ? 'auto' : 0 }} />

      <div className="py-4 md:py-6">
        <InfiniteSlider 
          gap={24} 
          reverse={reverse} 
          speed={effectiveSpeed} 
          pauseOnHover={pauseOnHover}
          className="py-2"
        >
          {brands.map((brand) => (
            <div
              key={`brand-${brand.name}`}
              className="flex items-center justify-center px-2 md:px-4"
            >
              <div className={cn(
                "flex items-center justify-center",
                "w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28",
                "rounded-xl md:rounded-2xl",
                "bg-card/80 dark:bg-card/60",
                "border border-border/50 dark:border-border/30",
                "shadow-sm hover:shadow-md",
                "transition-all duration-300",
                "hover:scale-105 hover:border-primary/30",
                "group"
              )}>
                {brand.logo ? (
                  <img
                    alt={brand.name}
                    src={brand.logo}
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16",
                      "object-contain",
                      "pointer-events-none select-none",
                      "transition-all duration-300",
                      "group-hover:scale-110",
                      // Light mode: keep original colors, Dark mode: invert for visibility
                      "dark:brightness-0 dark:invert dark:opacity-80"
                    )}
                    loading="lazy"
                  />
                ) : (
                  // Fallback: Text-based logo with brand initial
                  <div className={cn(
                    "flex flex-col items-center justify-center gap-1",
                    "transition-all duration-300",
                    "group-hover:scale-105"
                  )}>
                    <span className={cn(
                      "text-2xl md:text-3xl lg:text-4xl font-bold",
                      "bg-gradient-to-br from-foreground to-foreground/60",
                      "bg-clip-text text-transparent"
                    )}>
                      {brand.name.charAt(0)}
                    </span>
                    <span className={cn(
                      "text-[10px] md:text-xs font-medium",
                      "text-muted-foreground",
                      "uppercase tracking-wider"
                    )}>
                      {brand.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </InfiniteSlider>
      </div>

      {/* Progressive blur on left edge - smaller on mobile */}
      <ProgressiveBlur
        blurIntensity={0.5}
        blurLayers={4}
        className="pointer-events-none absolute top-0 left-0 h-full w-[30px] md:w-[80px] lg:w-[120px] z-10"
        direction="left"
      />
      
      {/* Progressive blur on right edge - smaller on mobile */}
      <ProgressiveBlur
        blurIntensity={0.5}
        blurLayers={4}
        className="pointer-events-none absolute top-0 right-0 h-full w-[30px] md:w-[80px] lg:w-[120px] z-10"
        direction="right"
      />

      {/* Bottom border line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

export default BrandsMarquee;
