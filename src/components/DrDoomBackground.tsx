import React, { useEffect, useRef, useState } from 'react';

interface DrDoomBackgroundProps {
  interactive?: boolean;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface Spark {
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

export const DrDoomBackground: React.FC<DrDoomBackgroundProps> = ({ interactive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const mousePosRef = useRef({ x: -1000, y: -1000 });

  // Scroll zoom state
  const [scrollScale, setScrollScale] = useState(1);
  const [translateY, setTranslateY] = useState(0);

  // List of high quality JPG comic backgrounds
  const [imageIndex, setImageIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const jpgImages = [
    "https://6a7ab76a75756f18755eb1ce.imgix.net/sandbox/d1.png?auto=enhance"
  ];

  // Dynamic Scroll Zoom-In & Zoom-Out logic
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) return;

      const currentScroll = Math.max(0, window.scrollY);
      const progress = Math.min(1, currentScroll / totalScroll);

      // Parallax scroll calculation:
      // Top (0%): scale 1.00
      // Mid (50%): scale 1.35 (Zoom In)
      // Bottom (100%): scale 1.05 (Zoom Out)
      let scale = 1;
      if (progress <= 0.5) {
        scale = 1 + (progress / 0.5) * 0.35; // Zoom in to 1.35
      } else {
        scale = 1.35 - ((progress - 0.5) / 0.5) * 0.28; // Zoom out back to 1.07
      }

      setScrollScale(scale);
      setTranslateY(progress * -45); // Subtle vertical shift
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Canvas particle & energy overlay animations over the background image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseClick = (e: MouseEvent) => {
      // Handled cleanly by YellowLightningTouch overlay
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseClick);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
    }

    const colors = ['#00FF66', '#10B981', '#22C55E', '#EAB308', '#34D399', '#F59E0B'];
    const particles: Particle[] = [];
    const numParticles = Math.min(110, Math.floor((width * height) / 13000));

    for (let i = 0; i < numParticles; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      particles.push({
        x: rx,
        y: ry,
        vx: (Math.random() - 0.5) * 0.9,
        vy: -Math.random() * 1.4 - 0.4,
        radius: Math.random() * 2.8 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.75 + 0.25,
      });
    }

    interface LightningArc {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      life: number;
      maxLife: number;
      color: string;
    }

    let lightningArcs: LightningArc[] = [];
    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Mouse interactive energy halo
      const mouse = mousePosRef.current;
      if (mouse.x > 0 && mouse.y > 0) {
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 170);
        mouseGlow.addColorStop(0, 'rgba(0, 255, 102, 0.22)');
        mouseGlow.addColorStop(0.5, 'rgba(234, 179, 8, 0.08)');
        mouseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = mouseGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 170, 0, Math.PI * 2);
        ctx.fill();
      }

      // Latverian optic discharge arcs
      if (Math.random() < 0.04 && lightningArcs.length < 4) {
        const startX = width * 0.2 + Math.random() * (width * 0.6);
        const startY = height * 0.2 + Math.random() * (height * 0.5);
        lightningArcs.push({
          x1: startX,
          y1: startY,
          x2: startX + (Math.random() - 0.5) * 250,
          y2: startY + Math.random() * 190 - 50,
          life: 0,
          maxLife: 10 + Math.floor(Math.random() * 8),
          color: Math.random() > 0.3 ? '#00FF66' : '#EAB308',
        });
      }

      lightningArcs.forEach((arc, index) => {
        arc.life++;
        ctx.strokeStyle = arc.color;
        ctx.shadowColor = arc.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(arc.x1, arc.y1);

        let currentX = arc.x1;
        let currentY = arc.y1;
        const steps = 6;
        for (let i = 1; i <= steps; i++) {
          const targetX = arc.x1 + (arc.x2 - arc.x1) * (i / steps);
          const targetY = arc.y1 + (arc.y2 - arc.y1) * (i / steps);
          currentX = targetX + (Math.random() - 0.5) * 28;
          currentY = targetY + (Math.random() - 0.5) * 28;
          ctx.lineTo(currentX, currentY);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (arc.life >= arc.maxLife) {
          lightningArcs.splice(index, 1);
        }
      });

      // Shockwaves from clicks
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += 7;
        sw.alpha = 1.0 - sw.radius / sw.maxRadius;

        if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.lineWidth = 3;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }

