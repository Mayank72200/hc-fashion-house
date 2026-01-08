import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hc-theme') || 'light';
    }
    return 'light';
  });

  const [segment, setSegment] = useState('default');

  useEffect(() => {
    const root = document.documentElement;
    
    // Toggle dark/light
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('hc-theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all segment themes
    root.classList.remove('theme-men', 'theme-women', 'theme-kids', 'theme-all', 'theme-home');
    
    // Add current segment theme
    if (segment !== 'default') {
      root.classList.add(`theme-${segment}`);
    }
  }, [segment]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    segment,
    setSegment,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
