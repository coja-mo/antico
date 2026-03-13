'use client';
import { useState, useEffect } from 'react';
import { IconSearch, IconChevronRight, IconDollarSign, IconCreditCard, IconClock } from '@/components/Icons';
import styles from '../admin.module.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => { loadOrders(); }, [dateFilter, search]);

  async function loadOrders() {
    setLoading(true);
    const res = await fetch('/api/orders');
    let data = await res.json();

    // Apply filters
    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === 'today') {
      data = data.filter(o => (o.closed_at || o.created_at || '').startsWith(today));
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      data = data.filter(o => (o.closed_at || o.created_at) >= weekAgo);
    }

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(o => (o.guest_name || '').toLowerCase().includes(s) || String(o.table_number).includes(s));
    }

    setOrders(data);
    setLoading(false);
  }

  const totalRevenue = orders.filter(o => o.status === 'closed').reduce((s, o) => s + (o.total || 0), 0);
  const avgCheck = orders.filter(o => o.status === 'closed').length > 0
    ? totalRevenue / orders.filter(o => o.status === 'closed').length : 0;
  const totalTips = orders.filter(o => o.status === 'closed').reduce((s, o) => s + (o.tip || 0), 0);
  const closedCount = orders.filter(o => o.status === 'closed').length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Order History</h1>
        <p className={styles.pageSubtitle}>Track revenue, orders, and service performance</p>
      </div>

      {/* Revenue Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Revenue</span>
            <span className={styles.statIcon}><IconDollarSign size={15} /></span>
          </div>
          <div className={styles.statValue}>${totalRevenue.toFixed(2)}</div>
          <div className={styles.statSub}>{closedCount} closed orders</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Average Check</span>
            <span className={styles.statIcon}><IconCreditCard size={15} /></span>
          </div>
          <div className={styles.statValue}>${avgCheck.toFixed(2)}</div>
          <div className={styles.statSub}>Per order</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total Tips</span>
            <span className={styles.statIcon}><IconDollarSign size={15} /></span>
          </div>
          <div className={styles.statValue}>${totalTips.toFixed(2)}</div>
          <div className={styles.statSub}>{closedCount > 0 ? `${(totalTips / closedCount).toFixed(2)} avg` : 'N/A'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Open Orders</span>
            <span className={styles.statIcon}><IconClock size={15} /></span>
          </div>
          <div className={styles.statValue}>{orders.filter(o => o.status === 'open').length}</div>
          <div className={styles.statSub}>Currently active</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <IconSearch size={15} />
          <input className={styles.searchInput} placeholder="Search by guest or table..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['today', 'week', 'all'].map(f => (
          <button key={f} className={`${styles.filterBtn} ${dateFilter === f ? styles.filterBtnActive : ''}`} onClick={() => setDateFilter(f)}>
            {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className={styles.cardSection}>
        <div className={styles.cardSectionContent}>
          {orders.length > 0 ? (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Table</th>
                  <th>Guest</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <>
                    <tr key={o.id} onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)} style={{ cursor: 'pointer' }}>
                      <td className={styles.cellPrimary}>#{o.id}</td>
                      <td>{o.table_number ? `T${o.table_number}` : '—'}</td>
                      <td>{o.guest_name || '—'}</td>
                      <td>{o.item_count || '—'}</td>
                      <td className={styles.cellPrimary}>{o.total ? `$${o.total.toFixed(2)}` : '—'}</td>
                      <td>{o.payment_method || '—'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${o.status.charAt(0).toUpperCase() + o.status.slice(1)}`]}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className={styles.cellMuted}>
                        {new Date(o.closed_at || o.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </td>
                    </tr>
                    {expandedOrder === o.id && o.items && (
                      <tr key={`${o.id}-detail`}>
                        <td colSpan={8} style={{ padding: '12px 16px', background: 'rgba(255 255 255 / 0.015)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                              {o.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.78rem', color: item.status === 'voided' ? 'rgba(248,113,113,0.5)' : 'rgba(255 255 255 / 0.5)' }}>
                                  <span style={{ textDecoration: item.status === 'voided' ? 'line-through' : 'none' }}>
                                    {item.quantity}× {item.name}
                                    {item.notes && <span style={{ color: '#fbbf24', fontStyle: 'italic', marginLeft: 4 }}>({item.notes})</span>}
                                  </span>
                                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255 255 255 / 0.35)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Subtotal</span><span>${o.subtotal?.toFixed(2)}</span></div>
                              {o.discount_amount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--gold)' }}><span>Discount{o.discount_reason ? ` (${o.discount_reason})` : ''}</span><span>-${o.discount_amount.toFixed(2)}</span></div>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Tax</span><span>${o.tax?.toFixed(2)}</span></div>
                              {o.tip > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Tip</span><span>${o.tip.toFixed(2)}</span></div>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: 600, color: 'var(--text-primary)' }}><span>Total</span><span>${o.total?.toFixed(2)}</span></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><IconSearch size={20} /></div>
              <p className={styles.emptyText}>{loading ? 'Loading orders...' : 'No orders found'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
