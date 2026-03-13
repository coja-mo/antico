'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconCalendar, IconClock, IconUsers, IconGrid, IconLogOut, IconSparkles, IconX, IconUserCircle } from '@/components/Icons';
import styles from '../account.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${m} ${ampm}`;
}

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelConfirm, setCancelConfirm] = useState(null);

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/customer/me');
      if (!meRes.ok) { router.push('/account/login'); return; }
      const res = await fetch('/api/customer/reservations');
      setReservations(await res.json());
      setLoading(false);
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/customer/me', { method: 'DELETE' });
    router.push('/account/login');
  };

  const cancelReservation = async (id) => {
    await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    setCancelConfirm(null);
  };

  if (loading) return <div className={styles.loadingState}>Loading reservations...</div>;

  const today = new Date().toISOString().split('T')[0];
  const filtered = filter === 'all' ? reservations
    : filter === 'upcoming' ? reservations.filter(r => r.date >= today && !['cancelled', 'declined', 'completed'].includes(r.status))
    : reservations.filter(r => r.date < today || ['completed', 'cancelled', 'declined'].includes(r.status));

  const statusKey = s => `status${s.charAt(0).toUpperCase() + s.slice(1)}`;

  return (
    <div className={styles.accountPage}>
      <div className={styles.accountHeader}>
        <p className={styles.accountGreeting}>Le Prenotazioni</p>
        <h1 className={styles.accountTitle}>My Reservations</h1>
      </div>

      <nav className={styles.accountNav}>
        <Link href="/account" className={styles.accountNavLink}><IconGrid size={14} /> Dashboard</Link>
        <Link href="/account/reservations" className={`${styles.accountNavLink} ${styles.accountNavLinkActive}`}><IconCalendar size={14} /> Reservations</Link>
        <Link href="/account/orders" className={styles.accountNavLink}><IconSparkles size={14} /> Order History</Link>
        <Link href="/account/profile" className={styles.accountNavLink}><IconUserCircle size={14} /> Profile</Link>
        <button onClick={handleLogout} className={styles.logoutBtn}><IconLogOut size={13} /> Sign Out</button>
      </nav>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['all', 'upcoming', 'past'].map(f => (
          <button
            key={f}
            className={`${styles.accountNavLink} ${filter === f ? styles.accountNavLinkActive : ''}`}
            onClick={() => setFilter(f)}
            style={{ cursor: 'pointer' }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionBody}>
          {filtered.length === 0 ? (
            <div className={styles.sectionEmpty}>
              <p>No reservations found</p>
              <Link href="/reserve" className={styles.authSubmit} style={{ display: 'inline-flex', width: 'auto', padding: '10px 24px', marginTop: 8 }}>
                Book a Table
              </Link>
            </div>
          ) : filtered.map(r => (
            <div key={r.id} className={styles.resoItem}>
              <div className={styles.resoItemInfo}>
                <span className={styles.resoItemDate}>{formatDate(r.date)}</span>
                <div className={styles.resoItemMeta}>
                  <span><IconClock size={11} /> {formatTime12(r.time)}</span>
                  <span><IconUsers size={11} /> {r.party_size} guests</span>
                  {r.occasion && <span>{r.occasion}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`${styles.resoItemStatus} ${styles[statusKey(r.status)]}`}>{r.status}</span>
                {['confirmed', 'pending'].includes(r.status) && r.date >= today && (
                  <button
                    onClick={() => setCancelConfirm(r)}
                    style={{ padding: '4px 10px', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 5, background: 'rgba(248,113,113,0.06)', color: '#f87171', fontSize: '0.68rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <IconX size={10} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {cancelConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0 0 0 / 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(255 255 255 / 0.08)', borderRadius: 12, padding: '28px 24px', maxWidth: 400, width: '90%' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#f87171' }}>Cancel Reservation?</h3>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255 255 255 / 0.45)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Cancel your reservation on <strong style={{ color: 'rgba(255 255 255 / 0.7)' }}>{formatDate(cancelConfirm.date)}</strong> at{' '}
              <strong style={{ color: 'rgba(255 255 255 / 0.7)' }}>{formatTime12(cancelConfirm.time)}</strong> for {cancelConfirm.party_size} guests? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setCancelConfirm(null)} style={{ flex: 1, padding: '10px 16px', borderRadius: 6, border: '1px solid rgba(255 255 255 / 0.06)', background: 'transparent', color: 'rgba(255 255 255 / 0.5)', fontSize: '0.8rem', cursor: 'pointer' }}>
                Keep Reservation
              </button>
              <button onClick={() => cancelReservation(cancelConfirm.id)} style={{ flex: 1, padding: '10px 16px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
