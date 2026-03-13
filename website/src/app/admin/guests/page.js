'use client';
import { useState, useEffect } from 'react';
import { IconSearch, IconUsers, IconStar, IconX, IconCalendar } from '@/components/Icons';
import styles from '../admin.module.css';

export default function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestReservations, setGuestReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGuests(); }, [search]);

  async function loadGuests() {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/guests${params}`);
    setGuests(await res.json());
    setLoading(false);
  }

  async function selectGuest(guest) {
    setSelectedGuest(guest);
    const res = await fetch(`/api/reservations?search=${encodeURIComponent(guest.email)}`);
    setGuestReservations(await res.json());
  }

  const statusKey = (s) => `status${s.charAt(0).toUpperCase() + s.slice(1)}`;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Guest Database</h1>
        <p className={styles.pageSubtitle}>Guest profiles, reservation history, and visit tracking</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <IconSearch size={15} />
          <input className={styles.searchInput} placeholder="Search guests by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className={`${styles.splitLayout} ${selectedGuest ? styles.splitLayoutOpen : ''}`}>
        {/* Guest List */}
        <div className={styles.cardSection}>
          <div className={styles.cardSectionContent}>
            {guests.length > 0 ? (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Visits</th>
                    <th>Last Visit</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map(g => (
                    <tr key={g.id} onClick={() => selectGuest(g)} style={{ cursor: 'pointer', background: selectedGuest?.id === g.id ? 'rgba(212,168,75,0.03)' : undefined }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 6,
                            background: 'rgba(212,168,75,0.12)', color: 'var(--gold)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 600, fontSize: '0.72rem', flexShrink: 0,
                          }}>
                            {g.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.cellPrimary}>{g.name}</div>
                            <div className={styles.cellMuted}>{g.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className={styles.cellPrimary}>{g.visit_count}</span>
                          {g.visit_count > 5 && <IconStar size={11} color="var(--gold)" />}
                        </div>
                      </td>
                      <td>{g.last_visit ? new Date(g.last_visit).toLocaleDateString() : '\u2014'}</td>
                      <td>{g.phone || '\u2014'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><IconUsers size={20} /></div>
                <p className={styles.emptyText}>{search ? 'No guests match your search' : 'No guests in database'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Guest Detail */}
        {selectedGuest && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <span className={styles.detailTitle}>Guest Profile</span>
              <button className={styles.closeBtn} onClick={() => { setSelectedGuest(null); setGuestReservations([]); }}>
                <IconX size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255 255 255 / 0.04)' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 10,
                background: 'rgba(212,168,75,0.12)', color: 'var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600, fontSize: '1.2rem', margin: '0 auto 12px',
              }}>
                {selectedGuest.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>
                {selectedGuest.name}
              </div>
              {selectedGuest.visit_count > 5 && (
                <span className={`${styles.statusBadge} ${styles.statusConfirmed}`} style={{ gap: 4, display: 'inline-flex', alignItems: 'center' }}>
                  <IconStar size={10} /> VIP
                </span>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Email</span><span className={styles.detailValue}>{selectedGuest.email || '\u2014'}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Phone</span><span className={styles.detailValue}>{selectedGuest.phone || '\u2014'}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Total Visits</span><span className={styles.detailValue}>{selectedGuest.visit_count}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Last Visit</span><span className={styles.detailValue}>{selectedGuest.last_visit ? new Date(selectedGuest.last_visit).toLocaleDateString() : '\u2014'}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Since</span><span className={styles.detailValue}>{new Date(selectedGuest.created_at).toLocaleDateString()}</span></div>
              {selectedGuest.notes && <div className={styles.detailRow}><span className={styles.detailLabel}>Notes</span><span className={styles.detailValue}>{selectedGuest.notes}</span></div>}
            </div>

            {/* Reservation History */}
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCalendar size={14} /> Reservation History
            </div>
            {guestReservations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {guestReservations.map(r => (
                  <div key={r.id} style={{
                    padding: '10px 14px',
                    background: 'rgba(255 255 255 / 0.02)',
                    border: '1px solid rgba(255 255 255 / 0.04)',
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{r.date} at {r.time}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255 255 255 / 0.3)' }}>
                        {r.party_size} guests{r.occasion ? ` \u00b7 ${r.occasion}` : ''}
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[statusKey(r.status)]}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'rgba(255 255 255 / 0.2)', fontSize: '0.82rem' }}>No reservation history</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
