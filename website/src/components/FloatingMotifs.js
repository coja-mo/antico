'use client';
import { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════
   FLOATING MOTIFS — Layered Particle System v2
   Multi-depth bokeh, constellation lines,
   rich mouse/touch reactivity
   ═══════════════════════════════════════════════ */

// ── Color Palette ──────────────────────────────
const COLORS = [
  { r: 212, g: 168, b: 75 },   // gold
  { r: 232, g: 201, b: 106 },  // light gold
  { r: 184, g: 146, b: 47 },   // dark gold
  { r: 200, g: 160, b: 80 },   // warm amber
  { r: 255, g: 200, b: 120 },  // soft champagne
  { r: 255, g: 140, b: 120 },  // dusty rose (rare)
  { r: 220, g: 180, b: 140 },  // warm cream
];

// ── Motif Path Drawing ─────────────────────────

function drawWineBottle(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const s = size * 0.5;
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s * 1.2);
  ctx.lineTo(-s * 0.3, s * 0.2);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.1, -s * 0.15, -s * 0.3);
  ctx.lineTo(-s * 0.12, -s * 0.8);
  ctx.lineTo(-s * 0.08, -s * 1.0);
  ctx.lineTo(-s * 0.08, -s * 1.2);
  ctx.lineTo(s * 0.08, -s * 1.2);
  ctx.lineTo(s * 0.08, -s * 1.0);
  ctx.lineTo(s * 0.12, -s * 0.8);
  ctx.lineTo(s * 0.15, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.3, -s * 0.1, s * 0.3, s * 0.2);
  ctx.lineTo(s * 0.3, s * 1.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWineGlass(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const s = size * 0.45;
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.6);
  ctx.quadraticCurveTo(-s * 0.55, s * 0.2, 0, s * 0.4);
  ctx.quadraticCurveTo(s * 0.55, s * 0.2, s * 0.5, -s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-s * 0.04, s * 0.4, s * 0.08, s * 0.6);
  ctx.beginPath();
  ctx.ellipse(0, s * 1.0, s * 0.3, s * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRavioli(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const s = size * 0.4;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.7);
  ctx.quadraticCurveTo(s * 0.8, -s * 0.8, s * 0.7, 0);
  ctx.quadraticCurveTo(s * 0.8, s * 0.8, 0, s * 0.7);
  ctx.quadraticCurveTo(-s * 0.8, s * 0.8, -s * 0.7, 0);
  ctx.quadraticCurveTo(-s * 0.8, -s * 0.8, 0, -s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 1;
  ctx.globalAlpha *= 0.5;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * s * 0.55, Math.sin(angle) * s * 0.55, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSpaghettiFork(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const s = size * 0.4;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.3, 0, Math.PI * 1.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(s * 0.1, -s * 0.05, s * 0.22, 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-s * 0.05, s * 0.08, s * 0.25, 1, Math.PI * 2.2);
  ctx.stroke();
  ctx.fillRect(-s * 0.03, -s * 0.3, s * 0.06, -s * 0.8);
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(-s * 0.03 + i * s * 0.08, -s * 1.1, s * 0.03, -s * 0.25);
  }
  ctx.restore();
}

function drawOliveBranch(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const s = size * 0.4;
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.2);
  ctx.quadraticCurveTo(0, -s * 0.1, s, s * 0.15);
  ctx.stroke();
  const leaves = [
    { x: -s * 0.6, y: s * 0.1, angle: -0.4 },
    { x: -s * 0.2, y: -s * 0.02, angle: 0.3 },
    { x: s * 0.2, y: -s * 0.01, angle: -0.5 },
    { x: s * 0.55, y: s * 0.1, angle: 0.4 },
  ];
  for (const leaf of leaves) {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.12, s * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(-s * 0.4, s * 0.15, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.4, s * 0.18, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBasilLeaf(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const s = size * 0.4;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.6);
  ctx.quadraticCurveTo(-s * 0.5, s * 0.1, -s * 0.2, -s * 0.5);
  ctx.quadraticCurveTo(0, -s * 0.7, s * 0.2, -s * 0.5);
  ctx.quadraticCurveTo(s * 0.5, s * 0.1, 0, s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha *= 0.4;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.5);
  ctx.lineTo(0, -s * 0.4);
  ctx.stroke();
  ctx.restore();
}

const DRAW_FUNCTIONS = [
  drawWineBottle,
  drawWineGlass,
  drawRavioli,
  drawSpaghettiFork,
  drawOliveBranch,
  drawBasilLeaf,
];

// ── Layer Configs ──────────────────────────────
const LAYERS = {
  far:  { sizeMin: 20, sizeMax: 35, opacityMin: 0.015, opacityMax: 0.035, speedFactor: 0.3, parallaxFactor: 0.01, blur: true },
  mid:  { sizeMin: 28, sizeMax: 50, opacityMin: 0.035, opacityMax: 0.07, speedFactor: 0.6, parallaxFactor: 0.03, blur: false },
  near: { sizeMin: 35, sizeMax: 60, opacityMin: 0.06, opacityMax: 0.12, speedFactor: 1.0, parallaxFactor: 0.06, blur: false },
};

// ── Bokeh Glow Orb Config ──────────────────────
function createGlowOrb(canvasW, canvasH) {
  const color = COLORS[Math.floor(Math.random() * 5)]; // only warm golds/ambers
  return {
    x: Math.random() * canvasW,
    y: Math.random() * canvasH,
    radius: 60 + Math.random() * 180,
    opacity: 0.008 + Math.random() * 0.018,
    baseOpacity: 0,
    driftX: (Math.random() - 0.5) * 0.08,
    driftY: (Math.random() - 0.5) * 0.06,
    pulseSpeed: 0.3 + Math.random() * 0.6,
    pulseOffset: Math.random() * Math.PI * 2,
    r: color.r,
    g: color.g,
    b: color.b,
  };
}

// ── Motif Particle Creation ────────────────────
function createMotif(canvasW, canvasH, layer) {
  const cfg = LAYERS[layer];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  // Dusty rose is rare — 85% chance to use gold spectrum
  const finalColor = Math.random() > 0.85
    ? COLORS[5] // dusty rose
    : color;

  return {
    x: Math.random() * canvasW,
    y: Math.random() * canvasH,
    size: cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin),
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.003 * cfg.speedFactor,
    driftX: (Math.random() - 0.5) * 0.18 * cfg.speedFactor,
    driftY: ((Math.random() - 0.5) * 0.12 + 0.04) * cfg.speedFactor,
    opacity: cfg.opacityMin + Math.random() * (cfg.opacityMax - cfg.opacityMin),
    baseOpacity: 0,
    drawFn: DRAW_FUNCTIONS[Math.floor(Math.random() * DRAW_FUNCTIONS.length)],
    parallaxFactor: cfg.parallaxFactor + Math.random() * 0.02,
    offsetX: 0,
    offsetY: 0,
    layer,
    blur: cfg.blur,
    r: finalColor.r,
    g: finalColor.g,
    b: finalColor.b,
    // Mouse proximity glow
    glowIntensity: 0,
  };
}

export default function FloatingMotifs() {
  const canvasRef = useRef(null);
  const motifsRef = useRef([]);
  const glowOrbsRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const rafRef = useRef(null);
  const timeRef = useRef(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Motif counts per layer
    const baseDensity = Math.max(8, Math.floor(w / 100));
    const farCount = Math.min(12, Math.max(6, Math.floor(baseDensity * 0.5)));
    const midCount = Math.min(10, Math.max(5, Math.floor(baseDensity * 0.4)));
    const nearCount = Math.min(8, Math.max(4, Math.floor(baseDensity * 0.3)));

    const motifs = [];
    for (let i = 0; i < farCount; i++) motifs.push(createMotif(w, h, 'far'));
    for (let i = 0; i < midCount; i++) motifs.push(createMotif(w, h, 'mid'));
    for (let i = 0; i < nearCount; i++) motifs.push(createMotif(w, h, 'near'));

    // Initialize base opacity
    motifs.forEach(m => { m.baseOpacity = m.opacity; });
    motifsRef.current = motifs;

    // Glow orbs
    const orbCount = Math.min(6, Math.max(3, Math.floor(w / 250)));
    const orbs = [];
    for (let i = 0; i < orbCount; i++) {
      const orb = createGlowOrb(w, h);
      orb.baseOpacity = orb.opacity;
      orbs.push(orb);
    }
    glowOrbsRef.current = orbs;
  }, []);

  useEffect(() => {
    init();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const getLogicalDimensions = () => ({
      w: canvas.width / dpr,
      h: canvas.height / dpr,
    });

    const onResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr2 = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr2;
      canvas.height = rect.height * dpr2;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr2, dpr2);

      const w = rect.width;
      const h = rect.height;
      motifsRef.current.forEach(m => {
        m.x = Math.random() * w;
        m.y = Math.random() * h;
      });
      glowOrbsRef.current.forEach(o => {
        o.x = Math.random() * w;
        o.y = Math.random() * h;
      });
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
          active: true,
        };
      }
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', onResize);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('mouseleave', onMouseLeave);

    // ── Main Animation Loop ──────────────────
    function animate(timestamp) {
      const dt = Math.min(32, timestamp - (timeRef.current || timestamp));
      timeRef.current = timestamp;
      const timeSec = timestamp * 0.001;

      const { w, h } = getLogicalDimensions();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const mouse = mouseRef.current;

      // ── Draw Glow Orbs (background layer) ──
      for (const orb of glowOrbsRef.current) {
        // Drift
        orb.x += orb.driftX;
        orb.y += orb.driftY;

        // Wrap
        if (orb.x > w + orb.radius) orb.x = -orb.radius;
        if (orb.x < -orb.radius) orb.x = w + orb.radius;
        if (orb.y > h + orb.radius) orb.y = -orb.radius;
        if (orb.y < -orb.radius) orb.y = h + orb.radius;

        // Pulse
        const pulse = Math.sin(timeSec * orb.pulseSpeed + orb.pulseOffset) * 0.4 + 0.6;
        const opacity = orb.baseOpacity * pulse;

        // Mouse attraction for orbs
        let drawX = orb.x;
        let drawY = orb.y;
        if (mouse.active) {
          const dx = mouse.x - orb.x;
          const dy = mouse.y - orb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 400) {
            const force = (1 - dist / 400) * 0.015;
            drawX += dx * force;
            drawY += dy * force;
          }
        }

        // Draw radial gradient orb
        const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, orb.radius);
        grad.addColorStop(0, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${opacity})`);
        grad.addColorStop(0.4, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${opacity * 0.5})`);
        grad.addColorStop(1, `rgba(${orb.r}, ${orb.g}, ${orb.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Update & Draw Motifs by layer ──────
      const layerOrder = ['far', 'mid', 'near'];
      const nearMotifs = []; // collect for constellation lines

      for (const layerName of layerOrder) {
        const layerMotifs = motifsRef.current.filter(m => m.layer === layerName);
        const cfg = LAYERS[layerName];

        for (const m of layerMotifs) {
          // Drift
          m.x += m.driftX;
          m.y += m.driftY;
          m.rotation += m.rotationSpeed;

          // Wrap
          if (m.x > w + m.size) m.x = -m.size;
          if (m.x < -m.size) m.x = w + m.size;
          if (m.y > h + m.size) m.y = -m.size;
          if (m.y < -m.size) m.y = h + m.size;

          // Mouse interaction
          let drawX = m.x;
          let drawY = m.y;
          if (mouse.active) {
            const dx = m.x - mouse.x;
            const dy = m.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = layerName === 'near' ? 250 : layerName === 'mid' ? 200 : 150;

            if (dist < maxDist && dist > 0) {
              if (layerName === 'near') {
                // Near particles: gentle attraction + glow boost
                const force = (1 - dist / maxDist) * m.parallaxFactor * 40;
                const targetX = -(dx / dist) * force; // move toward cursor
                const targetY = -(dy / dist) * force;
                m.offsetX += (targetX - m.offsetX) * 0.04;
                m.offsetY += (targetY - m.offsetY) * 0.04;
                // Glow intensity
                m.glowIntensity += (1 - dist / maxDist - m.glowIntensity) * 0.08;
              } else if (layerName === 'mid') {
                // Mid particles: subtle parallax shift
                const force = (1 - dist / maxDist) * m.parallaxFactor * 50;
                const targetX = (dx / dist) * force * 0.5;
                const targetY = (dy / dist) * force * 0.5;
                m.offsetX += (targetX - m.offsetX) * 0.03;
                m.offsetY += (targetY - m.offsetY) * 0.03;
                m.glowIntensity += (0.5 * (1 - dist / maxDist) - m.glowIntensity) * 0.06;
              } else {
                // Far particles: gentle repulsion for depth
                const force = (1 - dist / maxDist) * m.parallaxFactor * 60;
                const targetX = (dx / dist) * force;
                const targetY = (dy / dist) * force;
                m.offsetX += (targetX - m.offsetX) * 0.02;
                m.offsetY += (targetY - m.offsetY) * 0.02;
                m.glowIntensity *= 0.95;
              }
            } else {
              m.offsetX *= 0.96;
              m.offsetY *= 0.96;
              m.glowIntensity *= 0.95;
            }
          } else {
            m.offsetX *= 0.96;
            m.offsetY *= 0.96;
            m.glowIntensity *= 0.95;
          }

          drawX += m.offsetX;
          drawY += m.offsetY;

          // Opacity with subtle breathing
          const breathe = Math.sin(timeSec * 0.5 + m.size) * 0.15 + 0.85;
          const glowBoost = m.glowIntensity * 0.08;
          const finalOpacity = Math.min(0.2, (m.baseOpacity + glowBoost) * breathe);

          // Draw blur halo for far layer (bokeh simulation)
          if (m.blur) {
            const haloRadius = m.size * 1.2;
            const haloGrad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, haloRadius);
            haloGrad.addColorStop(0, `rgba(${m.r}, ${m.g}, ${m.b}, ${finalOpacity * 0.4})`);
            haloGrad.addColorStop(1, `rgba(${m.r}, ${m.g}, ${m.b}, 0)`);
            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(drawX, drawY, haloRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Draw motif
          ctx.globalAlpha = finalOpacity;
          ctx.fillStyle = `rgba(${m.r}, ${m.g}, ${m.b}, 1)`;
          m.drawFn(ctx, drawX, drawY, m.size, m.rotation);
          ctx.globalAlpha = 1;

          // Mouse proximity glow ring on near particles
          if (layerName === 'near' && m.glowIntensity > 0.05) {
            const glowRad = m.size * 1.5;
            const glowGrad = ctx.createRadialGradient(drawX, drawY, m.size * 0.3, drawX, drawY, glowRad);
            glowGrad.addColorStop(0, `rgba(${m.r}, ${m.g}, ${m.b}, ${m.glowIntensity * 0.06})`);
            glowGrad.addColorStop(1, `rgba(${m.r}, ${m.g}, ${m.b}, 0)`);
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(drawX, drawY, glowRad, 0, Math.PI * 2);
            ctx.fill();
          }

          // Store draw positions for constellation lines
          if (layerName === 'mid' || layerName === 'near') {
            nearMotifs.push({ x: drawX, y: drawY, r: m.r, g: m.g, b: m.b, opacity: finalOpacity });
          }
        }
      }

      // ── Constellation Lines ────────────────
      const maxLineDist = 180;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nearMotifs.length; i++) {
        for (let j = i + 1; j < nearMotifs.length; j++) {
          const a = nearMotifs[i];
          const b = nearMotifs[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxLineDist) {
            const lineOpacity = (1 - dist / maxLineDist) * 0.04 * Math.min(a.opacity, b.opacity) * 10;
            const avgR = Math.round((a.r + b.r) / 2);
            const avgG = Math.round((a.g + b.g) / 2);
            const avgB = Math.round((a.b + b.b) / 2);
            ctx.strokeStyle = `rgba(${avgR}, ${avgG}, ${avgB}, ${lineOpacity})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // ── Mouse cursor glow ──────────────────
      if (mouse.active) {
        const cursorGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200);
        cursorGlow.addColorStop(0, 'rgba(212, 168, 75, 0.025)');
        cursorGlow.addColorStop(0.5, 'rgba(212, 168, 75, 0.01)');
        cursorGlow.addColorStop(1, 'rgba(212, 168, 75, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 200, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'auto',
      }}
      aria-hidden="true"
    />
  );
}
