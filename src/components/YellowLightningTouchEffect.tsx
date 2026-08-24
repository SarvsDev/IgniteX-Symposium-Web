import React, { useEffect, useRef } from 'react';
import { soundFx } from './AudioEffects';

interface Point {
  x: number;
  y: number;
}

interface LightningSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface LightningBranch {
  segments: LightningSegment[];
  color: string;
  width: number;
  alpha: number;
  decay: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

const PALETTE = ['#FFFFFF', '#FEF08A', '#FACC15', '#EAB308', '#F59E0B'];

export const YellowLightningTouchEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const branchesRef = useRef<LightningBranch[]>([]);
  const sparksRef = useRef<SparkParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const isLoopRunningRef = useRef(false);
  const activePointersRef = useRef<Map<number | string, Point>>(new Map());
  const lastZapAudioRef = useRef(0);

  // Play subtle electric audio crackle
  const triggerAudioZap = () => {
    const now = Date.now();
    if (now - lastZapAudioRef.current > 120) {
      lastZapAudioRef.current = now;
      soundFx.playZap();
    }
  };

  // 2. FRACTAL LIGHTNING GENERATOR: Midpoint displacement with 3 recursive iterations
  const generateLightningSegments = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    displacement: number,
    iterations: number = 3
  ): LightningSegment[] => {
    let points: Point[] = [{ x: x1, y: y1 }, { x: x2, y: y2 }];

    let currentDisp = displacement;
    for (let iter = 0; iter < iterations; iter++) {
      const nextPoints: Point[] = [points[0]];

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.hypot(dx, dy) || 1;

        // Normal perpendicular vector
        const nx = -dy / length;
        const ny = dx / length;

        const offset = (Math.random() - 0.5) * currentDisp * 2;
        const displacedPoint: Point = {
          x: midX + nx * offset,
          y: midY + ny * offset,
        };

        nextPoints.push(displacedPoint, p2);
      }

      points = nextPoints;
      currentDisp *= 0.55;
    }

    const segments: LightningSegment[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      segments.push({
        x1: points[i].x,
        y1: points[i].y,
        x2: points[i + 1].x,
        y2: points[i + 1].y,
      });
    }

    return segments;
  };

  // 3. SPARK PARTICLE EMITTER
  const spawnSparks = (x: number, y: number, count: number = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.8 + 1.2; // 1.2–4.0 px/frame
      sparksRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 1.5 + 1.0,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: 1.0,
        life: 0,
        maxLife: Math.floor(Math.random() * 16 + 10), // 10–25 frames decay
      });
    }
  };

  // Spawn radial lightning strike at coordinate
  const spawnStrike = (x: number, y: number, isTrail = false) => {
    triggerAudioZap();

    // 3–4 main lightning branches
    const branchCount = isTrail ? 2 : Math.floor(Math.random() * 2 + 3);
    for (let b = 0; b < branchCount; b++) {
      const angle = (Math.PI * 2 * b) / branchCount + (Math.random() - 0.5) * 0.7;
      const reach = isTrail ? Math.random() * 25 + 25 : Math.random() * 45 + 30; // 30–75px reach
      const targetX = x + Math.cos(angle) * reach;
      const targetY = y + Math.sin(angle) * reach;

      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const width = Math.random() * 1.2 + 0.8; // 0.8–2.0px width
      const segments = generateLightningSegments(x, y, targetX, targetY, 16, 3);

      branchesRef.current.push({
        segments,
        color,
        width,
        alpha: 1.0,
        decay: isTrail ? 0.14 : 0.08,
      });

      // Sub-branches (forks) splitting off main segments
      if (Math.random() < 0.45 && segments.length >= 4) {
        const forkIdx = Math.floor(segments.length / 2);
        const forkStart = { x: segments[forkIdx].x1, y: segments[forkIdx].y1 };
        const forkAngle = angle + (Math.random() > 0.5 ? 0.7 : -0.7) + (Math.random() - 0.5) * 0.3;
        const forkReach = reach * 0.55;
        const forkEndX = forkStart.x + Math.cos(forkAngle) * forkReach;
        const forkEndY = forkStart.y + Math.sin(forkAngle) * forkReach;

        branchesRef.current.push({
          segments: generateLightningSegments(forkStart.x, forkStart.y, forkEndX, forkEndY, 9, 2),
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          width: width * 0.75,
          alpha: 0.9,
          decay: 0.12,
        });
      }
    }

    // 7–10 micro spark particles
    spawnSparks(x, y, isTrail ? 4 : Math.floor(Math.random() * 4 + 7));
    wakeRenderLoop();
  };

  // Connect electric arc between previous and new drag coordinates
  const spawnConnectingTrail = (prevX: number, prevY: number, curX: number, curY: number) => {
    triggerAudioZap();

    const segments = generateLightningSegments(prevX, prevY, curX, curY, 20, 3);
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    branchesRef.current.push({
      segments,
      color,
      width: Math.random() * 1.0 + 1.2,
      alpha: 1.0,
      decay: 0.12,
    });

    // Also add sub-fork along connecting path
    if (Math.random() < 0.4 && segments.length >= 3) {
      const mid = segments[Math.floor(segments.length / 2)];
      const trailAngle = Math.atan2(curY - prevY, curX - prevX) + (Math.random() > 0.5 ? 0.9 : -0.9);
      const forkReach = Math.random() * 25 + 15;
      branchesRef.current.push({
        segments: generateLightningSegments(mid.x1, mid.y1, mid.x1 + Math.cos(trailAngle) * forkReach, mid.y1 + Math.sin(trailAngle) * forkReach, 10, 2),
        color: '#FACC15',
        width: 0.9,
        alpha: 0.85,
        decay: 0.15,
      });
    }

    spawnSparks((prevX + curX) / 2, (prevY + curY) / 2, 4);
    wakeRenderLoop();
  };

  // 6. OPTIMIZATION: Animation loop & cleanup
  const wakeRenderLoop = () => {
    // Array caps
    if (branchesRef.current.length > 30) {
      branchesRef.current.splice(0, branchesRef.current.length - 30);
    }
    if (sparksRef.current.length > 50) {
      sparksRef.current.splice(0, sparksRef.current.length - 50);
    }

    if (!isLoopRunningRef.current) {
      isLoopRunningRef.current = true;
      startRenderLoop();
    }
  };

  const startRenderLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const hasBranches = branchesRef.current.length > 0;
      const hasSparks = sparksRef.current.length > 0;

      if (!hasBranches && !hasSparks) {
        isLoopRunningRef.current = false;
        animFrameIdRef.current = null;
        return;
      }

      // 5. VISUAL STYLING & GLOW: Draw Lightning Branches with Native Canvas Neon Glow
      for (let i = branchesRef.current.length - 1; i >= 0; i--) {
        const b = branchesRef.current[i];
        b.alpha -= b.decay;

        if (b.alpha <= 0) {
          branchesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, b.alpha);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'miter';

        // Neon Glow
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12; // 10–14px shadow blur

        ctx.beginPath();
        for (const seg of b.segments) {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw Sparks
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const sp = sparksRef.current[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.08; // Gravity
        sp.vx *= 0.94; // Drag damping
        sp.vy *= 0.94;
        sp.life++;
        sp.alpha = 1.0 - sp.life / sp.maxLife;

        if (sp.life >= sp.maxLife || sp.alpha <= 0) {
          sparksRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, sp.alpha);
        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
  };

  // 1. COMPONENT ARCHITECTURE & 4. MULTI-TOUCH GESTURES
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina & High-DPI canvas resizing
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    // Pointer Events (Mouse / Pen / Touch)
    const handlePointerDown = (e: PointerEvent) => {
      const pos: Point = { x: e.clientX, y: e.clientY };
      activePointersRef.current.set(e.pointerId, pos);
      spawnStrike(pos.x, pos.y);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons > 0 || activePointersRef.current.has(e.pointerId)) {
        const cur: Point = { x: e.clientX, y: e.clientY };
        const prev = activePointersRef.current.get(e.pointerId);

        if (prev) {
          const delta = Math.hypot(cur.x - prev.x, cur.y - prev.y);
          if (delta > 20) {
            spawnConnectingTrail(prev.x, prev.y, cur.x, cur.y);
            spawnStrike(cur.x, cur.y, true);
            activePointersRef.current.set(e.pointerId, cur);
          }
        } else {
          activePointersRef.current.set(e.pointerId, cur);
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);
    };

    // Multi-Touch Handlers for mobile
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        const pos: Point = { x: t.clientX, y: t.clientY };
        activePointersRef.current.set(t.identifier, pos);
        spawnStrike(pos.x, pos.y);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        const cur: Point = { x: t.clientX, y: t.clientY };
        const prev = activePointersRef.current.get(t.identifier);

        if (prev) {
          const delta = Math.hypot(cur.x - prev.x, cur.y - prev.y);
          if (delta > 20) {
            spawnConnectingTrail(prev.x, prev.y, cur.x, cur.y);
            spawnStrike(cur.x, cur.y, true);
            activePointersRef.current.set(t.identifier, cur);
          }
        } else {
          activePointersRef.current.set(t.identifier, cur);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const activeIds = new Set<number>();
      for (let i = 0; i < e.touches.length; i++) {
        activeIds.add(e.touches[i].identifier);
      }
      activePointersRef.current.forEach((_, key) => {
        if (typeof key === 'number' && !activeIds.has(key)) {
          activePointersRef.current.delete(key);
        }
      });
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50 select-none"
      style={{ touchAction: 'none' }}
    />
  );
};
