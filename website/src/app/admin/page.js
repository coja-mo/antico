'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconCalendar, IconUsers, IconClock, IconTrendingUp, IconAlertCircle, IconChevronRight, IconDollarSign, IconExternalLink, IconPlus } from '@/components/Icons';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ today: [], pending: [], upcoming: [], totalGuests: 0, todayRevenue: 0, openOrders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [allRes, guestsRes, ordersRes] = await Promise.all([
        fetch('/api/reservations').then(r => r.json()),
        fetch('/api/guests').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
      ]);
      const todayResos = allRes.filter(r => r.date === today);
      const pending = allRes.filter(r => r.status === 'pending');
      const upcoming = allRes.filter(r => r.date >= today && r.status === 'confirmed');

      // Today's revenue from closed orders
      const todayClosed = ordersRes.filter(o => o.status === 'closed' && (o.closed_at || '').startsWith(today));
      const todayRevenue = todayClosed.reduce((s, o) => s + (o.total || 0), 0);
      const openOrders = ordersRes.filter(o => o.status === 'open').length;

      setStats({
        today: todayResos, pending, upcoming: upcoming.slice(0, 10),
        totalGuests: guestsRes.length, allResos: allRes,
        todayRevenue, openOrders, todayClosedCount: todayClosed.length,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const todayCovers = stats.today.reduce((sum, r) => sum + (r.party_size || 0), 0);
  const todayConfirmed = stats.today.filter(r => r.status === 'confirmed').length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>Service overview and pending actions</p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Link href="/pos" target="_blank" className={`${styles.actionBtn} ${styles.actionBtnGold}`} style={{ textDecoration: 'none' }}>
          <IconExternalLink size={13} /> Open POS
        </Link>
        <Link href="/admin/reservations" className={`${styles.actionBtn} ${styles.actionBtnDefault}`} style={{ textDecoration: 'none' }}>
          <IconCalendar size={13} /> Reservations
        </Link>
        <Link href="/admin/orders" className={`${styles.actionBtn} ${styles.actionBtnDefault}`} style={{ textDecoration: 'none' }}>
          <IconDollarSign size={13} /> Orders
        </Link>
        <Link href="/admin/reports" className={`${styles.actionBtn} ${styles.actionBtnDefault}`} style={{ textDecoration: 'none' }}>
          <IconTrendingUp size={13} /> Reports
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Tonight</span>
            <span className={styles.statIcon}><IconCalendar size={15} /></span>
          </div>
          <div className={styles.statValue}>{stats.today.length}</div>
          <div className={styles.statSub}>{todayCovers} covers, {todayConfirmed} confirmed</div>
        </div>

        <div className={`${styles.statCard} ${stats.pending.length > 0 ? styles.statWarning : ''}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Pending</span>
            <span className={styles.statIcon}><IconAlertCircle size={15} /></span>
          </div>
          <div className={styles.statValue}>{stats.pending.length}</div>
          <div className={styles.statSub}>Requires review</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Today&apos;s Revenue</span>
            <span className={styles.statIcon}><IconDollarSign size={15} /></span>
          </div>
          <div className={styles.statValue}>${stats.todayRevenue?.toFixed(2) || '0.00'}</div>
          <div className={styles.statSub}>{stats.todayClosedCount || 0} closed, {stats.openOrders || 0} open</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Guest Database</span>
            <span className={styles.statIcon}><IconUsers size={15} /></span>
          </div>
          <div className={styles.statValue}>{stats.totalGuests}</div>
          <div className={styles.statSub}>Total profiles</div>
        </div>
      </div>

      {/* Pending Requests */}
      {stats.pending.length > 0 && (
        <div className={styles.cardSection}>
          <div className={styles.cardSectionHeader}>
            <span className={styles.cardSectionTitle}>Pending Requests</span>
            <span className={styles.sectionBadge}>{stats.pending.length} awaiting</span>
          </div>
          <div className={styles.cardSectionContent}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Party</th>
                  <th>Occasion</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stats.pending.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className={styles.cellPrimary}>{r.guest_name}</div>
                      <div className={styles.cellMuted}>{r.email}</div>
                    </td>
                    <td>{r.date}</td>
                    <td>{r.time}</td>
                    <td>{r.party_size}</td>
                    <td>{r.occasion || '\u2014'}</td>
                    <td>
                      <Link href="/admin/reservations" className={`${styles.actionBtn} ${styles.actionBtnGold}`}>
                        Manage <IconChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tonight's Schedule */}
      <div className={styles.cardSection}>
        <div className={styles.cardSectionHeader}>
          <span className={styles.cardSectionTitle}>Tonight&apos;s Reservations</span>
          {stats.today.length > 0 && (
            <span style={{ fontSize: '0.72rem', color: 'rgba(255 255 255 / 0.3)' }}>
              {todayCovers} total covers
            </span>
          )}
        </div>
        <div className={styles.cardSectionContent}>
          {stats.today.length > 0 ? (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Guest</th>
                  <th>Party</th>
                  <th>Occasion</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {stats.today.sort((a, b) => a.time.localeCompare(b.time)).map(r => (
                  <tr key={r.id}>
                    <td className={styles.cellPrimary}>{r.time}</td>
                    <td>{r.guest_name}</td>
                    <td>{r.party_size}</td>
                    <td>{r.occasion || '\u2014'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.notes || '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><IconCalendar size={20} /></div>
              <p className={styles.emptyText}>No reservations for tonight</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
