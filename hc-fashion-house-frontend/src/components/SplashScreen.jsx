import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 400);
    }, 1800); // Reduced from 2500ms to 1800ms

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
        >
          <div className="text-center">
            {/* Logo Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6"
            >
              {/* HC Monogram */}
              <div className="relative inline-block">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 relative"
                >
                  <div className="absolute inset-0 border-2 border-gold rounded-full" />
                  <div className="absolute inset-2 border border-gold/50 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-4xl md:text-5xl font-bold logo-shine">
                      HC
                    </span>
                  </div>
                  {/* Glowing effect */}
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        '0 0 20px hsl(45 93% 47% / 0.3)',
                        '0 0 40px hsl(45 93% 47% / 0.5)',
                        '0 0 20px hsl(45 93% 47% / 0.3)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Brand Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                <span className="text-gradient-gold">Fashion House</span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-muted-foreground text-sm md:text-base tracking-widest uppercase"
              >
                Premium Footwear Since 1994
              </motion.p>
            </motion.div>

            {/* Loading Indicator */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="mt-8 mx-auto w-32 h-0.5 bg-border rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1, repeat: 1, ease: 'easeInOut' }}
                className="h-full w-1/2 bg-gold rounded-full"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
