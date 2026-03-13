'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/antico-logo-transparent.png"
            alt="Antico"
            width={120}
            height={50}
            className={styles.logoImg}
            priority
          />
        </Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <Link href="/" className={styles.navLink} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/menu" className={styles.navLink} onClick={() => setMenuOpen(false)}>Menu</Link>
          <Link href="/chef" className={styles.navLink} onClick={() => setMenuOpen(false)}>The Chef</Link>
          <Link href="/contact" className={styles.navLink} onClick={() => setMenuOpen(false)}>Contact</Link>
          <Link href="/reserve" className={`btn btn-gold ${styles.reserveBtn}`} onClick={() => setMenuOpen(false)}>
            Reserve a Table
          </Link>
        </nav>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
