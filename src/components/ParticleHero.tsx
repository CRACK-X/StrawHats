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
  pulseOffset: number;
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
    const CONNECT_DIST = 180;
    const MOUSE_RADIUS = 160;

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
          y: 18 + Math.random() * (h - 36),
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.0 - 0.3,
          radius: Math.random() * 2.5 + 1,
          baseAlpha: Math.random() * 0.6 + 0.4,
          alpha: 0,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    const WAVE_AMPLITUDE = 18;

    function draw(time: number) {
      ctx!.clearRect(0, 0, w, h);

      const t = time * 0.001;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const wave = Math.sin(t * 1.2 + p.x * 0.008) * WAVE_AMPLITUDE;
        const pulse = Math.sin(t * 2 + p.pulseOffset) * 0.2 + 0.8;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) * 0.5; }
        if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx) * 0.5; }
        if (p.y < WAVE_AMPLITUDE) { p.y = WAVE_AMPLITUDE; p.vy = Math.abs(p.vy) * 0.5; }
        if (p.y > h - WAVE_AMPLITUDE) { p.y = h - WAVE_AMPLITUDE; p.vy = -Math.abs(p.vy) * 0.5; }

        const mdx = p.x - mouseX;
        const mdy = (p.y + wave) - mouseY;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < MOUSE_RADIUS) {
          const force = (1 - mdist / MOUSE_RADIUS) * 1.5;
          p.vx += (mdx / mdist) * force;
          p.vy += (mdy / mdist) * force;
        }

        p.vx *= 0.97;
        p.vy *= 0.97;

        const drawY = Math.max(0, Math.min(h, p.y + wave));
        p.alpha += (p.baseAlpha * pulse - p.alpha) * 0.08;

        ctx!.beginPath();
        ctx!.arc(p.x, drawY, p.radius * pulse, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0, 255, 255, ${p.alpha})`;
        ctx!.fill();

        // glow around each particle
        if (p.alpha > 0.3) {
          const glow = ctx!.createRadialGradient(p.x, drawY, 0, p.x, drawY, p.radius * 8);
          glow.addColorStop(0, `rgba(0, 255, 255, ${p.alpha * 0.35})`);
          glow.addColorStop(0.5, `rgba(0, 200, 255, ${p.alpha * 0.1})`);
          glow.addColorStop(1, 'rgba(0, 255, 255, 0)');
          ctx!.fillStyle = glow;
          ctx!.fillRect(p.x - p.radius * 8, drawY - p.radius * 8, p.radius * 16, p.radius * 16);
        }

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const wave2 = Math.sin(t * 1.2 + p2.x * 0.008) * 18;
          const drawY2 = p2.y + wave2;
          const dx = p.x - p2.x;
          const dy = drawY - drawY2;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.35;
            const lineWidth = (1 - dist / CONNECT_DIST) * 1.2;
            ctx!.beginPath();
            ctx!.moveTo(p.x, drawY);
            ctx!.lineTo(p2.x, drawY2);
            ctx!.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx!.lineWidth = lineWidth;
            ctx!.stroke();
          }
        }
      }

      // larger, brighter glow orbs
      const orbs = [
        { x: w * 0.25, y: h * 0.35, r: 140, color: '0, 255, 255', speed: 0.4 },
        { x: w * 0.75, y: h * 0.55, r: 110, color: '168, 85, 247', speed: 0.6 },
        { x: w * 0.5, y: h * 0.25, r: 160, color: '0, 220, 255', speed: 0.3 },
        { x: w * 0.4, y: h * 0.7, r: 90, color: '0, 255, 200', speed: 0.5 },
        { x: w * 0.8, y: h * 0.3, r: 100, color: '99, 102, 241', speed: 0.7 },
      ];

      for (const orb of orbs) {
        const pulse = Math.sin(t * 0.8 + orb.x) * 0.3 + 0.7;
        const effectiveR = orb.r * pulse;
        const rawOx = orb.x + Math.sin(t * orb.speed + orb.x) * 40;
        const rawOy = orb.y + Math.cos(t * orb.speed * 0.7 + orb.y) * 30;
        const ox = Math.max(effectiveR, Math.min(w - effectiveR, rawOx));
        const oy = Math.max(effectiveR, Math.min(h - effectiveR, rawOy));
        const gradient = ctx!.createRadialGradient(ox, oy, 0, ox, oy, effectiveR);
        gradient.addColorStop(0, `rgba(${orb.color}, 0.18)`);
        gradient.addColorStop(0.5, `rgba(${orb.color}, 0.06)`);
        gradient.addColorStop(1, `rgba(${orb.color}, 0)`);
        ctx!.fillStyle = gradient;
        ctx!.fillRect(ox - effectiveR, oy - effectiveR, effectiveR * 2, effectiveR * 2);
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
