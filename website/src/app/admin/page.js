'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconCalendar, IconUsers, IconClock, IconTrendingUp, IconAlertCircle, IconChevronRight } from '@/components/Icons';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ today: [], pending: [], upcoming: [], totalGuests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [allRes, guestsRes] = await Promise.all([
        fetch('/api/reservations').then(r => r.json()),
        fetch('/api/guests').then(r => r.json()),
      ]);
      const todayResos = allRes.filter(r => r.date === today);
      const pending = allRes.filter(r => r.status === 'pending');
      const upcoming = allRes.filter(r => r.date >= today && r.status === 'confirmed');
      setStats({ today: todayResos, pending, upcoming: upcoming.slice(0, 10), totalGuests: guestsRes.length, allResos: allRes });
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
            <span className={styles.statLabel}>Upcoming</span>
            <span className={styles.statIcon}><IconTrendingUp size={15} /></span>
          </div>
          <div className={styles.statValue}>{stats.upcoming.length}</div>
          <div className={styles.statSub}>Confirmed, next 7 days</div>
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
