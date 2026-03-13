'use client';
import { useEffect, useRef } from 'react';
import styles from './page.module.css';

/* ── Placeholder data — replace with real art data later ── */
const GALLERY_ITEMS = [
  {
    id: 1,
    title: 'Untitled I',
    medium: 'Oil on Canvas',
    year: '2024',
    size: 'large',
  },
  {
    id: 2,
    title: 'Untitled II',
    medium: 'Mixed Media',
    year: '2023',
    size: 'normal',
  },
  {
    id: 3,
    title: 'Untitled III',
    medium: 'Acrylic on Canvas',
    year: '2024',
    size: 'normal',
  },
  {
    id: 4,
    title: 'Untitled IV',
    medium: 'Oil on Canvas',
    year: '2023',
    size: 'tall',
  },
  {
    id: 5,
    title: 'Untitled V',
    medium: 'Watercolour',
    year: '2024',
    size: 'normal',
  },
  {
    id: 6,
    title: 'Untitled VI',
    medium: 'Oil on Canvas',
    year: '2022',
    size: 'large',
  },
  {
    id: 7,
    title: 'Untitled VII',
    medium: 'Mixed Media',
    year: '2024',
    size: 'normal',
  },
  {
    id: 8,
    title: 'Untitled VIII',
    medium: 'Charcoal on Paper',
    year: '2023',
    size: 'tall',
  },
  {
    id: 9,
    title: 'Untitled IX',
    medium: 'Oil on Canvas',
    year: '2024',
    size: 'normal',
  },
];

/* Full-bleed showcase sections between grid rows */
const SHOWCASES = [
  {
    id: 'showcase-1',
    title: 'Where Cuisine Meets Canvas',
    subtitle: 'Chef Arturo\'s artistic expression extends far beyond the plate — each piece tells the story of a life lived between two passions.',
  },
  {
    id: 'showcase-2',
    title: 'From Abruzzo with Amore',
    subtitle: 'Rooted in the rugged beauty of the Italian countryside, Arturo\'s art carries the warmth, color, and emotion of his homeland.',
  },
];

export default function GalleryClient() {
  const galleryRef = useRef(null);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;

    /* ── Scroll-driven reveal via IntersectionObserver ── */
    const revealTargets = el.querySelectorAll('[data-gallery-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach((t) => observer.observe(t));

    /* ── Parallax float on scroll ── */
    const parallaxTargets = el.querySelectorAll('[data-parallax]');
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        parallaxTargets.forEach((t) => {
          const rect = t.getBoundingClientRect();
          const viewH = window.innerHeight;
          const center = rect.top + rect.height / 2;
          const offset = ((center - viewH / 2) / viewH) * -30;
          const speed = parseFloat(t.getAttribute('data-parallax') || '1');
          t.style.transform = `translateY(${offset * speed}px)`;
        });
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /* Split items into rows of 3 for grid + showcase interleaving */
  const rows = [];
  for (let i = 0; i < GALLERY_ITEMS.length; i += 3) {
    rows.push(GALLERY_ITEMS.slice(i, i + 3));
  }

  return (
    <div className={styles.galleryPage} ref={galleryRef}>
      {/* ═══ Hero ═══ */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.heroScript}>a different kind of masterpiece</p>
          <h1 className={styles.heroTitle}>The Art of Arturo</h1>
          <div className={styles.heroDivider} />
          <p className={styles.heroSubtitle}>
            Beyond the kitchen, Chef Arturo Comegna expresses his creativity on canvas.
            <br />
            A curated collection of original works — coming soon.
          </p>
        </div>
        <div className={styles.heroScroll}>
          <span>Scroll to Explore</span>
          <div className={styles.scrollLine} />
        </div>
      </section>

      {/* ═══ Gallery Grid + Showcases ═══ */}
      {rows.map((row, rowIndex) => (
        <div key={rowIndex}>
          {/* Grid row */}
          <section className={styles.gridSection}>
            <div className={styles.gridInner}>
              {row.map((item, itemIndex) => (
                <article
                  key={item.id}
                  className={`${styles.card} ${styles[`card_${item.size}`]}`}
                  data-gallery-reveal
                  style={{ transitionDelay: `${itemIndex * 0.12}s` }}
                >
                  <div className={styles.cardImageWrap} data-parallax={0.4 + itemIndex * 0.15}>
                    {/* Placeholder — replace <div> with <Image> when photos are ready */}
                    <div className={styles.cardPlaceholder}>
                      <svg className={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                      <span className={styles.placeholderText}>Artwork Photo</span>
                    </div>
                  </div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardMedium}>{item.medium}</p>
                    <span className={styles.cardYear}>{item.year}</span>
                  </div>
                  <div className={styles.cardGlow} />
                </article>
              ))}
            </div>
          </section>

          {/* Showcase section after first and second rows */}
          {rowIndex < SHOWCASES.length && (
            <section
              className={styles.showcase}
              data-gallery-reveal
            >
              <div className={styles.showcaseOverlay} />
              <div className={styles.showcaseContent} data-parallax="0.6">
                <div className={styles.showcaseDivider} />
                <h2 className={styles.showcaseTitle}>{SHOWCASES[rowIndex].title}</h2>
                <p className={styles.showcaseSubtitle}>{SHOWCASES[rowIndex].subtitle}</p>
                <div className={styles.showcaseDivider} />
              </div>
            </section>
          )}
        </div>
      ))}

      {/* ═══ Bottom CTA ═══ */}
      <section className={styles.cta} data-gallery-reveal>
        <div className={styles.ctaOverlay} />
        <div className={styles.ctaContent}>
          <p className={styles.ctaScript}>stay tuned</p>
          <h2 className={styles.ctaTitle}>More Art Coming Soon</h2>
          <p className={styles.ctaDesc}>
            Chef Arturo continues to create — new pieces will be added to this collection as they are completed.
          </p>
        </div>
      </section>
    </div>
  );
}
