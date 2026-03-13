'use client';
import { useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════
   FLOATING ITALIAN MOTIFS — Canvas Particle System
   Sophisticated, mouse/touch-reactive background
   ═══════════════════════════════════════════════ */

// --- Motif Path Definitions (drawn via canvas bezier curves) ---

function drawWineBottle(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const s = size * 0.5;
  ctx.beginPath();
  // Bottle body
  ctx.moveTo(-s * 0.3, s * 1.2);
  ctx.lineTo(-s * 0.3, s * 0.2);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.1, -s * 0.15, -s * 0.3);
  ctx.lineTo(-s * 0.12, -s * 0.8);
  // Bottle neck
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
  // Bowl
  ctx.moveTo(-s * 0.5, -s * 0.6);
  ctx.quadraticCurveTo(-s * 0.55, s * 0.2, 0, s * 0.4);
  ctx.quadraticCurveTo(s * 0.55, s * 0.2, s * 0.5, -s * 0.6);
  ctx.closePath();
  ctx.fill();
  // Stem
  ctx.fillRect(-s * 0.04, s * 0.4, s * 0.08, s * 0.6);
  // Base
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
  // Main ravioli shape (rounded square / pillow)
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.7);
  ctx.quadraticCurveTo(s * 0.8, -s * 0.8, s * 0.7, 0);
  ctx.quadraticCurveTo(s * 0.8, s * 0.8, 0, s * 0.7);
  ctx.quadraticCurveTo(-s * 0.8, s * 0.8, -s * 0.7, 0);
  ctx.quadraticCurveTo(-s * 0.8, -s * 0.8, 0, -s * 0.7);
  ctx.closePath();
  ctx.fill();
  // Crimp marks
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 1;
  ctx.globalAlpha *= 0.5;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    const r1 = s * 0.55;
    const r2 = s * 0.72;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * r1, Math.sin(angle) * r1, s * 0.06, 0, Math.PI * 2);
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
  // Swirled spaghetti strands
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.3, 0, Math.PI * 1.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(s * 0.1, -s * 0.05, s * 0.22, 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-s * 0.05, s * 0.08, s * 0.25, 1, Math.PI * 2.2);
  ctx.stroke();
  // Fork handle
  ctx.fillRect(-s * 0.03, -s * 0.3, s * 0.06, -s * 0.8);
  // Fork tines
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
  // Main branch
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.2);
  ctx.quadraticCurveTo(0, -s * 0.1, s, s * 0.15);
  ctx.stroke();
  // Leaves
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
  // Olives
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
  // Leaf vein
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

// --- Particle Class ---

function createMotif(canvasW, canvasH) {
  return {
    x: Math.random() * canvasW,
    y: Math.random() * canvasH,
    baseX: 0, // set after x
    baseY: 0, // set after y
    size: 30 + Math.random() * 40,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.002,
    driftX: (Math.random() - 0.5) * 0.15,
    driftY: (Math.random() - 0.5) * 0.1 + 0.05, // slight downward drift
    opacity: 0.03 + Math.random() * 0.05,
    drawFn: DRAW_FUNCTIONS[Math.floor(Math.random() * DRAW_FUNCTIONS.length)],
    parallaxFactor: 0.02 + Math.random() * 0.04,
    offsetX: 0,
    offsetY: 0,
  };
}

export default function FloatingMotifs() {
  const canvasRef = useRef(null);
  const motifsRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const rafRef = useRef(null);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const count = Math.min(18, Math.max(12, Math.floor(rect.width / 80)));
    const motifs = [];
    for (let i = 0; i < count; i++) {
      const m = createMotif(canvas.width, canvas.height);
      m.baseX = m.x;
      m.baseY = m.y;
      motifs.push(m);
    }
    motifsRef.current = motifs;
  }, []);

  useEffect(() => {
    init();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const onResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      // Reposition motifs proportionally
      motifsRef.current.forEach(m => {
        m.baseX = Math.random() * canvas.width;
        m.baseY = Math.random() * canvas.height;
        m.x = m.baseX;
        m.y = m.baseY;
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

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;

      for (const m of motifsRef.current) {
        // Drift
        m.x += m.driftX;
        m.y += m.driftY;
        m.rotation += m.rotationSpeed;

        // Wrap around
        if (m.x > canvas.width + m.size) m.x = -m.size;
        if (m.x < -m.size) m.x = canvas.width + m.size;
        if (m.y > canvas.height + m.size) m.y = -m.size;
        if (m.y < -m.size) m.y = canvas.height + m.size;

        // Mouse parallax / repulsion
        let drawX = m.x;
        let drawY = m.y;
        if (mouse.active) {
          const dx = m.x - mouse.x;
          const dy = m.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 300;
          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * m.parallaxFactor * 80;
            const targetOffsetX = (dx / dist) * force;
            const targetOffsetY = (dy / dist) * force;
            m.offsetX += (targetOffsetX - m.offsetX) * 0.05;
            m.offsetY += (targetOffsetY - m.offsetY) * 0.05;
          } else {
            m.offsetX *= 0.95;
            m.offsetY *= 0.95;
          }
        } else {
          m.offsetX *= 0.95;
          m.offsetY *= 0.95;
        }

        drawX += m.offsetX;
        drawY += m.offsetY;

        // Draw
        ctx.globalAlpha = m.opacity;
        ctx.fillStyle = 'rgba(212, 168, 75, 1)'; // Golden amber
        m.drawFn(ctx, drawX, drawY, m.size, m.rotation);
        ctx.globalAlpha = 1;
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
