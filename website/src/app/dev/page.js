'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  IconGrid, IconCalendar, IconFlame, IconUsers, IconExternalLink,
  IconMapPin, IconPhone, IconMail, IconClock, IconStar, IconWine,
  IconPalette, IconUtensils, IconSparkles, IconSearch, IconZap,
  IconCreditCard, IconCheck, IconAlertCircle, IconRefresh, IconLayout,
} from '@/components/Icons';
import styles from './dev.module.css';

const SECTIONS = [
  {
    title: 'Public Pages',
    description: 'Customer-facing pages',
    links: [
      { href: '/', label: 'Home', icon: IconSparkles, desc: 'Hero, about, menu preview, CTA' },
      { href: '/menu', label: 'Menu', icon: IconUtensils, desc: 'Full menu with categories' },
      { href: '/reserve', label: 'Reserve', icon: IconCalendar, desc: 'Multi-step reservation form' },
      { href: '/chef', label: 'The Chef', icon: IconStar, desc: 'Chef Arturo bio & timeline' },
      { href: '/gallery', label: 'Gallery', icon: IconPalette, desc: 'Art & ambiance showcase' },
      { href: '/contact', label: 'Contact', icon: IconMapPin, desc: 'Location, hours, map' },
    ],
  },
  {
    title: 'Admin & Operations',
    description: 'Backend management (auth required)',
    links: [
      { href: '/admin', label: 'Dashboard', icon: IconGrid, desc: 'Stats, pending requests, tonight\'s reservations' },
      { href: '/admin/reservations', label: 'Reservations', icon: IconCalendar, desc: 'Manage all reservations' },
      { href: '/admin/kds', label: 'Kitchen Display', icon: IconFlame, desc: 'Real-time kitchen order queue' },
      { href: '/admin/guests', label: 'Guest Database', icon: IconUsers, desc: 'Customer profiles & history' },
      { href: '/pos', label: 'POS Terminal', icon: IconCreditCard, desc: 'Point of sale, floor plan, orders', external: true },
    ],
  },
  {
    title: 'API Routes',
    description: 'Backend endpoints (JSON)',
    links: [
      { href: '/api/reservations', label: 'GET /api/reservations', icon: IconCalendar, desc: 'All reservations' },
      { href: '/api/guests', label: 'GET /api/guests', icon: IconUsers, desc: 'Guest database' },
      { href: '/api/menu', label: 'GET /api/menu', icon: IconUtensils, desc: 'Menu items' },
      { href: '/api/tables', label: 'GET /api/tables', icon: IconLayout, desc: 'Table layout & status' },
      { href: '/api/kds', label: 'GET /api/kds', icon: IconFlame, desc: 'Kitchen queue items' },
      { href: '/api/auth', label: 'POST /api/auth', icon: IconZap, desc: 'Staff authentication' },
    ],
  },
];

const SEO_FILES = [
  { label: 'sitemap.xml', href: '/sitemap.xml', desc: 'Dynamic XML sitemap for crawlers' },
  { label: 'robots.txt', href: '/robots.txt', desc: 'Crawler rules (blocks /admin, /pos, /api)' },
  { label: 'manifest.webmanifest', href: '/manifest.webmanifest', desc: 'PWA manifest (theme, icons, name)' },
];

const TECH_STACK = [
  { label: 'Next.js', version: '16.1.6' },
  { label: 'React', version: '19.2.3' },
  { label: 'SQLite', version: 'better-sqlite3' },
  { label: 'Auth', version: 'bcryptjs' },
];

const COMPONENTS = [
  'Header', 'Footer', 'ScrollReveal', 'ScrollToTop',
  'FloatingMotifs', 'Calendar', 'Icons (40+ SVG)',
];

