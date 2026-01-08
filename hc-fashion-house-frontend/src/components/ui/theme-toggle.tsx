"use client"

import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div
      className={cn(
        "flex p-1 rounded-full cursor-pointer transition-all duration-300",
        // Responsive sizing: smaller on mobile, larger on desktop
        "w-12 h-6 md:w-16 md:h-8",
        isDark 
          ? "bg-zinc-950 border border-zinc-800" 
          : "bg-white border border-zinc-200",
        className
      )}
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggleTheme()
        }
      }}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            "flex justify-center items-center rounded-full transition-transform duration-300",
            // Responsive icon container sizing
            "w-4 h-4 md:w-6 md:h-6",
            isDark 
              ? "transform translate-x-0 bg-zinc-800" 
              : "transform translate-x-6 md:translate-x-8 bg-gray-200"
          )}
        >
          {isDark ? (
            <Moon 
              className="w-2.5 h-2.5 md:w-4 md:h-4 text-white" 
              strokeWidth={1.5}
            />
          ) : (
            <Sun 
              className="w-2.5 h-2.5 md:w-4 md:h-4 text-gray-700" 
              strokeWidth={1.5}
            />
          )}
        </div>
        <div
          className={cn(
            "flex justify-center items-center rounded-full transition-transform duration-300",
            // Responsive icon container sizing
            "w-4 h-4 md:w-6 md:h-6",
            isDark 
              ? "bg-transparent" 
              : "transform -translate-x-6 md:-translate-x-8"
          )}
        >
          {isDark ? (
            <Sun 
              className="w-2.5 h-2.5 md:w-4 md:h-4 text-gray-500" 
              strokeWidth={1.5}
            />
          ) : (
            <Moon 
              className="w-2.5 h-2.5 md:w-4 md:h-4 text-black" 
              strokeWidth={1.5}
            />
          )}
        </div>
      </div>
    </div>
  )
}
