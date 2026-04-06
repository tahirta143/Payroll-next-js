'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const vertexShader = `
  attribute float size;
  varying vec3 vPosition;
  varying float vAlpha;
  uniform float time;
  uniform float pixelRatio;
  uniform bool isDarkMode;
  
  void main() {
    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Water-like fluid motion
    float waveX = sin(position.x * 0.2 + time * 0.8) * 0.15;
    float waveY = cos(position.y * 0.3 + time * 0.6) * 0.12;
    float waveZ = sin(length(position.xy) * 0.1 + time * 0.4) * 0.08;
    
    mvPosition.xyz += vec3(waveX, waveY, waveZ);
    
    // Distance-based alpha for depth
    float distance = length(position.xy);
    vAlpha = 1.0 - smoothstep(0.0, 15.0, distance);
    
    gl_PointSize = size * (60.0 / -mvPosition.z) * pixelRatio;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vPosition;
  varying float vAlpha;
  uniform float time;
  uniform bool isDarkMode;
  
  void main() {
    // Create circular particles
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    // Soft circular falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vAlpha;
    
    // Theme-based color
    vec3 color = isDarkMode ? 
      vec3(0.9, 0.9, 1.0) : // Bright white for dark mode
      vec3(0.3, 0.3, 0.4);  // Dimmer for light mode
    
    // Add subtle glow
    float glow = exp(-dist * 8.0) * 0.2;
    
    // Gentle shimmer
    float shimmer = sin(time * 2.0 + length(vPosition) * 1.5) * 0.05 + 0.95;
    
    gl_FragColor = vec4(color * shimmer + glow, alpha * 0.6);
  }
`;

export default function ShaderBackground() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);
  const [isReduced, setIsReduced] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(mediaQuery.matches);
    
    const handleChange = (e) => setIsReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    // Check theme
    const checkTheme = () => {
      const html = document.documentElement;
      setIsDarkMode(html.classList.contains('dark'));
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current || isReduced) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create full-screen water-like particle distribution
    const particleCount = 15000;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Generate particles across entire screen
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Full screen coverage - much wider distribution
      positions[i3] = (Math.random() - 0.5) * 40; // Very wide X range
      positions[i3 + 1] = (Math.random() - 0.5) * 30; // Very wide Y range
      positions[i3 + 2] = (Math.random() - 0.5) * 1;  // Keep Z flat

      // Size exactly 1 for consistent visibility
      sizes[i] = 1.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        isDarkMode: { value: isDarkMode }
      },
      vertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Animation loop
    const clock = new THREE.Clock();
    let lastTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime) => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Frame rate limiting
      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameInterval) return;
      lastTime = currentTime;
      
      const elapsedTime = clock.getElapsedTime();
      material.uniforms.time.value = elapsedTime;
      material.uniforms.isDarkMode.value = isDarkMode;
      
      // Water-like fluid motion
      particles.rotation.y = elapsedTime * 0.01;
      particles.rotation.x = Math.sin(elapsedTime * 0.04) * 0.03;
      
      // Additional water flow
      particles.position.x = Math.sin(elapsedTime * 0.3) * 2.0;
      particles.position.y = Math.cos(elapsedTime * 0.2) * 1.5;
      
      renderer.render(scene, camera);
    };

    animate(0);

    // Handle resize
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.pixelRatio.value = Math.min(window.devicePixelRatio, 2);
      }, 250);
    };

    window.addEventListener('resize', handleResize);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      } else {
        animate(0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(resizeTimeout);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [isReduced, isDarkMode]);

  // Fallback for reduced motion
  if (isReduced) {
    return (
      <div className={`fixed inset-0 pointer-events-none z-0 ${
        isDarkMode ? 'bg-slate-900/10' : 'bg-slate-100/10'
      }`} />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div 
        ref={mountRef} 
        className="absolute inset-0"
        style={{ mixBlendMode: isDarkMode ? 'screen' : 'multiply' }}
      />
    </div>
  );
}
