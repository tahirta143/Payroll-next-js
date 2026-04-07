'use client';

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@/hooks/useTheme';

/**
 * A cosmic parallax background component with animated stars
 * Works in both dark and light modes
 */
const CosmicParallaxBg = ({
  loop = true,
  className = '',
}) => {
  const [smallStars, setSmallStars] = useState('');
  const [mediumStars, setMediumStars] = useState('');
  const [bigStars, setBigStars] = useState('');
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  
  // Generate random star positions
  const generateStarBoxShadow = (count, isLight) => {
    const shadows = [];
    
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 2000);
      const y = Math.floor(Math.random() * 2000);
      // Light mode: dark stars, Dark mode: white stars
      const color = isLight ? 'rgba(71, 85, 105, 0.3)' : 'rgba(255, 255, 255, 0.4)';
      shadows.push(`${x}px ${y}px ${color}`);
    }
    
    return shadows.join(', ');
  };
  
  useEffect(() => {
    // Generate star shadows when component mounts or theme changes
    setSmallStars(generateStarBoxShadow(700, isLightMode));
    setMediumStars(generateStarBoxShadow(200, isLightMode));
    setBigStars(generateStarBoxShadow(100, isLightMode));
    
    // Set animation iteration based on loop prop
    document.documentElement.style.setProperty(
      '--animation-iteration', 
      loop ? 'infinite' : '1'
    );
  }, [loop, isLightMode]);
  
  return (
    <div className={`cosmic-parallax-container ${isLightMode ? 'cosmic-light' : 'cosmic-dark'} ${className}`}>
      {/* Stars layers */}
      <div 
        id="stars" 
        style={{ boxShadow: smallStars }}
        className="cosmic-stars"
      ></div>
      <div 
        id="stars2" 
        style={{ boxShadow: mediumStars }}
        className="cosmic-stars-medium"
      ></div>
      <div 
        id="stars3" 
        style={{ boxShadow: bigStars }}
        className="cosmic-stars-large"
      ></div>
      
      {/* Horizon and Earth - only in dark mode */}
      {!isLightMode && (
        <>
          <div id="horizon">
            <div className="glow"></div>
          </div>
          <div id="earth"></div>
        </>
      )}
    </div>
  );
};

CosmicParallaxBg.propTypes = {
  /**
   * Whether the animations should loop
   * @default true
   */
  loop: PropTypes.bool,
  
  /**
   * Custom class name for additional styling
   */
  className: PropTypes.string,
};

export { CosmicParallaxBg };
