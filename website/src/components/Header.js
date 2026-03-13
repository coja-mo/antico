'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

const LEFT_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/chef', label: 'The Chef' },
  { href: '/gallery', label: 'Gallery' },
];

const RIGHT_LINKS = [
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const renderLink = (link) => (
    <Link
      key={link.href}
      href={link.href}
      className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ''}`}
      aria-current={pathname === link.href ? 'page' : undefined}
      onClick={() => setMenuOpen(false)}
    >
      {link.label}
    </Link>
  );

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Left group: Logo + Home & Menu */}
        <div className={styles.leftGroup}>
          <Link href="/" className={styles.logo} aria-label="Antico Ristoranté — Home">
            <Image
              src="/images/antico-logo-transparent.png"
              alt="Antico Ristoranté"
              width={120}
              height={50}
              className={styles.logoImg}
              priority
            />
          </Link>

          <nav className={styles.leftNav} aria-label="Main navigation">
            {LEFT_LINKS.map(renderLink)}
          </nav>
        </div>

        {/* Right group: Contact, Reserve */}
        <nav className={`${styles.rightNav} ${menuOpen ? styles.navOpen : ''}`} aria-label="Site navigation">
          {LEFT_LINKS.map(renderLink)}
          {RIGHT_LINKS.map(renderLink)}
          <Link
            href="/reserve"
            className={`btn btn-gold ${styles.reserveBtn} ${pathname === '/reserve' ? styles.reserveBtnActive : ''}`}
            aria-current={pathname === '/reserve' ? 'page' : undefined}
            onClick={() => setMenuOpen(false)}
          >
            Reserve a Table
          </Link>
        </nav>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
