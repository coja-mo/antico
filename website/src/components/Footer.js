import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Image
              src="/images/antico-logo-transparent.png"
              alt="Antico"
              width={160}
              height={65}
              className={styles.logo}
            />
            <p className={styles.tagline}>Life's Too Short For Average Food</p>
          </div>

          <div className={styles.links}>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Navigate</h4>
              <Link href="/">Home</Link>
              <Link href="/menu">Menu</Link>
              <Link href="/chef">The Chef</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/reserve">Reservations</Link>
            </div>

            <div className={styles.col}>
              <h4 className={styles.colTitle}>Visit Us</h4>
              <p>6 Village Court</p>
              <p>Sault Ste. Marie, ON</p>
              <p style={{ marginTop: '8px' }}>Wed – Sat</p>
              <p>Dinner Service</p>
            </div>

            <div className={styles.col}>
              <h4 className={styles.colTitle}>Contact</h4>
              <a href="tel:7052550161">705-255-0161</a>
              <p className={styles.small}>Call or Text</p>
              <a href="mailto:Acomegna@Hotmail.com">Acomegna@Hotmail.com</a>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <p className={styles.copy}>© {new Date().getFullYear()} Antico Ristoranté. All rights reserved.</p>
          <div className={styles.credit}>
            <span>Crafted with 💛 by </span>
            <a href="https://antigravitysolutions.ca" target="_blank" rel="noopener noreferrer" className={styles.asnLink}>
              Antigravity Solutions North
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