      // Sparks from clicks
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const sp = sparksRef.current[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life++;
        sp.alpha = 1 - sp.life / sp.maxLife;

        if (sp.life >= sp.maxLife) {
          sparksRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = Math.max(0, sp.alpha);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }

      // Cosmic green particles rising
      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(time + p.y * 0.01) * 0.6;

        if (mouse.x > 0 && mouse.y > 0) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const force = (130 - dist) / 130;
            p.x += (dx / dist) * force * 5;
            p.y += (dy / dist) * force * 5;
          }
        }

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.radius * 4;
        ctx.globalAlpha = Math.max(0.1, Math.min(0.9, p.alpha));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      });

      // Connected energy threads
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.strokeStyle = 'rgba(0, 255, 102, 0.12)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [interactive]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#030804]">
      
      {/* 1. SCROLL-ANIMATED JPG BACKGROUND LAYER (ZOOMS IN & OUT WITH SCROLLING) */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform flex items-center justify-center"
        style={{
          transform: `scale(${scrollScale}) translate3d(0, ${translateY}px, 0)`,
        }}
      >
        {/* Dark Ambient Atmosphere Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020703]/80 via-transparent to-[#010502]/90 z-10 pointer-events-none" />

        {/* HIGH-RESOLUTION JPG BACKGROUND ARTWORK WITH COMIC DETAIL */}
        {!imgFailed ? (
          <img
            src={jpgImages[imageIndex]}
            onError={() => {
              if (imageIndex < jpgImages.length - 1) {
                setImageIndex(imageIndex + 1);
              } else {
                setImgFailed(true);
              }
            }}
            alt="IgniteX 2026 Background Artwork"
            className="w-full h-full object-cover object-center filter brightness-[0.80] contrast-[1.20] saturate-[1.2]"
          />
        ) : (
          /* High quality rendered scene fallback if remote CDN blocks requests */
          <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] flex items-center justify-center overflow-hidden bg-[#030d06]">
            <svg
              viewBox="0 0 1200 700"
              className="w-full h-full object-cover opacity-90 drop-shadow-[0_0_50px_rgba(0,255,102,0.25)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="doomGreenCape2" x1="600" y1="100" x2="600" y2="700" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="40%" stopColor="#15803d" />
                  <stop offset="85%" stopColor="#052e16" />
                  <stop offset="100%" stopColor="#011408" />
                </linearGradient>
                <linearGradient id="chromeArmor2" x1="400" y1="200" x2="800" y2="600" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#e5e7eb" />
                  <stop offset="25%" stopColor="#9ca3af" />
                  <stop offset="60%" stopColor="#4b5563" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
                <linearGradient id="doombotBody2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="50%" stopColor="#1f2937" />
                  <stop offset="100%" stopColor="#0a0f1d" />
                </linearGradient>
                <radialGradient id="opticGlow2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#00FF66" />
                  <stop offset="80%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
                <linearGradient id="goldClasp2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#854d0e" />
                </linearGradient>
              </defs>

              <g stroke="#1e293b" strokeWidth="6" opacity="0.65">
                <line x1="0" y1="80" x2="1200" y2="80" stroke="#334155" strokeWidth="12" />
                <line x1="0" y1="140" x2="1200" y2="140" stroke="#334155" strokeWidth="10" />
                <path d="M 0 80 L 150 140 L 300 80 L 450 140 L 600 80 L 750 140 L 900 80 L 1050 140 L 1200 80" />
                <path d="M 0 140 L 150 80 L 300 140 L 450 80 L 600 140 L 750 80 L 900 140 L 1050 80 L 1200 140" />
                <line x1="120" y1="0" x2="120" y2="700" stroke="#1e293b" strokeWidth="24" />
                <line x1="1080" y1="0" x2="1080" y2="700" stroke="#1e293b" strokeWidth="24" />
              </g>

              {/* Left Doombots */}
              <g transform="translate(40, 60)">
                <path d="M 50 180 L 180 180 L 220 280 L 20 280 Z" fill="#15803d" stroke="#000" strokeWidth="4" />
                <rect x="60" y="280" width="120" height="320" rx="15" fill="url(#doombotBody2)" stroke="#000" strokeWidth="4" />
                <rect x="10" y="240" width="45" height="280" rx="20" fill="url(#chromeArmor2)" stroke="#000" strokeWidth="3" />
                <rect x="80" y="100" width="80" height="90" rx="30" fill="url(#doombotBody2)" stroke="#00FF66" strokeWidth="2" />
                <circle cx="120" cy="140" r="28" fill="url(#opticGlow2)" />
                <circle cx="120" cy="140" r="14" fill="#00FF66" />
              </g>

              {/* Right Doombots */}
              <g transform="translate(900, 60)">
                <path d="M 50 180 L 180 180 L 220 280 L 20 280 Z" fill="#15803d" stroke="#000" strokeWidth="4" />
                <rect x="60" y="280" width="120" height="320" rx="15" fill="url(#doombotBody2)" stroke="#000" strokeWidth="4" />
                <rect x="180" y="240" width="45" height="280" rx="20" fill="url(#chromeArmor2)" stroke="#000" strokeWidth="3" />
                <rect x="80" y="100" width="80" height="90" rx="30" fill="url(#doombotBody2)" stroke="#00FF66" strokeWidth="2" />
                <circle cx="120" cy="140" r="28" fill="url(#opticGlow2)" />
                <circle cx="120" cy="140" r="14" fill="#00FF66" />
              </g>

              {/* Center Doctor Doom */}
              <g transform="translate(380, 70)">
                <path
                  d="M 120 180 Q -120 350 -180 600 Q 100 650 220 580 Q 340 650 620 600 Q 560 350 320 180 Z"
                  fill="url(#doomGreenCape2)"
                  stroke="#022c16"
                  strokeWidth="6"
                />
                <rect x="140" y="480" width="60" height="220" rx="12" fill="url(#chromeArmor2)" stroke="#000" strokeWidth="4" />
                <rect x="240" y="480" width="60" height="220" rx="12" fill="url(#chromeArmor2)" stroke="#000" strokeWidth="4" />
                <path d="M 120 180 L 320 180 L 300 460 L 140 460 Z" fill="url(#doomGreenCape2)" stroke="#000" strokeWidth="5" />
                <rect x="130" y="420" width="180" height="35" fill="#3f2e18" stroke="#000" strokeWidth="4" />
                <rect x="200" y="412" width="40" height="50" rx="5" fill="url(#goldClasp2)" stroke="#000" strokeWidth="4" />
                <circle cx="130" cy="200" r="26" fill="url(#goldClasp2)" stroke="#000" strokeWidth="4" />
                <circle cx="310" cy="200" r="26" fill="url(#goldClasp2)" stroke="#000" strokeWidth="4" />
                <path d="M 156 200 Q 220 230 284 200" stroke="url(#goldClasp2)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 220 50 Q 130 50 140 180 Q 220 195 300 180 Q 310 50 220 50 Z" fill="url(#doomGreenCape2)" stroke="#000" strokeWidth="5" />
                <path d="M 220 75 Q 160 75 165 170 Q 220 180 275 170 Q 280 75 220 75 Z" fill="#020804" />
                <g transform="translate(180, 85)" stroke="#000" strokeWidth="3">
                  <path d="M 10 20 L 40 5 L 70 20 L 75 70 L 40 95 L 5 70 Z" fill="url(#chromeArmor2)" />
                  <ellipse cx="25" cy="35" rx="8" ry="4" fill="#00FF66" />
                  <ellipse cx="55" cy="35" rx="8" ry="4" fill="#00FF66" />
                </g>
              </g>
            </svg>
          </div>
        )}

      </div>

      {/* 2. OVERLAY ANIMATIONS CANVAS (PARTICLES, LIGHTNING, CLICK SHOCKWAVES OVER JPG IMAGE) */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none z-20" />

      {/* 3. IGNITEX CORNER BANNERS */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 hidden xl:flex flex-col items-center gap-4 text-emerald-500/35 font-mono text-[10px] tracking-widest uppercase [writing-mode:vertical-lr] rotate-180 pointer-events-none z-30">
        <span className="text-amber-400/60 font-bold">IGNITEX NATIONAL SYMPOSIUM</span>
        <span>•</span>
        <span>IGNITE YOUR PASSION</span>
        <span>•</span>
        <span>DEFCON // LEVEL 1</span>
      </div>

      <div className="absolute top-1/2 right-4 -translate-y-1/2 hidden xl:flex flex-col items-center gap-4 text-emerald-500/35 font-mono text-[10px] tracking-widest uppercase [writing-mode:vertical-lr] pointer-events-none z-30">
        <span className="text-amber-400/60 font-bold">IGNITEX 2026</span>
        <span>•</span>
        <span>QUANTUM APOCALYPSE PROTOCOL</span>
        <span>•</span>
        <span>ENCRYPTED RECEPTACLE</span>
      </div>

      {/* 4. SCROLL ZOOM PARALLAX HUD */}
      <div className="fixed bottom-4 right-4 z-30 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#030e06]/90 border border-emerald-500/50 text-emerald-400 font-mono text-[10px] shadow-[0_0_15px_rgba(0,255,102,0.2)] pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>PARALLAX ZOOM: {Math.round(scrollScale * 100)}%</span>
        <span className="text-emerald-600">| JPG BACKGROUND ACTIVE</span>
      </div>

    </div>
  );
};
