import React from "react";
import { cn } from "../../lib/utils";

/**
 * Props interface for the StickyNote component
 */
interface StickyNoteProps {
  /**
   * Background color of the sticky note
   */
  backgroundColor?: string;
  /**
   * Text content to display on the note
   */
  content: string;
  /**
   * Optional width override (in pixels)
   */
  width?: number;
  /**
   * Optional height override (in pixels)
   */
  height?: number;
  /**
   * Optional className for additional styling
   */
  className?: string;
  /**
   * Optional rotation angle in degrees (default: -2)
   */
  rotation?: number;
  /**
   * Optional font size override
   */
  fontSize?: string;
}

/**
 * StickyNote component that renders a tilted sticky note with customizable appearance
 * 
 * Features:
 * - Tilted appearance with customizable rotation
 * - Drop shadow for depth
 * - Customizable background color
 * - Responsive design
 * - Handwritten-style font
 * - Proper padding and spacing
 */
export const StickyNote: React.FC<StickyNoteProps> = ({
  backgroundColor = "#FFF740", // Classic sticky note yellow
  content,
  width = 200,
  height = 200,
  className,
  rotation = -2,
  fontSize = "14px",
}) => {
  return (
    <div
      className={cn(
        // Base styling
        "relative inline-block p-4 font-handwriting leading-relaxed",
        // Shadow and depth effects
        "shadow-lg hover:shadow-xl transition-shadow duration-300",
        // Responsive behavior
        "max-w-full",
        // Custom className
        className
      )}
      style={{
        backgroundColor,
        width: `${width}px`,
        height: `${height}px`,
        minHeight: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        fontSize,
        // Advanced shadow for realistic depth
        boxShadow: `
          0 4px 8px rgba(0, 0, 0, 0.1),
          0 6px 20px rgba(0, 0, 0, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.3)
        `,
        // Slight gradient for paper texture
        backgroundImage: `
          linear-gradient(
            135deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          )
        `,
      }}
    >
      {/* Content container */}
      <div 
        className="relative z-10 h-full flex flex-col justify-start overflow-hidden"
        style={{
          // Ensure text doesn't overflow
          wordBreak: "break-word",
          hyphens: "auto",
        }}
      >
        {/* Note content */}
        <p className="text-gray-800 leading-relaxed">
          {content}
        </p>
      </div>
      
      {/* Corner curl effect (optional decorative element) */}
      <div
        className="absolute top-0 right-0 w-6 h-6 opacity-20"
        style={{
          background: "linear-gradient(-45deg, transparent 30%, rgba(0,0,0,0.1) 50%, transparent 70%)",
          transform: "rotate(45deg) translate(50%, -50%)",
        }}
      />
      
      {/* Subtle paper texture overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(0,0,0,0.1) 1px, transparent 1px),
            radial-gradient(circle at 80% 50%, rgba(0,0,0,0.1) 1px, transparent 1px),
            radial-gradient(circle at 40% 20%, rgba(0,0,0,0.1) 1px, transparent 1px),
            radial-gradient(circle at 60% 80%, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px, 25px 25px, 30px 30px, 35px 35px",
        }}
      />
    </div>
  );
};