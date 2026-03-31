import { useRef, useEffect, useCallback } from 'react';
import { ParticleSystem } from '../particles';

// Global particle system instance shared across components
const globalParticles = new ParticleSystem();

export function getGlobalParticles() {
  return globalParticles;
}

export default function ParticleOverlay() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Match canvas to screen size
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    globalParticles.update();
    globalParticles.draw(ctx);

    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
