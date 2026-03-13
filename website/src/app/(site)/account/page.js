'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconCalendar, IconClock, IconUsers, IconGrid, IconLogOut, IconChevronRight, IconSparkles, IconUserCircle, IconGift } from '@/components/Icons';
import styles from './account.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${m} ${ampm}`;
}

export default function AccountDashboard() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gcAddCode, setGcAddCode] = useState('');
  const [gcAddMsg, setGcAddMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/customer/me');
        if (!meRes.ok) { router.push('/account/login'); return; }
        const me = await meRes.json();
        setCustomer(me);

        const [resoRes, ordersRes, gcRes] = await Promise.all([
          fetch('/api/customer/reservations'),
          fetch('/api/customer/orders'),
          fetch('/api/customer/gift-cards'),
        ]);
        setReservations(await resoRes.json());
        setOrders(await ordersRes.json());
        if (gcRes.ok) setGiftCards(await gcRes.json());
      } catch {
        router.push('/account/login');
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/customer/me', { method: 'DELETE' });
    router.push('/account/login');
  };

  if (loading) return <div className={styles.loadingState}>Loading your account...</div>;
  if (!customer) return null;

  const upcomingResos = reservations
    .filter(r => ['confirmed', 'pending', 'seated'].includes(r.status) && r.date >= new Date().toISOString().split('T')[0])
    .slice(0, 3);

  const recentOrders = orders.slice(0, 3);
  const statusKey = s => `status${s.charAt(0).toUpperCase() + s.slice(1)}`;

  return (
    <div className={styles.accountPage}>
      <div className={styles.accountHeader}>
        <p className={styles.accountGreeting}>Benvenuto</p>
        <h1 className={styles.accountTitle}>Welcome, {customer.first_name}</h1>
        <p className={styles.accountSubtitle}>
          {customer.visit_count > 0 ? `You've dined with us ${customer.visit_count} time${customer.visit_count !== 1 ? 's' : ''}` : 'We look forward to welcoming you'}
        </p>
      </div>

      <nav className={styles.accountNav}>
        <Link href="/account" className={`${styles.accountNavLink} ${styles.accountNavLinkActive}`}>
          <IconGrid size={14} /> Dashboard
        </Link>
        <Link href="/account/reservations" className={styles.accountNavLink}>
          <IconCalendar size={14} /> Reservations
        </Link>
        <Link href="/account/orders" className={styles.accountNavLink}>
          <IconSparkles size={14} /> Order History
        </Link>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <IconLogOut size={13} /> Sign Out
        </button>
      </nav>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{customer.visit_count || 0}</div>
          <div className={styles.statLabel}>Total Visits</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{reservations.length}</div>
          <div className={styles.statLabel}>Reservations</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{orders.length}</div>
          <div className={styles.statLabel}>Orders</div>
        </div>
      </div>

      {/* Upcoming Reservations */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}><IconCalendar size={15} /> Upcoming Reservations</span>
          <Link href="/account/reservations" className={styles.sectionLink}>
            View All <IconChevronRight size={12} />
          </Link>
        </div>
        <div className={styles.sectionBody}>
          {upcomingResos.length === 0 ? (
            <div className={styles.sectionEmpty}>
              <p>No upcoming reservations</p>
              <Link href="/reserve" className={styles.authSubmit} style={{ display: 'inline-flex', width: 'auto', padding: '10px 24px', marginTop: 8 }}>
                Book a Table
              </Link>
            </div>
          ) : upcomingResos.map(r => (
            <div key={r.id} className={styles.resoItem}>
              <div className={styles.resoItemInfo}>
                <span className={styles.resoItemDate}>{formatDate(r.date)}</span>
                <div className={styles.resoItemMeta}>
                  <span><IconClock size={11} /> {formatTime12(r.time)}</span>
                  <span><IconUsers size={11} /> {r.party_size} guests</span>
                  {r.occasion && <span>{r.occasion}</span>}
                </div>
              </div>
              <span className={`${styles.resoItemStatus} ${styles[statusKey(r.status)]}`}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}><IconSparkles size={15} /> Recent Orders</span>
          <Link href="/account/orders" className={styles.sectionLink}>
            View All <IconChevronRight size={12} />
          </Link>
        </div>
        <div className={styles.sectionBody}>
          {recentOrders.length === 0 ? (
            <div className={styles.sectionEmpty}>No orders yet</div>
          ) : recentOrders.map(o => (
            <div key={o.id} className={styles.orderItem}>
              <div className={styles.orderItemHeader}>
                <span className={styles.orderItemDate}>
                  {new Date(o.closed_at || o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className={styles.orderItemTotal}>${o.total?.toFixed(2)}</span>
              </div>
              <div className={styles.orderItemMeta}>
                <span>{o.items?.length || 0} items</span>
                <span>{o.payment_method}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gift Cards */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}><IconGift size={15} /> Gift Cards</span>
          <Link href="/gift-cards" className={styles.sectionLink}>
            Buy Gift Card <IconChevronRight size={12} />
          </Link>
        </div>
        <div className={styles.sectionBody}>
          {giftCards.length === 0 ? (
            <div className={styles.sectionEmpty}>
              <p>No gift cards linked</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <input
                  style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.85rem', width: 200 }}
                  placeholder="Enter card code"
                  value={gcAddCode}
                  onChange={e => setGcAddCode(e.target.value.toUpperCase())}
                />
                <button
                  className={styles.authSubmit}
                  style={{ display: 'inline-flex', width: 'auto', padding: '8px 16px', fontSize: '0.8rem' }}
                  onClick={async () => {
                    if (!gcAddCode.trim()) return;
                    const res = await fetch('/api/customer/gift-cards', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: gcAddCode.trim() }),
                    });
                    if (res.ok) {
                      const card = await res.json();
                      setGiftCards([card, ...giftCards]);
                      setGcAddCode('');
                      setGcAddMsg('Card added!');
                      setTimeout(() => setGcAddMsg(''), 3000);
                    } else {
                      const err = await res.json();
                      setGcAddMsg(err.error || 'Failed to add card');
                      setTimeout(() => setGcAddMsg(''), 3000);
                    }
                  }}
                >
                  Add Card
                </button>
              </div>
              {gcAddMsg && <p style={{ fontSize: '0.78rem', color: gcAddMsg === 'Card added!' ? 'var(--success)' : 'var(--danger)', marginTop: 8 }}>{gcAddMsg}</p>}
            </div>
          ) : (
            <>
              {giftCards.map(gc => (
                <Link key={gc.id} href={`/gift-cards/${gc.code}`} className={styles.resoItem} style={{ textDecoration: 'none' }}>
                  <div className={styles.resoItemInfo}>
                    <span className={styles.resoItemDate} style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }}>{gc.code}</span>
                    <div className={styles.resoItemMeta}>
                      <span>Balance: <strong style={{ color: 'var(--gold)' }}>${gc.balance.toFixed(2)}</strong></span>
                      <span>{gc.recipient_name || 'Gift Card'}</span>
                    </div>
                  </div>
                  <span className={`${styles.resoItemStatus} ${gc.status === 'active' ? styles.statusConfirmed : styles.statusCompleted}`}>
                    {gc.status}
                  </span>
                </Link>
              ))}
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.82rem', flex: 1 }}
                  placeholder="Add another card code"
                  value={gcAddCode}
                  onChange={e => setGcAddCode(e.target.value.toUpperCase())}
                />
                <button
                  className={styles.authSubmit}
                  style={{ display: 'inline-flex', width: 'auto', padding: '8px 16px', fontSize: '0.78rem' }}
                  onClick={async () => {
                    if (!gcAddCode.trim()) return;
                    const res = await fetch('/api/customer/gift-cards', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: gcAddCode.trim() }),
                    });
                    if (res.ok) {
                      const card = await res.json();
                      setGiftCards([card, ...giftCards]);
                      setGcAddCode('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
