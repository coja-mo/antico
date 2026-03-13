'use client';
import { useEffect, useRef } from 'react';
import { IconMapPin, IconPhone, IconMail, IconClock } from '@/components/Icons';
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

export default function ContactPageClient() {
  const revealRef = useScrollReveal();

  return (
    <div className={styles.contactPage} ref={revealRef}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.script}>Contattaci</p>
          <h1>Contact Us</h1>
          <div className={styles.divider} />
          <p className={styles.subtitle}>We'd love to hear from you</p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.inner}>
          <div className={styles.contactGrid}>
            <div className={styles.contactCard} data-reveal style={{ animationDelay: '0s' }}>
              <div className={styles.iconWrap}>
                <IconMapPin size={22} color="var(--gold)" />
              </div>
              <h3>Location</h3>
              <p>6 Village Court</p>
              <p>Sault Ste. Marie, ON</p>
            </div>
            <div className={styles.contactCard} data-reveal style={{ animationDelay: '0.1s' }}>
              <div className={styles.iconWrap}>
                <IconPhone size={22} color="var(--gold)" />
              </div>
              <h3>Phone</h3>
              <p><a href="tel:7052550161">705-255-0161</a></p>
              <p className={styles.small}>Call or Text</p>
            </div>
            <div className={styles.contactCard} data-reveal style={{ animationDelay: '0.2s' }}>
              <div className={styles.iconWrap}>
                <IconMail size={22} color="var(--gold)" />
              </div>
              <h3>Email</h3>
              <p><a href="mailto:Acomegna@Hotmail.com">Acomegna@Hotmail.com</a></p>
            </div>
            <div className={styles.contactCard} data-reveal style={{ animationDelay: '0.3s' }}>
              <div className={styles.iconWrap}>
                <IconClock size={22} color="var(--gold)" />
              </div>
              <h3>Hours</h3>
              <p>Wednesday – Saturday</p>
              <p>Dinner Service</p>
            </div>
          </div>

          <div className={styles.mapSection} data-reveal>
            <div className={styles.mapPlaceholder}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2750.0!2d-84.3364!3d46.5226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4d364b0f0f0f0f0f%3A0x0!2s6+Village+Court%2C+Sault+Ste.+Marie%2C+ON!5e0!3m2!1sen!2sca!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Antico Ristoranté Location"
              />
            </div>
          </div>

          <div className={styles.messageNote} data-reveal>
            <p className={styles.script}>Ciao</p>
            <p>
              For reservations, please use our <a href="/reserve">reservation page</a> or 
              call us at <a href="tel:7052550161">705-255-0161</a>. Just give us a few details 
              about the size of your party, the occasion and the reservation time and we promise 
              you a wonderful dining experience.
            </p>
            <p className={styles.signoff}>— Chef Arturo Comegna</p>
          </div>
        </div>
      </section>
    </div>
  );
}
