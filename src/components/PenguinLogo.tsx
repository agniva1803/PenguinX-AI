import { motion } from "framer-motion";

interface PenguinLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  showText?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const textSizes = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export const PenguinLogo = ({ size = "md", animated = true, showText = true }: PenguinLogoProps) => {
  const MotionDiv = animated ? motion.div : "div";
  
  return (
    <div className="flex items-center gap-3">
      <MotionDiv
        className={`${sizeClasses[size]} relative flex items-center justify-center`}
        {...(animated && {
          animate: { y: [0, -3, 0] },
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        })}
      >
        {/* Penguin SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Body */}
          <ellipse cx="50" cy="60" rx="30" ry="35" fill="hsl(200, 35%, 12%)" />
          
          {/* Belly */}
          <ellipse cx="50" cy="65" rx="20" ry="25" fill="hsl(0, 0%, 95%)" />
          
          {/* Head */}
          <circle cx="50" cy="28" r="22" fill="hsl(200, 35%, 12%)" />
          
          {/* Eyes */}
          <ellipse cx="42" cy="25" rx="6" ry="7" fill="white" />
          <ellipse cx="58" cy="25" rx="6" ry="7" fill="white" />
          <circle cx="43" cy="26" r="3" fill="hsl(200, 35%, 12%)" />
          <circle cx="59" cy="26" r="3" fill="hsl(200, 35%, 12%)" />
          <circle cx="44" cy="25" r="1" fill="white" />
          <circle cx="60" cy="25" r="1" fill="white" />
          
          {/* Beak */}
          <ellipse cx="50" cy="35" rx="6" ry="4" fill="hsl(30, 90%, 55%)" />
          
          {/* Wings */}
          <ellipse cx="22" cy="55" rx="8" ry="20" fill="hsl(200, 35%, 12%)" transform="rotate(-15, 22, 55)" />
          <ellipse cx="78" cy="55" rx="8" ry="20" fill="hsl(200, 35%, 12%)" transform="rotate(15, 78, 55)" />
          
          {/* Feet */}
          <ellipse cx="40" cy="93" rx="8" ry="4" fill="hsl(30, 90%, 55%)" />
          <ellipse cx="60" cy="93" rx="8" ry="4" fill="hsl(30, 90%, 55%)" />
          
          {/* AI Glow Effect */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(185, 80%, 50%)" strokeWidth="1" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </MotionDiv>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-display font-bold ${textSizes[size]} text-foreground`}>
            PenguinX <span className="text-gradient">AI</span>
          </span>
          {size !== "sm" && (
            <span className="text-xs text-muted-foreground">Career Intelligence</span>
          )}
        </div>
      )}
    </div>
  );
};
