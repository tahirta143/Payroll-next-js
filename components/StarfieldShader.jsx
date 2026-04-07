'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/hooks/useTheme';

const StarfieldShader = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    // Show starfield in both dark and light modes
    if (!mountRef.current) return;

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
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create starfield grid with perspective
    const gridSize = 80;
    const spacing = 0.2;
    const stars = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i - gridSize / 2) * spacing;
        const y = (j - gridSize / 2) * spacing;
        
        // Create perspective effect - points recede into distance
        const centerDistance = Math.sqrt(x * x + y * y);
        const z = centerDistance * 0.5 - 5;

        stars.push(x, y, z);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));

    // Shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: renderer.getPixelRatio() },
        isLightMode: { value: theme === 'light' ? 1.0 : 0.0 }
      },
      vertexShader: `
        attribute float size;
        varying float vDistance;
        varying vec3 vPosition;
        
        void main() {
          vPosition = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDistance = length(mvPosition.xyz);
          
          // Smaller points for distant stars
          gl_PointSize = size * (200.0 / max(vDistance, 1.0));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float pixelRatio;
        uniform float isLightMode;
        varying float vDistance;
        varying vec3 vPosition;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Create sharp, small points like in the reference image
          float alpha = 1.0 - smoothstep(0.1, 0.3, dist);
          
          // Adjust brightness and color based on theme
          float brightness;
          vec3 color;
          
          if (isLightMode > 0.5) {
            // Light mode: darker, more subtle points
            brightness = 0.3 + 0.1 * sin(time * 2.0 + vPosition.x * 5.0 + vPosition.y * 5.0);
            color = vec3(brightness * 0.6); // Darker gray for light mode
            alpha *= 0.4; // More transparent in light mode
          } else {
            // Dark mode: bright white points
            brightness = 0.8 + 0.2 * sin(time * 3.0 + vPosition.x * 10.0 + vPosition.y * 10.0);
            color = vec3(brightness);
          }
          
          // Fade based on distance for perspective
          alpha *= max(0.0, 1.0 - vDistance * 0.08);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Add size attribute for each star - smaller, more uniform sizes
    const sizes = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      sizes.push(0.8 + Math.random() * 0.4); // Smaller, tighter size range
    }
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Animation
    const clock = new THREE.Clock();
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      
      // Update shader uniforms
      material.uniforms.time.value = elapsedTime;
      material.uniforms.isLightMode.value = theme === 'light' ? 1.0 : 0.0;

      // Very subtle camera movement based on mouse
      camera.position.x = mouseX * 0.1;
      camera.position.y = mouseY * 0.1;
      camera.lookAt(scene.position);

      // Very slow rotation for subtle movement
      points.rotation.z = elapsedTime * 0.02;
      points.rotation.x = Math.sin(elapsedTime * 0.05) * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
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
  }, [theme]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

export default StarfieldShader;
