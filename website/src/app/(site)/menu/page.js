'use client';
import { useEffect, useRef } from 'react';
import styles from './page.module.css';
import data from '@/data/antico_data.json';

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add(styles.revealed);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function MenuPage() {
  const { menu } = data;
  const revealRef = useScrollReveal();

  return (
    <div className={styles.menuPage} ref={revealRef}>
      {/* Hero Banner */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.script}>Buon Appetito</p>
          <h1>The Menu</h1>
          <div className={styles.divider} />
          <p className={styles.subtitle}>Authentic Italian cuisine, crafted with passion</p>
        </div>
      </section>

      {/* Menu Sections */}
      <section className={styles.menuBody}>
        <div className={styles.inner}>

          {/* Appetizers */}
          <div className={styles.category} data-reveal>
            <div className={styles.categoryHeader}>
              <h2>Appetizers</h2>
              <span className={styles.categoryLine} />
            </div>
            <div className={styles.itemGrid}>
              {menu.appetizers.map((item, i) => (
                <div key={i} className={styles.menuItem}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemDesc}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Salads */}
          <div className={styles.category} data-reveal>
            <div className={styles.categoryHeader}>
              <h2>Salads</h2>
              <span className={styles.categoryLine} />
            </div>
            <div className={styles.itemGrid}>
              {menu.salads.map((item, i) => (
                <div key={i} className={styles.menuItem}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemDesc}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative Break */}
          <div className={styles.sectionOrnament} data-reveal>
            <span className={styles.ornamentLine} />
            <span className={styles.ornamentDiamond} />
            <span className={styles.ornamentLine} />
          </div>

          {/* Quote */}
          <div className={styles.quote} data-reveal>
            <p className={styles.quoteText}>Life's Too Short For Average Food</p>
          </div>

          {/* Another Ornament */}
          <div className={styles.sectionOrnament} data-reveal>
            <span className={styles.ornamentLine} />
            <span className={styles.ornamentDiamond} />
            <span className={styles.ornamentLine} />
          </div>

          {/* Entrees */}
          <div className={styles.category} data-reveal>
            <div className={styles.categoryHeader}>
              <h2>Entrées</h2>
              <span className={styles.categoryLine} />
            </div>
            <p className={styles.categoryNote}>{menu.entrees.note}</p>
            <div className={styles.itemGrid}>
              {menu.entrees.items.map((item, i) => (
                <div key={i} className={styles.menuItem}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemDesc}>{item.description}</p>
                </div>
              ))}
            </div>
            <div className={styles.addOns}>
              <p className={styles.addOnsTitle}>Entrée Add-ons & Upgrades</p>
              <div className={styles.addOnsList}>
                {menu.entrees.addOns.map((item, i) => (
                  <span key={i} className={styles.addOnTag}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Desserts */}
          <div className={styles.category} data-reveal>
            <div className={styles.categoryHeader}>
              <h2>Desserts</h2>
              <span className={styles.categoryLine} />
            </div>
            <div className={styles.dessertCard}>
              <p className={styles.dessertNote}>{menu.desserts.note}</p>
              <p className={styles.dessertHint}>
                <span className={styles.dessertStar}>✦</span> 
                Hint: {menu.desserts.featured} is delicious.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
