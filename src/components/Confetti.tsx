import React, { useEffect, useRef, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'circle' | 'square' | 'triangle' | 'ribbon';
  wobble: number;
  wobbleSpeed: number;
  gravity: number;
  drag: number;
}

const COLORS = [
  '#2563EB', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
];

const SHAPES: Array<Particle['shape']> = ['circle', 'square', 'triangle', 'ribbon'];

export const Confetti: React.FC<ConfettiProps> = ({ active, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const activeRef = useRef<boolean>(active);

  // Keep a ref to active to use inside loops safely
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Handle ResizeObserver on the container element with debouncing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const { width, height } = entry.contentRect;

      // Debounce state updates to prevent rapid re-renders during active dragging
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({ width, height });
      }, 100);
    });

    observer.observe(container);

    // Initial size
    const rect = container.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  // Update canvas internal render dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
  }, [dimensions]);

  // Main Confetti Trigger & Animation Loop
  useEffect(() => {
    if (!active || dimensions.width === 0 || dimensions.height === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Reset particles
    const list: Particle[] = [];
    const count = 120; // total double-burst count

    // Left cannon burst
    for (let i = 0; i < count / 2; i++) {
      const angle = -Math.PI / 6 - Math.random() * (Math.PI / 4); // upwards and rightwards
      const speed = 10 + Math.random() * 20;
      list.push({
        x: 0,
        y: dimensions.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotationSpeed: -5 + Math.random() * 10,
        opacity: 1,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        wobble: Math.random() * 10,
        wobbleSpeed: 0.05 + Math.random() * 0.1,
        gravity: 0.2 + Math.random() * 0.15,
        drag: 0.96 + Math.random() * 0.02,
      });
    }

    // Right cannon burst
    for (let i = 0; i < count / 2; i++) {
      const angle = -Math.PI * 5 / 6 + Math.random() * (Math.PI / 4); // upwards and leftwards
      const speed = 10 + Math.random() * 20;
      list.push({
        x: dimensions.width,
        y: dimensions.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotationSpeed: -5 + Math.random() * 10,
        opacity: 1,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        wobble: Math.random() * 10,
        wobbleSpeed: 0.05 + Math.random() * 0.1,
        gravity: 0.2 + Math.random() * 0.15,
        drag: 0.96 + Math.random() * 0.02,
      });
    }

    particlesRef.current = list;

    const tick = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const items = particlesRef.current;
      let activeParticles = 0;

      for (let i = 0; i < items.length; i++) {
        const p = items[i];
        if (p.opacity <= 0) continue;

        activeParticles++;

        // Apply physics
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;

        // Apply rotation and wobble
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        // Visual fade out as particles descend or go off-page
        if (p.y > dimensions.height * 0.6) {
          p.opacity -= 0.006;
        }

        if (p.y > dimensions.height || p.x < -40 || p.x > dimensions.width + 40) {
          p.opacity = 0;
          continue;
        }

        if (p.opacity <= 0) continue;

        // Render particle with rotation and perspective width (cos wobble)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        const w = p.size * Math.cos(p.wobble);
        const h = p.size;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.abs(w) / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'square') {
          ctx.fillRect(-w / 2, -h / 2, w, h);
        } else if (p.shape === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(0, -h / 2);
          ctx.lineTo(w / 2, h / 2);
          ctx.lineTo(-w / 2, h / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          // Ribbon shape with wavy path
          ctx.beginPath();
          ctx.moveTo(-w / 2, -h / 2);
          ctx.bezierCurveTo(w / 4, -h / 2, -w / 4, h / 2, w / 2, h / 2);
          ctx.lineWidth = Math.max(2, p.size / 3);
          ctx.strokeStyle = p.color;
          ctx.stroke();
        }

        ctx.restore();
      }

      if (activeParticles > 0 && activeRef.current) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Complete
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
        if (onComplete) onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [active, dimensions, onComplete]);

  return (
    <div
      ref={containerRef}
      id="confetti-container"
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    >
      <canvas
        ref={canvasRef}
        id="confetti-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
