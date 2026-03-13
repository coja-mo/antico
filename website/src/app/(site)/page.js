import Link from 'next/link';
import FloatingMotifs from '@/components/FloatingMotifs';
import ScrollReveal from '@/components/ScrollReveal';
import { IconPalette, IconLeaf, IconWine, IconSparkles } from '@/components/Icons';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <FloatingMotifs />
        <div className={styles.heroContent}>
          <p className={styles.heroGreeting}>Ciao, benvenuti</p>
          <h1 className={styles.heroTitle}>Antico</h1>
          <p className={styles.heroRistorante}>Ristoranté</p>
          <div className={styles.heroDivider} />
          <p className={styles.heroTagline}>Life's Too Short For Average Food</p>
          <p className={styles.heroSub}>Fine Italian Dining · Sault Ste. Marie</p>
          <div className={styles.heroCtas}>
            <Link href="/reserve" className="btn btn-gold">Reserve Your Experience</Link>
            <Link href="/menu" className="btn btn-outline">View the Menu</Link>
          </div>
        </div>
        <div className={styles.heroScroll}>
          <span>Scroll to discover</span>
          <div className={styles.scrollLine} />
        </div>
      </section>

      {/* ── ABOUT TEASER ── */}
      <ScrollReveal>
        <section className={styles.about}>
          <div className={styles.aboutInner}>
            <div className={styles.aboutText} data-reveal>
              <p className={styles.sectionLabel}>Our Story</p>
              <h2>A Passion Born in Abruzzo</h2>
              <div className={styles.goldDivider} />
              <p className={styles.aboutDesc}>
                From the sun-drenched hills of Casoli, Italy to the heart of Sault Ste. Marie — 
                Chef Arturo Comegna has spent a lifetime perfecting the art of authentic Italian cuisine. 
                At Antico, every dish tells a story of tradition, passion, and the finest ingredients.
              </p>
              <p className={styles.aboutDesc}>
                The restaurant itself is a work of art, with Chef Arturo's original paintings adorning 
                the walls, creating an atmosphere as rich and layered as his legendary dishes.
              </p>
              <Link href="/chef" className={styles.aboutLink}>
                Meet Chef Arturo →
              </Link>
            </div>
            <div className={styles.aboutVisual}>
              <div className={styles.aboutCard} data-reveal data-reveal-delay="0s">
                <span className={styles.aboutCardNum}>2012</span>
                <span className={styles.aboutCardLabel}>Est.</span>
              </div>
              <div className={styles.aboutCard} data-reveal data-reveal-delay="0.1s">
                <span className={styles.aboutCardNum}>40+</span>
                <span className={styles.aboutCardLabel}>Years of Craft</span>
              </div>
              <div className={styles.aboutCard} data-reveal data-reveal-delay="0.2s">
                <span className={styles.aboutCardNum}>3</span>
                <span className={styles.aboutCardLabel}>Restaurants Built</span>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── MENU PREVIEW ── */}
      <ScrollReveal>
        <section className={styles.menuPreview}>
          <div className={styles.menuPreviewInner}>
            <div data-reveal>
              <p className={styles.sectionLabel}>From the Kitchen</p>
              <h2>Signature Dishes</h2>
              <div className={styles.goldDivider} />
            </div>
            <div className={styles.dishGrid}>
              {[
                { name: 'Lobster Ravioli', desc: 'Delicate pasta parcels filled with fresh lobster, served in a velvety blush sauce' },
                { name: 'Veal Saltimbocca', desc: 'Pan seared veal with sage, capers, prosciutto, and provolone in a white wine reduction' },
                { name: 'Filet Mignon', desc: 'Centre cut 8oz filet topped with gorgonzola butter and a rich demi-glaze' },
                { name: 'Chicken or Veal Parmigiana', desc: 'Lightly breaded and pan-fried, topped with San Marzano tomato sauce and melted mozzarella' },
              ].map((dish, i) => (
                <div key={i} className={styles.dishCard} data-reveal data-reveal-delay={`${i * 0.1}s`}>
                  <h3 className={styles.dishName}>{dish.name}</h3>
                  <p className={styles.dishDesc}>{dish.desc}</p>
                </div>
              ))}
            </div>
            <div data-reveal data-reveal-delay="0.4s">
              <Link href="/menu" className="btn btn-outline" style={{ marginTop: '48px' }}>
                Explore the Full Menu
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── ATMOSPHERE ── */}
      <ScrollReveal>
        <section className={styles.atmosphere}>
          <div className={styles.atmosphereInner}>
            <div data-reveal>
              <p className={styles.sectionLabel}>The Experience</p>
              <h2>More Than a Meal</h2>
              <div className={styles.goldDivider} />
            </div>
            <div className={styles.atmosphereGrid}>
              <div className={styles.atmCard} data-reveal data-reveal-delay="0s">
                <span className={styles.atmIcon}><IconPalette size={28} color="var(--gold)" /></span>
                <h4>Art on the Walls</h4>
                <p>Chef Arturo's original paintings transform dining into a gallery experience</p>
              </div>
              <div className={styles.atmCard} data-reveal data-reveal-delay="0.1s">
                <span className={styles.atmIcon}><IconLeaf size={28} color="var(--gold)" /></span>
                <h4>Seasonal Patio</h4>
                <p>Dine al fresco on our intimate patio when spring and summer arrive</p>
              </div>
              <div className={styles.atmCard} data-reveal data-reveal-delay="0.2s">
                <span className={styles.atmIcon}><IconWine size={28} color="var(--gold)" /></span>
                <h4>Intimate Ambiance</h4>
                <p>An intimate setting perfect for date nights, celebrations, and special occasions</p>
              </div>
              <div className={styles.atmCard} data-reveal data-reveal-delay="0.3s">
                <span className={styles.atmIcon}><IconSparkles size={28} color="var(--gold)" /></span>
                <h4>Celebrity Kitchen</h4>
                <p>From Christopher Plummer to Great Big Sea — the kitchen where stars love to cook</p>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── RESERVATION CTA ── */}
      <ScrollReveal>
        <section className={styles.ctaSection}>
          <div className={styles.ctaInner} data-reveal>
            <p className={styles.ctaScript}>Your table awaits</p>
            <h2>Join Us for an Unforgettable Evening</h2>
            <p className={styles.ctaDesc}>
              Wednesday through Saturday · 6 Village Court, Sault Ste. Marie
            </p>
            <Link href="/reserve" className="btn btn-gold">
              Make a Reservation
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