export default function DevPortal() {
  const [apiHealth, setApiHealth] = useState({});
  const [checking, setChecking] = useState(false);

  async function checkHealth() {
    setChecking(true);
    const endpoints = ['/api/reservations', '/api/guests', '/api/menu', '/api/tables', '/api/kds'];
    const results = {};
    for (const ep of endpoints) {
      try {
        const start = Date.now();
        const res = await fetch(ep);
        results[ep] = { ok: res.ok, status: res.status, ms: Date.now() - start };
      } catch {
        results[ep] = { ok: false, status: 'ERR', ms: 0 };
      }
    }
    setApiHealth(results);
    setChecking(false);
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className={styles.devPage}>
      {/* Header */}
      <header className={styles.devHeader}>
        <div className={styles.devHeaderLeft}>
          <div className={styles.asnBrand}>
            <span className={styles.asnIcon}>🚀</span>
            <div>
              <span className={styles.asnName}>Antigravity Solutions North</span>
              <span className={styles.asnSub}>Client Portal · Antico Ristoranté</span>
            </div>
          </div>
        </div>
        <div className={styles.devHeaderRight}>
          <span className={styles.devTime}>{dateStr} · {timeStr}</span>
          <Link href="/" className={styles.devSiteLink}>
            <IconExternalLink size={13} /> View Site
          </Link>
        </div>
      </header>

      <div className={styles.devContent}>
        {/* Quick Actions */}
        <section className={styles.quickActions}>
          <button className={styles.healthBtn} onClick={checkHealth} disabled={checking}>
            <IconRefresh size={14} className={checking ? styles.spinning : ''} />
            {checking ? 'Checking...' : 'Health Check'}
          </button>
          <Link href="/admin" className={styles.quickLink}>
            <IconGrid size={14} /> Admin
          </Link>
          <Link href="/pos" className={styles.quickLink} target="_blank">
            <IconCreditCard size={14} /> POS
          </Link>
          <Link href="/admin/kds" className={styles.quickLink}>
            <IconFlame size={14} /> KDS
          </Link>
        </section>

        {/* Health Results */}
        {Object.keys(apiHealth).length > 0 && (
          <section className={styles.healthResults}>
            <h3 className={styles.healthTitle}>API Health</h3>
            <div className={styles.healthGrid}>
              {Object.entries(apiHealth).map(([ep, data]) => (
                <div key={ep} className={`${styles.healthCard} ${data.ok ? styles.healthOk : styles.healthFail}`}>
                  <span className={styles.healthDot} />
                  <span className={styles.healthEndpoint}>{ep.replace('/api/', '')}</span>
                  <span className={styles.healthStatus}>{data.status}</span>
                  <span className={styles.healthMs}>{data.ms}ms</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Link Sections */}
        {SECTIONS.map(section => (
          <section key={section.title} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <span className={styles.sectionDesc}>{section.description}</span>
            </div>
            <div className={styles.linkGrid}>
              {section.links.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={styles.linkCard}
                    target={link.external ? '_blank' : undefined}
                  >
                    <div className={styles.linkIcon}>
                      <Icon size={20} />
                    </div>
                    <div className={styles.linkInfo}>
                      <span className={styles.linkLabel}>
                        {link.label}
                        {link.external && <IconExternalLink size={11} />}
                      </span>
                      <span className={styles.linkDesc}>{link.desc}</span>
                    </div>
                    <span className={styles.linkHref}>{link.href}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {/* SEO & Infrastructure */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>SEO & Infrastructure</h2>
            <span className={styles.sectionDesc}>Generated files for search engines & PWA</span>
          </div>
          <div className={styles.linkGrid}>
            {SEO_FILES.map(file => (
              <a key={file.href} href={file.href} target="_blank" rel="noopener" className={styles.linkCard}>
                <div className={styles.linkIcon}>
                  <IconSearch size={20} />
                </div>
                <div className={styles.linkInfo}>
                  <span className={styles.linkLabel}>
                    {file.label} <IconExternalLink size={11} />
                  </span>
                  <span className={styles.linkDesc}>{file.desc}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Tech Stack & Components */}
        <div className={styles.infoGrid}>
          <section className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Tech Stack</h3>
            <div className={styles.infoList}>
              {TECH_STACK.map(t => (
                <div key={t.label} className={styles.infoRow}>
                  <span className={styles.infoLabel}>{t.label}</span>
                  <span className={styles.infoValue}>{t.version}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Components</h3>
            <div className={styles.infoList}>
              {COMPONENTS.map(c => (
                <div key={c} className={styles.infoRow}>
                  <span className={styles.infoLabel}>{c}</span>
                  <span className={styles.infoValue}>src/components/</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Route Groups</h3>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>(site)</span>
                <span className={styles.infoValue}>Public pages w/ header+footer</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>admin</span>
                <span className={styles.infoValue}>Auth-gated management UI</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>pos</span>
                <span className={styles.infoValue}>Standalone POS terminal</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>dev</span>
                <span className={styles.infoValue}>This portal (noindex)</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>api</span>
                <span className={styles.infoValue}>7 REST endpoints</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className={styles.devFooter}>
          <div className={styles.devFooterBrand}>
            <span className={styles.asnFooterIcon}>🚀</span>
            <div>
              <span className={styles.devFooterName}>Antigravity Solutions North</span>
              <span className={styles.devFooterSub}>Managed IT & Web · antigravitysolutions.ca</span>
            </div>
          </div>
          <span className={styles.devFooterRight}>
            Antico Ristoranté · anticorestaurant.ca · {now.getFullYear()}
          </span>
        </footer>
      </div>
    </div>
  );
}
