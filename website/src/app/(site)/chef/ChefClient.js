'use client';
import { useEffect, useRef } from 'react';
import { IconStar } from '@/components/Icons';
import styles from './page.module.css';

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
    }, { threshold: 0.15 });
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function ChefPageClient() {
  const revealRef = useScrollReveal();

  return (
    <div className={styles.chefPage} ref={revealRef}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.script}>Il Maestro</p>
          <h1>Chef Arturo Comegna</h1>
          <div className={styles.divider} />
          <p className={styles.subtitle}>Owner & Head Chef</p>
        </div>
      </section>

      <section className={styles.story}>
        <div className={styles.inner}>
          <div className={styles.storyContent} data-reveal>
            <h2>From Casoli to Canada</h2>
            <div className={styles.goldDivider} />
            <p>
              Arturo Comegna was born in the small town of Casoli in the Abruzzo region of Italy. 
              He has always had a strong passion for fine Italian cuisine. From a young age, he began 
              perfecting his delicious recipes and started his culinary career at the remarkable age of 12.
            </p>
            <p>
              Art moved to Sault Ste. Marie where he followed his passion for food by acquiring 
              Rico's restaurant on Spring Street. Later, Arturo opened the highly successful 
              Arturo Ristoranté on Queen Street — a restaurant that became a cornerstone of the 
              city's dining scene.
            </p>
            <p>
              Building on the success of Arturo's — which is now proudly owned by his sons Chris & Thomas — 
              he opened Antico Ristoranté in 2012, creating a space that is as much a gallery as it is a restaurant.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className={styles.timeline}>
        <div className={styles.inner}>
          <h2 className={styles.timelineTitle} data-reveal>The Journey</h2>
          <div className={styles.goldDivider} style={{ margin: '24px auto 48px' }} data-reveal />
          <div className={styles.timelineTrack}>
            {[
              { year: 'Age 12', title: 'Culinary Beginnings', desc: 'Started his culinary career in Casoli, Abruzzo, Italy' },
              { year: '~1990s', title: "Rico's Restaurant", desc: 'Acquired Rico\'s on Spring Street in Sault Ste. Marie' },
              { year: '~2000s', title: 'Arturo Ristoranté', desc: 'Opened the acclaimed Arturo Ristoranté on Queen Street' },
              { year: '2012', title: 'Antico Ristoranté', desc: 'Opened Antico — a fusion of culinary mastery and art' },
              { year: 'Today', title: 'The Legacy Continues at Antico', desc: 'While sons Chris & Thomas carry on the family tradition at Arturo\'s Ristoranté' },
            ].map((item, i) => (
              <div key={i} className={styles.timelineItem} data-reveal style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineCard}>
                  <span className={styles.timelineYear}>{item.year}</span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Art & Atmosphere */}
      <section className={styles.artSection}>
        <div className={styles.inner}>
          <div className={styles.artContent} data-reveal>
            <p className={styles.script}>Arte e Cucina</p>
            <h2>Art on Every Wall</h2>
            <div className={styles.goldDivider} />
            <p>
              Antico is not only a testament to Arturo's incredible food skills, but also his 
              artistic talents. The restaurant walls are adorned with his beautiful original 
              paintings, created over the years — transforming every meal into a gallery experience.
            </p>
          </div>
        </div>
      </section>

      {/* Celebrity Section */}
      <section className={styles.celebrity}>
        <div className={styles.inner}>
          <p className={styles.script} data-reveal>Ospiti Speciali</p>
          <h2 data-reveal>A Kitchen Where Stars Cook</h2>
          <div className={styles.goldDivider} style={{ margin: '24px auto 48px' }} data-reveal />
          <p className={styles.celebrityDesc} data-reveal>
            More than a few celebrities have joined Art in the kitchen over the years. 
            These aren't just visits — they're collaborations with a master chef.
          </p>
          <div className={styles.celebrityGrid}>
            {['Christopher Plummer', 'Great Big Sea', 'Rankin Family', 'Maria Bello'].map((name, i) => (
              <div key={i} className={styles.celebrityCard} data-reveal style={{ animationDelay: `${i * 0.1}s` }}>
                <span className={styles.star}>
                  <IconStar size={20} color="var(--gold)" />
                </span>
                <p>{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
