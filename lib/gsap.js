import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP Animation Utilities
 * 
 * This module provides helper functions for consistent animations throughout the application.
 * All animations respect the user's prefers-reduced-motion setting for accessibility.
 */

// Check if user prefers reduced motion
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Initialize GSAP with global settings and accessibility considerations
 */
export const initGSAP = () => {
  // Set global defaults
  gsap.defaults({
    duration: prefersReducedMotion() ? 0 : 0.6,
    ease: "power2.out"
  });

  // Disable animations if user prefers reduced motion
  if (prefersReducedMotion()) {
    gsap.globalTimeline.timeScale(0);
  }

  return {
    isReducedMotion: prefersReducedMotion(),
    gsap,
    ScrollTrigger
  };
};

/**
 * Animate page content on mount with fade-in and translate
 * @param {HTMLElement|React.RefObject} element - Element to animate
 * @param {Object} options - Animation options
 */
export const animatePageEntrance = (element, options = {}) => {
  if (prefersReducedMotion()) return;
  
  const el = element?.current || element;
  if (!el) return;

  const {
    duration = 0.8,
    delay = 0,
    y = 20,
    ease = "power2.out"
  } = options;

  gsap.fromTo(el, 
    {
      opacity: 0,
      y: y,
    },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease
    }
  );
};

/**
 * Animate modal opening with scale and fade effect
 * @param {HTMLElement|React.RefObject} element - Modal element to animate
 * @param {Function} onComplete - Callback when animation completes
 * @param {Object} options - Animation options
 */
export const animateModalOpen = (element, onComplete, options = {}) => {
  if (prefersReducedMotion()) {
    onComplete?.();
    return;
  }
  
  const el = element?.current || element;
  if (!el) return;

  const {
    duration = 0.3,
    ease = "back.out(1.7)"
  } = options;

  gsap.fromTo(el,
    {
      opacity: 0,
      scale: 0.95,
      transformOrigin: "center center"
    },
    {
      opacity: 1,
      scale: 1,
      duration,
      ease,
      onComplete
    }
  );
};

/**
 * Animate modal closing with scale and fade effect
 * @param {HTMLElement|React.RefObject} element - Modal element to animate
 * @param {Function} onComplete - Callback when animation completes (for unmounting)
 * @param {Object} options - Animation options
 */
export const animateModalClose = (element, onComplete, options = {}) => {
  if (prefersReducedMotion()) {
    onComplete?.();
    return;
  }
  
  const el = element?.current || element;
  if (!el) return;

  const {
    duration = 0.2,
    ease = "power2.in"
  } = options;

  gsap.to(el,
    {
      opacity: 0,
      scale: 0.95,
      duration,
      ease,
      onComplete
    }
  );
};

/**
 * Animate cards with staggered entrance effect
 * @param {NodeList|Array} elements - Array of elements to animate
 * @param {Object} options - Animation options
 */
export const animateStaggeredCards = (elements, options = {}) => {
  if (prefersReducedMotion()) return;
  
  if (!elements || elements.length === 0) return;

  const {
    duration = 0.6,
    stagger = 0.1,
    y = 30,
    ease = "power2.out"
  } = options;

  gsap.fromTo(elements,
    {
      opacity: 0,
      y: y,
    },
    {
      opacity: 1,
      y: 0,
      duration,
      ease,
      stagger
    }
  );
};

/**
 * Setup ScrollTrigger animation for elements
 * @param {NodeList|Array|HTMLElement} elements - Elements to animate on scroll
 * @param {Object} options - ScrollTrigger and animation options
 */
export const setupScrollTrigger = (elements, options = {}) => {
  if (prefersReducedMotion()) return;
  
  if (!elements) return;

  const {
    trigger = elements,
    start = "top 80%",
    end = "bottom 20%",
    duration = 0.6,
    y = 20,
    stagger = 0.1,
    ease = "power2.out",
    once = true
  } = options;

  const elementsArray = Array.isArray(elements) ? elements : [elements];

  elementsArray.forEach((element, index) => {
    gsap.fromTo(element,
      {
        opacity: 0,
        y: y,
      },
      {
        opacity: 1,
        y: 0,
        duration,
        ease,
        delay: stagger * index,
        scrollTrigger: {
          trigger: element,
          start,
          end,
          toggleActions: once ? "play none none none" : "play none none reverse"
        }
      }
    );
  });
};

/**
 * Animate sidebar item hover effect
 * @param {HTMLElement} element - Sidebar item element
 * @param {boolean} isHover - Whether hovering or not
 */
export const animateSidebarHover = (element, isHover) => {
  if (prefersReducedMotion()) return;
  
  if (!element) return;

  const icon = element.querySelector('.sidebar-icon');
  if (!icon) return;

  gsap.to(icon, {
    x: isHover ? 4 : 0,
    duration: 0.2,
    ease: "power2.out"
  });
};

/**
 * Animate toast notification appearance
 * @param {HTMLElement|React.RefObject} element - Toast element
 * @param {Object} options - Animation options
 */
export const animateToastIn = (element, options = {}) => {
  if (prefersReducedMotion()) return;
  
  const el = element?.current || element;
  if (!el) return;

  const {
    duration = 0.4,
    x = 100,
    ease = "back.out(1.7)"
  } = options;

  gsap.fromTo(el,
    {
      opacity: 0,
      x: x,
    },
    {
      opacity: 1,
      x: 0,
      duration,
      ease
    }
  );
};

/**
 * Animate toast notification dismissal
 * @param {HTMLElement|React.RefObject} element - Toast element
 * @param {Function} onComplete - Callback when animation completes
 * @param {Object} options - Animation options
 */
export const animateToastOut = (element, onComplete, options = {}) => {
  if (prefersReducedMotion()) {
    onComplete?.();
    return;
  }
  
  const el = element?.current || element;
  if (!el) return;

  const {
    duration = 0.3,
    x = 100,
    ease = "power2.in"
  } = options;

  gsap.to(el,
    {
      opacity: 0,
      x: x,
      duration,
      ease,
      onComplete
    }
  );
};

/**
 * Create a timeline for complex animations
 * @param {Object} options - Timeline options
 * @returns {gsap.timeline} GSAP timeline instance
 */
export const createTimeline = (options = {}) => {
  const {
    paused = false,
    repeat = 0,
    yoyo = false
  } = options;

  return gsap.timeline({
    paused,
    repeat,
    yoyo
  });
};

/**
 * Utility to kill all ScrollTrigger instances (useful for cleanup)
 */
export const killAllScrollTriggers = () => {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
};

/**
 * Refresh ScrollTrigger (useful after dynamic content changes)
 */
export const refreshScrollTrigger = () => {
  ScrollTrigger.refresh();
};

// Export GSAP and ScrollTrigger for direct use if needed
export { gsap, ScrollTrigger };