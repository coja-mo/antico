'use client';
import { useState, useEffect } from 'react';
import { IconSearch, IconCheck, IconX, IconClock, IconChevronRight, IconMessageSquare } from '@/components/Icons';
import styles from '../admin.module.css';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReservations(); }, [filter, search]);

  async function loadReservations() {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/reservations?${params}`);
    setReservations(await res.json());
    setLoading(false);
  }

  async function loadDetail(id) {
    const res = await fetch(`/api/reservations/${id}`);
    setDetail(await res.json());
    setSelected(id);
  }

  async function updateStatus(id, status) {
    await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadReservations();
    if (selected === id) loadDetail(id);
  }

  async function sendMessage(id) {
    if (!replyText.trim()) return;
    await fetch(`/api/reservations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'staff', content: replyText }),
    });
    setReplyText('');
    loadDetail(id);
  }

  const filters = ['all', 'pending', 'confirmed', 'declined', 'waitlisted', 'completed', 'cancelled'];
  const statusKey = (s) => `status${s.charAt(0).toUpperCase() + s.slice(1)}`;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Reservations</h1>
        <p className={styles.pageSubtitle}>Manage requests, confirm bookings, communicate with guests</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <IconSearch size={15} />
          <input className={styles.searchInput} placeholder="Search by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filters.map(f => (
          <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className={`${styles.splitLayout} ${selected ? styles.splitLayoutOpen : ''}`}>
        {/* List */}
        <div className={styles.cardSection}>
          <div className={styles.cardSectionContent}>
            {reservations.length > 0 ? (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Party</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id} onClick={() => loadDetail(r.id)} style={{ cursor: 'pointer', background: selected === r.id ? 'rgba(212,168,75,0.03)' : undefined }}>
                      <td>
                        <div className={styles.cellPrimary}>{r.guest_name}</div>
                        <div className={styles.cellMuted}>{r.phone}</div>
                      </td>
                      <td>{r.date}</td>
                      <td>{r.time}</td>
                      <td>{r.party_size}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[statusKey(r.status)]}`}>{r.status}</span>
                      </td>
                      <td>
                        <div className={styles.actions} onClick={e => e.stopPropagation()}>
                          {r.status === 'pending' && (
                            <>
                              <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={() => updateStatus(r.id, 'confirmed')}>
                                <IconCheck size={13} />
                              </button>
                              <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => updateStatus(r.id, 'declined')}>
                                <IconX size={13} />
                              </button>
                            </>
                          )}
                          {r.status === 'confirmed' && (
                            <button className={`${styles.actionBtn} ${styles.actionBtnDefault}`} onClick={() => updateStatus(r.id, 'completed')}>
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><IconSearch size={20} /></div>
                <p className={styles.emptyText}>No reservations found</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && detail && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <span className={styles.detailTitle}>Reservation #{detail.id}</span>
              <button className={styles.closeBtn} onClick={() => { setSelected(null); setDetail(null); }}>
                <IconX size={16} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Guest</span><span className={styles.detailValue}>{detail.guest_name}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Email</span><span className={styles.detailValue}>{detail.email}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Phone</span><span className={styles.detailValue}>{detail.phone}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Date</span><span className={styles.detailValue}>{detail.date}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Time</span><span className={styles.detailValue}>{detail.time}</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Party</span><span className={styles.detailValue}>{detail.party_size} guests</span></div>
              <div className={styles.detailRow}><span className={styles.detailLabel}>Occasion</span><span className={styles.detailValue}>{detail.occasion || '\u2014'}</span></div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status</span>
                <span className={`${styles.statusBadge} ${styles[statusKey(detail.status)]}`}>{detail.status}</span>
              </div>
              {detail.notes && <div className={styles.detailRow}><span className={styles.detailLabel}>Notes</span><span className={styles.detailValue}>{detail.notes}</span></div>}
            </div>

            {/* Actions */}
            <div className={styles.actions} style={{ marginBottom: 20 }}>
              {detail.status === 'pending' && (
                <>
                  <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={() => updateStatus(detail.id, 'confirmed')}>
                    <IconCheck size={13} /> Confirm
                  </button>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDefault}`} onClick={() => updateStatus(detail.id, 'waitlisted')}>
                    <IconClock size={13} /> Waitlist
                  </button>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => updateStatus(detail.id, 'declined')}>
                    <IconX size={13} /> Decline
                  </button>
                </>
              )}
              {detail.status === 'confirmed' && (
                <>
                  <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={() => updateStatus(detail.id, 'completed')}>
                    <IconCheck size={13} /> Complete
                  </button>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => updateStatus(detail.id, 'cancelled')}>
                    <IconX size={13} /> Cancel
                  </button>
                </>
              )}
              {detail.status === 'waitlisted' && (
                <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={() => updateStatus(detail.id, 'confirmed')}>
                  <IconCheck size={13} /> Confirm
                </button>
              )}
            </div>

            {/* Messages */}
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconMessageSquare size={14} /> Communication
            </div>
            <div className={styles.messageThread}>
              {detail.messages?.length > 0 ? detail.messages.map(m => (
                <div key={m.id} className={`${styles.message} ${styles[`message${m.sender.charAt(0).toUpperCase() + m.sender.slice(1)}`]}`}>
                  <div className={styles.messageSender}>{m.sender}</div>
                  <div className={styles.messageContent}>{m.content}</div>
                  <div className={styles.messageTime}>{new Date(m.created_at).toLocaleString()}</div>
                </div>
              )) : (
                <p style={{ color: 'rgba(255 255 255 / 0.2)', textAlign: 'center', padding: 20, fontSize: '0.82rem' }}>No messages</p>
              )}
            </div>
            <div className={styles.replyBox}>
              <input placeholder="Message guest..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage(detail.id)} />
              <button className={`${styles.actionBtn} ${styles.actionBtnGold}`} onClick={() => sendMessage(detail.id)}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
