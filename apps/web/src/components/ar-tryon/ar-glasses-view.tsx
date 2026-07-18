'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { ARGlassesModel, VisionAnalysis } from '../../types';

interface ARGlassesViewProps {
  videoElement: HTMLVideoElement | null;
  isActive: boolean;
  selectedGlasses: ARGlassesModel | null;
  onVisionUpdate?: (analysis: VisionAnalysis) => void;
}

// Simple procedural glasses geometry using Three.js
function createGlassesMesh(color: string = '#333333'): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({
    color: color,
    shininess: 30,
  });
  const lensMaterial = new THREE.MeshPhongMaterial({
    color: '#1a1a2e',
    transparent: true,
    opacity: 0.3,
    shininess: 100,
    side: THREE.DoubleSide,
  });

  // Left frame
  const leftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.04),
    material,
  );
  leftFrame.position.set(-0.12, 0, 0);
  group.add(leftFrame);

  // Right frame
  const rightFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.04),
    material,
  );
  rightFrame.position.set(0.12, 0, 0);
  group.add(rightFrame);

  // Bridge
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.015, 0.03),
    material,
  );
  bridge.position.set(0, 0, 0);
  group.add(bridge);

  // Left lens
  const leftLens = new THREE.Mesh(
    new THREE.PlaneGeometry(0.14, 0.05),
    lensMaterial,
  );
  leftLens.position.set(-0.12, 0, -0.02);
  group.add(leftLens);

  // Right lens
  const rightLens = new THREE.Mesh(
    new THREE.PlaneGeometry(0.14, 0.05),
    lensMaterial,
  );
  rightLens.position.set(0.12, 0, -0.02);
  group.add(rightLens);

  // Left arm
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, 0.01, 0.12),
    material,
  );
  leftArm.position.set(-0.16, 0, -0.07);
  leftArm.rotation.x = 0.3;
  group.add(leftArm);

  // Right arm
  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, 0.01, 0.12),
    material,
  );
  rightArm.position.set(0.16, 0, -0.07);
  rightArm.rotation.x = 0.3;
  group.add(rightArm);

  return group;
}

export function ARGlassesView({ videoElement, isActive, selectedGlasses, onVisionUpdate }: ARGlassesViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    glasses: THREE.Group;
    animationId: number;
  } | null>(null);

  const [isTracking, setIsTracking] = useState(false);

  const initScene = useCallback(() => {
    if (!containerRef.current) return; 

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create glasses
    const glasses = createGlassesMesh(selectedGlasses?.brand === 'Premium' ? '#c9a84c' : '#333333');
    glasses.position.set(0, 0, 0);
    glasses.scale.set(1.2, 1.2, 1.2);
    scene.add(glasses);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.01;
      // Subtle float animation
      glasses.position.y = Math.sin(time) * 0.02;
      glasses.rotation.y = Math.sin(time * 0.5) * 0.1;

      renderer.render(scene, camera);
      sceneRef.current!.animationId = requestAnimationFrame(animate);
    };

    sceneRef.current = { scene, camera, renderer, glasses, animationId: 0 };
    animate();
    setIsTracking(true);
  }, [selectedGlasses]);

  useEffect(() => {
    if (isActive) {
      initScene();
    }

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.renderer.dispose();
        const container = containerRef.current;
        if (container && sceneRef.current.renderer.domElement.parentElement === container) {
          container.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current = null;
      }
      setIsTracking(false);
    };
  }, [isActive, initScene]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full max-w-[640px] mx-auto aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-b from-blue-900/20 to-purple-900/20"
      />
      {isTracking && (
        <div className="text-center mt-2">
          <span className="inline-flex items-center gap-2 text-sm text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Face tracking active
          </span>
        </div>
      )}
    </div>
  );
}
