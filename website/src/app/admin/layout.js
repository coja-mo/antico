'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { IconGrid, IconCalendar, IconFlame, IconUsers, IconLogOut, IconExternalLink, IconDollarSign, IconSettings, IconBarChart, IconGift, IconPrinter, IconPackage, IconCalendarClock, IconListOrdered, IconLock } from '@/components/Icons';
import styles from './admin.module.css';

export default function AdminLayout({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const session = localStorage.getItem('antico_staff');
    if (session) {
      try {
        setStaff(JSON.parse(session));
        setAuthenticated(true);
      } catch { /* invalid */ }
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('antico_staff', JSON.stringify(data));
        setStaff(data);
        setAuthenticated(true);
      } else {
        setLoginError('Invalid credentials');
      }
    } catch {
      setLoginError('Connection error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('antico_staff');
    setStaff(null);
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginBrand}>
            <Image src="/images/antico-logo-transparent.png" alt="Antico" width={140} height={56} className={styles.loginLogo} priority />
            <div className={styles.loginDivider} />
            <span className={styles.loginLabel}>Management System</span>
          </div>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.formField}>
              <label htmlFor="login-username">Username</label>
              <input id="login-username" type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required autoComplete="username" placeholder="Enter username" />
            </div>
            <div className={styles.formField}>
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required autoComplete="current-password" placeholder="Enter password" />
            </div>
            {loginError && <p className={styles.loginError}>{loginError}</p>}
            <button className={styles.loginButton} type="submit">Sign In</button>
          </form>
          <div className={styles.loginFooter}>
            <span>Antico Ristoranté</span>
            <span>Sault Ste. Marie, ON</span>
          </div>
        </div>
      </div>
    );
  }

  const navSections = [
    {
      label: 'Overview',
      items: [
        { href: '/admin', label: 'Dashboard', icon: IconGrid },
        { href: '/admin/analytics', label: 'Analytics', icon: IconBarChart },
        { href: '/admin/reports', label: 'Reports', icon: IconPrinter },
      ],
    },
    {
      label: 'Operations',
      items: [
        { href: '/admin/reservations', label: 'Reservations', icon: IconCalendar },
        { href: '/admin/orders', label: 'Orders', icon: IconDollarSign },
        { href: '/pos', label: 'POS Terminal', icon: IconExternalLink, external: true },
        { href: '/admin/kds', label: 'Kitchen Display', icon: IconFlame },
        { href: '/admin/waitlist', label: 'Waitlist', icon: IconListOrdered },
        { href: '/admin/closeout', label: 'Closeout', icon: IconLock },
      ],
    },
    {
      label: 'Management',
      items: [
        { href: '/admin/guests', label: 'Guest Database', icon: IconUsers },
        { href: '/admin/gift-cards', label: 'Gift Cards', icon: IconGift },
        { href: '/admin/inventory', label: 'Inventory', icon: IconPackage },
        { href: '/admin/scheduling', label: 'Scheduling', icon: IconCalendarClock },
        { href: '/admin/settings', label: 'Settings', icon: IconSettings },
      ],
    },
  ];

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className={styles.adminLayout}>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <Image src="/images/antico-logo-transparent.png" alt="Antico" width={88} height={35} className={styles.sidebarLogo} />
        </div>

        <nav className={styles.sidebarNav}>
          {navSections.map(section => (
            <div key={section.label} className={styles.navSection}>
              <span className={styles.navSectionLabel}>{section.label}</span>
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  >
                    <Icon size={16} />
                    <span className={styles.navLabel}>{item.label}</span>
                    {item.external && <span className={styles.navExternalBadge}>new tab</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.staffInfo}>
            <div className={styles.staffAvatar}>{staff?.name?.[0]?.toUpperCase()}</div>
            <div className={styles.staffMeta}>
              <span className={styles.staffName}>{staff?.name}</span>
              <span className={styles.staffRole}>{staff?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Sign out">
            <IconLogOut size={15} />
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <span className={styles.topBarDate}>{formattedDate}</span>
          </div>
          <div className={styles.topBarRight}>
            <Link href="/" target="_blank" className={styles.viewSiteLink}>
              View Site
              <IconExternalLink size={13} />
            </Link>
          </div>
        </div>
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
