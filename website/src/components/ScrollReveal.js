'use client';
import { useEffect, useRef } from 'react';

export default function ScrollReveal({ children, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const targets = el.querySelectorAll('[data-reveal]');

    if (prefersReducedMotion) {
      // Show everything immediately without animation
      targets.forEach(t => {
        t.style.opacity = '1';
        t.style.transform = 'none';
      });
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(t => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(24px)';
      t.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
      const delay = t.getAttribute('data-reveal-delay');
      if (delay) t.style.transitionDelay = delay;
      io.observe(t);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
