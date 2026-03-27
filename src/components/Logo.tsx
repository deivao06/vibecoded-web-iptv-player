import React from 'react';

export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Círculo base - Chakra Energy / Wood rings */}
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          className="stroke-senju-dark" 
          strokeWidth="3" 
          strokeDasharray="10 5" 
          opacity="0.3"
        />
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          className="stroke-senju-light" 
          strokeWidth="1.5" 
          opacity="0.5"
        />
        
        {/* Play Triangle - Styled as a Wood Seed / Power node */}
        <path 
          d="M70 50L40 67.3205V32.6795L70 50Z" 
          className="fill-senju-light"
        />
        
        {/* Wood Chakra Lines */}
        <path 
          d="M25 50C25 36.1929 36.1929 25 50 25M75 50C75 63.8071 63.8071 75 50 75" 
          className="stroke-senju-accent" 
          strokeWidth="4" 
          strokeLinecap="round" 
          opacity="0.8"
        />
      </svg>
    </div>
  );
};
