'use client';
import { useState, useEffect } from 'react';
import { IconBarChart, IconDollarSign, IconUsers, IconTrendingUp, IconCalendar, IconClock, IconStar } from '@/components/Icons';
import styles from '../admin.module.css';

export default function AnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [ordersRes, resosRes, guestsRes] = await Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/reservations').then(r => r.json()),
      fetch('/api/guests').then(r => r.json()),
    ]);
    setOrders(ordersRes);
    setReservations(resosRes);
    setGuests(guestsRes);
    setLoading(false);
  }

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const closedOrders = orders.filter(o => o.status === 'closed');
  const todayOrders = closedOrders.filter(o => (o.closed_at || '').startsWith(today));
  const weekOrders = closedOrders.filter(o => (o.closed_at || '') >= weekAgo);
  const monthOrders = closedOrders.filter(o => (o.closed_at || '') >= monthAgo);

  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const weekRevenue = weekOrders.reduce((s, o) => s + (o.total || 0), 0);
  const monthRevenue = monthOrders.reduce((s, o) => s + (o.total || 0), 0);
  const allTimeRevenue = closedOrders.reduce((s, o) => s + (o.total || 0), 0);

  const avgCheck = closedOrders.length > 0 ? allTimeRevenue / closedOrders.length : 0;
  const avgTip = closedOrders.length > 0 ? closedOrders.reduce((s, o) => s + (o.tip || 0), 0) / closedOrders.length : 0;

  // Top selling items
  const itemCounts = {};
  closedOrders.forEach(o => {
    (o.items || []).forEach(item => {
      if (item.status !== 'voided') {
        if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, count: 0, revenue: 0 };
        itemCounts[item.name].count += item.quantity;
        itemCounts[item.name].revenue += item.price * item.quantity;
      }
    });
  });
  const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 10);
  const maxItemCount = topItems.length > 0 ? topItems[0].count : 1;

  // Daily revenue for the last 7 days
  const dailyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const rev = closedOrders.filter(o => (o.closed_at || '').startsWith(dateStr)).reduce((s, o) => s + (o.total || 0), 0);
    dailyRevenue.push({ day: dayName, date: dateStr, revenue: rev });
  }
  const maxDailyRev = Math.max(...dailyRevenue.map(d => d.revenue), 1);

  // Peak hours (hour of day analysis)
  const hourCounts = new Array(24).fill(0);
  closedOrders.forEach(o => {
    if (o.closed_at) {
      const h = new Date(o.closed_at).getHours();
      hourCounts[h]++;
    }
  });
  const maxHourCount = Math.max(...hourCounts, 1);

  // Daily covers from reservations
  const dailyCovers = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const covers = reservations.filter(r => r.date === dateStr && ['confirmed', 'seated', 'completed'].includes(r.status))
      .reduce((s, r) => s + (r.party_size || 0), 0);
    dailyCovers.push({ day: dayName, covers });
  }
  const maxCovers = Math.max(...dailyCovers.map(d => d.covers), 1);

  // Guest growth
  const vipCount = guests.filter(g => g.visit_count > 5).length;
  const newThisMonth = guests.filter(g => g.created_at >= monthAgo).length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Analytics</h1>
        <p className={styles.pageSubtitle}>Revenue insights, trends, and performance metrics</p>
      </div>

      {/* Revenue Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Today</span>
            <span className={styles.statIcon}><IconDollarSign size={15} /></span>
          </div>
          <div className={styles.statValue}>${todayRevenue.toFixed(2)}</div>
          <div className={styles.statSub}>{todayOrders.length} orders</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>This Week</span>
            <span className={styles.statIcon}><IconTrendingUp size={15} /></span>
          </div>
          <div className={styles.statValue}>${weekRevenue.toFixed(2)}</div>
          <div className={styles.statSub}>{weekOrders.length} orders</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>This Month</span>
            <span className={styles.statIcon}><IconBarChart size={15} /></span>
          </div>
          <div className={styles.statValue}>${monthRevenue.toFixed(2)}</div>
          <div className={styles.statSub}>{monthOrders.length} orders</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Avg Check</span>
            <span className={styles.statIcon}><IconDollarSign size={15} /></span>
          </div>
          <div className={styles.statValue}>${avgCheck.toFixed(2)}</div>
          <div className={styles.statSub}>${avgTip.toFixed(2)} avg tip</div>
        </div>
      </div>

      {/* Two-Column Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Daily Revenue Chart */}
        <div className={styles.cardSection}>
          <div className={styles.cardSectionHeader}>
            <span className={styles.cardSectionTitle}>Daily Revenue (Last 7 Days)</span>
          </div>
          <div className={styles.cardSectionContent} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}>
              {dailyRevenue.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255 255 255 / 0.4)' }}>
                    {d.revenue > 0 ? `$${d.revenue.toFixed(0)}` : ''}
                  </span>
                  <div style={{
                    width: '100%', borderRadius: 4,
                    height: `${Math.max(4, (d.revenue / maxDailyRev) * 100)}%`,
                    background: d.date === today
                      ? 'linear-gradient(to top, rgba(212,168,75,0.6), rgba(212,168,75,0.2))'
                      : 'linear-gradient(to top, rgba(255 255 255 / 0.15), rgba(255 255 255 / 0.05))',
                    transition: 'height 0.3s ease',
                  }} />
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255 255 255 / 0.35)' }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Covers */}
        <div className={styles.cardSection}>
          <div className={styles.cardSectionHeader}>
            <span className={styles.cardSectionTitle}>Daily Covers (Last 7 Days)</span>
          </div>
          <div className={styles.cardSectionContent} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}>
              {dailyCovers.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255 255 255 / 0.4)' }}>
                    {d.covers > 0 ? d.covers : ''}
                  </span>
                  <div style={{
                    width: '100%', borderRadius: 4,
                    height: `${Math.max(4, (d.covers / maxCovers) * 100)}%`,
                    background: 'linear-gradient(to top, rgba(59,130,246,0.5), rgba(59,130,246,0.15))',
                    transition: 'height 0.3s ease',
                  }} />
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255 255 255 / 0.35)' }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Items + Peak Hours + Guest Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Top Selling Items */}
        <div className={styles.cardSection}>
          <div className={styles.cardSectionHeader}>
            <span className={styles.cardSectionTitle}>Top Selling Items</span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255 255 255 / 0.3)' }}>All time</span>
          </div>
          <div className={styles.cardSectionContent} style={{ padding: topItems.length > 0 ? 0 : 20 }}>
            {topItems.length > 0 ? (
              <div style={{ padding: '12px 20px' }}>
                {topItems.map((item, i) => (
                  <div key={item.name} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 0', borderBottom: i < topItems.length - 1 ? '1px solid rgba(255 255 255 / 0.04)' : 'none',
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 4,
                      background: i < 3 ? 'rgba(212,168,75,0.15)' : 'rgba(255 255 255 / 0.04)',
                      color: i < 3 ? 'var(--gold)' : 'rgba(255 255 255 / 0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 600, flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255 255 255 / 0.4)', flexShrink: 0 }}>
                          {item.count} sold · ${item.revenue.toFixed(0)}
                        </span>
                      </div>
                      <div style={{
                        height: 3, borderRadius: 2,
                        background: 'rgba(255 255 255 / 0.06)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${(item.count / maxItemCount) * 100}%`,
                          background: i < 3 ? 'var(--gold)' : 'rgba(255 255 255 / 0.2)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>No order data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Guest Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.cardSection}>
            <div className={styles.cardSectionHeader}>
              <span className={styles.cardSectionTitle}>Guest Overview</span>
            </div>
            <div className={styles.cardSectionContent} style={{ padding: 20 }}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconUsers size={13} /> Total Guests
                </span>
                <span className={styles.detailValue}>{guests.length}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconStar size={13} /> VIP Guests (5+ visits)
                </span>
                <span className={styles.detailValue} style={{ color: 'var(--gold)' }}>{vipCount}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconCalendar size={13} /> New This Month
                </span>
                <span className={styles.detailValue}>{newThisMonth}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconCalendar size={13} /> Total Reservations
                </span>
                <span className={styles.detailValue}>{reservations.length}</span>
              </div>
            </div>
          </div>

          {/* Peak Hours */}
          <div className={styles.cardSection}>
            <div className={styles.cardSectionHeader}>
              <span className={styles.cardSectionTitle}>Peak Hours</span>
            </div>
            <div className={styles.cardSectionContent} style={{ padding: 20 }}>
              {closedOrders.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 80 }}>
                  {hourCounts.slice(11, 23).map((count, i) => {
                    const hour = i + 11;
                    const label = hour > 12 ? `${hour - 12}p` : hour === 12 ? '12p' : `${hour}a`;
                    return (
                      <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{
                          width: '100%', borderRadius: 2,
                          height: `${Math.max(2, (count / maxHourCount) * 100)}%`,
                          background: count > maxHourCount * 0.7
                            ? 'rgba(212,168,75,0.5)'
                            : count > maxHourCount * 0.3
                            ? 'rgba(255 255 255 / 0.15)'
                            : 'rgba(255 255 255 / 0.06)',
                        }} />
                        <span style={{ fontSize: '0.5rem', color: 'rgba(255 255 255 / 0.25)' }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'rgba(255 255 255 / 0.25)', textAlign: 'center' }}>No data yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className={styles.cardSection}>
        <div className={styles.cardSectionHeader}>
          <span className={styles.cardSectionTitle}>Revenue Summary</span>
        </div>
        <div className={styles.cardSectionContent} style={{ padding: 4 }}>
          <div className={styles.detailRow} style={{ padding: '14px 20px' }}>
            <span className={styles.detailLabel}>All-Time Revenue</span>
            <span className={styles.detailValue} style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>${allTimeRevenue.toFixed(2)}</span>
          </div>
          <div className={styles.detailRow} style={{ padding: '14px 20px' }}>
            <span className={styles.detailLabel}>Total Orders</span>
            <span className={styles.detailValue}>{closedOrders.length}</span>
          </div>
          <div className={styles.detailRow} style={{ padding: '14px 20px' }}>
            <span className={styles.detailLabel}>Total Tips</span>
            <span className={styles.detailValue}>${closedOrders.reduce((s, o) => s + (o.tip || 0), 0).toFixed(2)}</span>
          </div>
          <div className={styles.detailRow} style={{ padding: '14px 20px' }}>
            <span className={styles.detailLabel}>Average Check Size</span>
            <span className={styles.detailValue}>${avgCheck.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
