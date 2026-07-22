'use client';

import { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
}

export default function ParticleHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const particles: Particle[] = [];
    const PARTICLE_COUNT = 80;
    const CONNECT_DIST = 140;
    const MOUSE_RADIUS = 120;

    let mouseX = -999;
    let mouseY = -999;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.scale(dpr, dpr);
    }

    function spawnParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.4 - 0.15,
          radius: Math.random() * 2 + 1,
          baseAlpha: Math.random() * 0.5 + 0.2,
          alpha: 0,
        });
      }
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, w, h);

      const t = time * 0.001;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // wave offset
        const wave = Math.sin(t * 0.8 + p.x * 0.005) * 12;

        p.x += p.vx;
        p.y += p.vy;

        // wrap around
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        // mouse repel
        const mdx = p.x - mouseX;
        const mdy = (p.y + wave) - mouseY;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < MOUSE_RADIUS) {
          const force = (1 - mdist / MOUSE_RADIUS) * 0.8;
          p.vx += (mdx / mdist) * force;
          p.vy += (mdy / mdist) * force;
        }

        // dampen velocity
        p.vx *= 0.98;
        p.vy *= 0.98;

        const drawY = p.y + wave;
        p.alpha += (p.baseAlpha - p.alpha) * 0.05;

        // draw particle
        ctx!.beginPath();
        ctx!.arc(p.x, drawY, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(34, 211, 238, ${p.alpha})`;
        ctx!.fill();

        // connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const wave2 = Math.sin(t * 0.8 + p2.x * 0.005) * 12;
          const drawY2 = p2.y + wave2;
          const dx = p.x - p2.x;
          const dy = drawY - drawY2;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.15;
            ctx!.beginPath();
            ctx!.moveTo(p.x, drawY);
            ctx!.lineTo(p2.x, drawY2);
            ctx!.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // floating glow orbs
      const orbs = [
        { x: w * 0.3, y: h * 0.4, r: 80, color: '0, 180, 216' },
        { x: w * 0.7, y: h * 0.6, r: 60, color: '139, 92, 246' },
        { x: w * 0.5, y: h * 0.3, r: 100, color: '0, 180, 216' },
      ];

      for (const orb of orbs) {
        const ox = orb.x + Math.sin(t * 0.5 + orb.x) * 30;
        const oy = orb.y + Math.cos(t * 0.3 + orb.y) * 20;
        const gradient = ctx!.createRadialGradient(ox, oy, 0, ox, oy, orb.r);
        gradient.addColorStop(0, `rgba(${orb.color}, 0.06)`);
        gradient.addColorStop(1, `rgba(${orb.color}, 0)`);
        ctx!.fillStyle = gradient;
        ctx!.fillRect(ox - orb.r, oy - orb.r, orb.r * 2, orb.r * 2);
      }

      animFrame.current = requestAnimationFrame(draw);
    }

    function onMouse(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }

    function onMouseLeave() {
      mouseX = -999;
      mouseY = -999;
    }

    resize();
    spawnParticles();
    animFrame.current = requestAnimationFrame(draw);

    window.addEventListener('resize', () => { resize(); spawnParticles(); });
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
