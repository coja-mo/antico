'use client';
import { useState, useEffect, useRef } from 'react';
import { IconPrinter, IconCalendar, IconDollarSign, IconUsers, IconTrendingUp, IconClock, IconBarChart } from '@/components/Icons';
import styles from '../admin.module.css';

const REPORT_TYPES = [
  { key: 'daily', label: 'Daily Summary', description: 'End-of-day revenue, orders, covers, and tips breakdown' },
  { key: 'weekly', label: 'Weekly Performance', description: 'Week-over-week revenue, average check, and trends' },
  { key: 'server', label: 'Server Performance', description: 'Revenue, orders, and tips per server' },
  { key: 'menu', label: 'Menu Analysis', description: 'Item sales rankings, revenue by category, and 86\'d items' },
  { key: 'reservation', label: 'Reservation Report', description: 'Booking volume, no-shows, cancellation rate, peak times' },
  { key: 'guest', label: 'Guest Intelligence', description: 'VIP guests, visit frequency, new guest acquisition' },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('daily');
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [o, r, g, m] = await Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/reservations').then(r => r.json()),
      fetch('/api/guests').then(r => r.json()),
      fetch('/api/menu?all=1').then(r => r.json()),
    ]);
    setOrders(o); setReservations(r); setGuests(g); setMenuItems(m);
    setLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  const today = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className={styles.pageTitle}>Reports</h1>
          <p className={styles.pageSubtitle}>Printable management reports with Antico branding</p>
        </div>
        <button className={`${styles.actionBtn} ${styles.actionBtnGold}`} onClick={handlePrint}>
          <IconPrinter size={14} /> Print Report
        </button>
      </div>

      {/* Report Type Selector */}
      <div className={styles.toolbar} style={{ flexWrap: 'wrap' }}>
        {REPORT_TYPES.map(rt => (
          <button key={rt.key}
            className={`${styles.filterBtn} ${activeReport === rt.key ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveReport(rt.key)}
          >
            {rt.label}
          </button>
        ))}
      </div>

      {/* Printable Report Area */}
      <div ref={printRef} className="printable-report">
        <style>{printStyles}</style>

        {/* Report Header (visible in print) */}
        <div className="report-header">
          <div className="report-brand">
            <div className="report-brand-name">ANTICO</div>
            <div className="report-brand-sub">RISTORANTÉ</div>
          </div>
          <div className="report-meta">
            <div className="report-title">{REPORT_TYPES.find(r => r.key === activeReport)?.label}</div>
            <div className="report-date">{todayDisplay}</div>
            <div className="report-location">531 Queen Street East · Sault Ste. Marie, ON</div>
          </div>
        </div>

        <div className="report-divider" />

        {/* Report Content */}
        {activeReport === 'daily' && <DailySummaryReport orders={orders} reservations={reservations} today={today} />}
        {activeReport === 'weekly' && <WeeklyReport orders={orders} reservations={reservations} />}
        {activeReport === 'server' && <ServerReport orders={orders} />}
        {activeReport === 'menu' && <MenuReport orders={orders} menuItems={menuItems} />}
        {activeReport === 'reservation' && <ReservationReport reservations={reservations} />}
        {activeReport === 'guest' && <GuestReport guests={guests} reservations={reservations} />}

        {/* Report Footer */}
        <div className="report-footer">
          <div className="report-footer-line" />
          <div className="report-footer-text">
            <span>Antico Ristoranté · Confidential Management Report</span>
            <span>Generated {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DAILY SUMMARY REPORT
   ═══════════════════════════════════════════════════════════ */
function DailySummaryReport({ orders, reservations, today }) {
  const closed = orders.filter(o => o.status === 'closed' && (o.closed_at || '').startsWith(today));
  const open = orders.filter(o => o.status === 'open');
  const todayResos = reservations.filter(r => r.date === today);

  const revenue = closed.reduce((s, o) => s + (o.total || 0), 0);
  const subtotals = closed.reduce((s, o) => s + (o.subtotal || 0), 0);
  const tax = closed.reduce((s, o) => s + (o.tax || 0), 0);
  const tips = closed.reduce((s, o) => s + (o.tip || 0), 0);
  const discounts = closed.reduce((s, o) => s + (o.discount_amount || 0), 0);
  const avgCheck = closed.length > 0 ? revenue / closed.length : 0;

  const covers = todayResos.reduce((s, r) => s + (r.party_size || 0), 0);
  const cardPayments = closed.filter(o => o.payment_method === 'card').length;
  const cashPayments = closed.filter(o => o.payment_method === 'cash').length;

  // Revenue by payment method
  const cardRevenue = closed.filter(o => o.payment_method === 'card').reduce((s, o) => s + (o.total || 0), 0);
  const cashRevenue = closed.filter(o => o.payment_method === 'cash').reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="report-body">
      <h3 className="report-section-title">Revenue Summary</h3>
      <table className="report-table">
        <tbody>
          <tr><td>Gross Sales (Food & Beverage)</td><td className="report-amount">${subtotals.toFixed(2)}</td></tr>
          {discounts > 0 && <tr><td>Discounts / Comps</td><td className="report-amount" style={{ color: '#c0392b' }}>-${discounts.toFixed(2)}</td></tr>}
          <tr><td>HST (13%)</td><td className="report-amount">${tax.toFixed(2)}</td></tr>
          <tr><td>Tips Collected</td><td className="report-amount">${tips.toFixed(2)}</td></tr>
          <tr className="report-total-row"><td><strong>Total Revenue</strong></td><td className="report-amount"><strong>${revenue.toFixed(2)}</strong></td></tr>
        </tbody>
      </table>

      <h3 className="report-section-title">Service Metrics</h3>
      <table className="report-table">
        <tbody>
          <tr><td>Total Orders Closed</td><td className="report-amount">{closed.length}</td></tr>
          <tr><td>Orders Still Open</td><td className="report-amount">{open.length}</td></tr>
          <tr><td>Average Check Size</td><td className="report-amount">${avgCheck.toFixed(2)}</td></tr>
          <tr><td>Average Tip</td><td className="report-amount">${closed.length > 0 ? (tips / closed.length).toFixed(2) : '0.00'}</td></tr>
          <tr><td>Tip Rate</td><td className="report-amount">{subtotals > 0 ? ((tips / subtotals) * 100).toFixed(1) : '0.0'}%</td></tr>
        </tbody>
      </table>

      <h3 className="report-section-title">Payment Method Breakdown</h3>
      <table className="report-table">
        <thead><tr><th>Method</th><th>Count</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>Credit / Debit Card</td><td className="report-amount">{cardPayments}</td><td className="report-amount">${cardRevenue.toFixed(2)}</td></tr>
          <tr><td>Cash</td><td className="report-amount">{cashPayments}</td><td className="report-amount">${cashRevenue.toFixed(2)}</td></tr>
          <tr><td>Other</td><td className="report-amount">{closed.length - cardPayments - cashPayments}</td><td className="report-amount">${(revenue - cardRevenue - cashRevenue).toFixed(2)}</td></tr>
        </tbody>
      </table>

      <h3 className="report-section-title">Reservation Overview</h3>
      <table className="report-table">
        <tbody>
          <tr><td>Total Reservations</td><td className="report-amount">{todayResos.length}</td></tr>
          <tr><td>Total Covers</td><td className="report-amount">{covers}</td></tr>
          <tr><td>Confirmed</td><td className="report-amount">{todayResos.filter(r => r.status === 'confirmed').length}</td></tr>
          <tr><td>Completed</td><td className="report-amount">{todayResos.filter(r => r.status === 'completed').length}</td></tr>
          <tr><td>No-Shows / Cancelled</td><td className="report-amount">{todayResos.filter(r => ['cancelled', 'declined'].includes(r.status)).length}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WEEKLY PERFORMANCE REPORT
   ═══════════════════════════════════════════════════════════ */
function WeeklyReport({ orders, reservations }) {
  const closed = orders.filter(o => o.status === 'closed');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = closed.filter(o => (o.closed_at || '').startsWith(dateStr));
    const dayResos = reservations.filter(r => r.date === dateStr);
    const rev = dayOrders.reduce((s, o) => s + (o.total || 0), 0);
    const tips = dayOrders.reduce((s, o) => s + (o.tip || 0), 0);
    const covers = dayResos.reduce((s, r) => s + (r.party_size || 0), 0);
    days.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      orders: dayOrders.length, revenue: rev, tips, covers,
      avgCheck: dayOrders.length > 0 ? rev / dayOrders.length : 0,
    });
  }

  const totalRev = days.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = days.reduce((s, d) => s + d.orders, 0);
  const totalTips = days.reduce((s, d) => s + d.tips, 0);
  const totalCovers = days.reduce((s, d) => s + d.covers, 0);

  return (
    <div className="report-body">
      <h3 className="report-section-title">7-Day Performance Summary</h3>
      <table className="report-table">
        <thead>
          <tr><th>Day</th><th>Orders</th><th>Revenue</th><th>Tips</th><th>Avg Check</th><th>Covers</th></tr>
        </thead>
        <tbody>
          {days.map((d, i) => (
            <tr key={i}>
              <td>{d.date}</td>
              <td className="report-amount">{d.orders}</td>
              <td className="report-amount">${d.revenue.toFixed(2)}</td>
              <td className="report-amount">${d.tips.toFixed(2)}</td>
              <td className="report-amount">${d.avgCheck.toFixed(2)}</td>
              <td className="report-amount">{d.covers}</td>
            </tr>
          ))}
          <tr className="report-total-row">
            <td><strong>Total</strong></td>
            <td className="report-amount"><strong>{totalOrders}</strong></td>
            <td className="report-amount"><strong>${totalRev.toFixed(2)}</strong></td>
            <td className="report-amount"><strong>${totalTips.toFixed(2)}</strong></td>
            <td className="report-amount"><strong>${totalOrders > 0 ? (totalRev / totalOrders).toFixed(2) : '0.00'}</strong></td>
            <td className="report-amount"><strong>{totalCovers}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3 className="report-section-title">Weekly Averages</h3>
      <table className="report-table">
        <tbody>
          <tr><td>Daily Average Revenue</td><td className="report-amount">${(totalRev / 7).toFixed(2)}</td></tr>
          <tr><td>Daily Average Orders</td><td className="report-amount">{(totalOrders / 7).toFixed(1)}</td></tr>
          <tr><td>Daily Average Covers</td><td className="report-amount">{(totalCovers / 7).toFixed(1)}</td></tr>
          <tr><td>Average Tip Rate</td><td className="report-amount">{totalRev > 0 ? ((totalTips / totalRev) * 100).toFixed(1) : '0.0'}%</td></tr>
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SERVER PERFORMANCE REPORT
   ═══════════════════════════════════════════════════════════ */
function ServerReport({ orders }) {
  const closed = orders.filter(o => o.status === 'closed');

  // Group by server (using table server_name from the order's table info)
  const serverMap = {};
  closed.forEach(o => {
    const server = o.server_name || 'Unassigned';
    if (!serverMap[server]) serverMap[server] = { name: server, orders: 0, revenue: 0, tips: 0, items: 0 };
    serverMap[server].orders++;
    serverMap[server].revenue += o.total || 0;
    serverMap[server].tips += o.tip || 0;
    serverMap[server].items += o.item_count || 0;
  });
  const servers = Object.values(serverMap).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="report-body">
      <h3 className="report-section-title">Server Performance Summary</h3>
      {servers.length > 0 ? (
        <table className="report-table">
          <thead>
            <tr><th>Server</th><th>Orders</th><th>Revenue</th><th>Tips</th><th>Avg Check</th><th>Tip Rate</th></tr>
          </thead>
          <tbody>
            {servers.map(s => (
              <tr key={s.name}>
                <td><strong>{s.name}</strong></td>
                <td className="report-amount">{s.orders}</td>
                <td className="report-amount">${s.revenue.toFixed(2)}</td>
                <td className="report-amount">${s.tips.toFixed(2)}</td>
                <td className="report-amount">${(s.revenue / s.orders).toFixed(2)}</td>
                <td className="report-amount">{s.revenue > 0 ? ((s.tips / s.revenue) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="report-empty">No server data available. Assign servers to tables to track performance.</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MENU ANALYSIS REPORT
   ═══════════════════════════════════════════════════════════ */
function MenuReport({ orders, menuItems }) {
  const closed = orders.filter(o => o.status === 'closed');

  // Item sales aggregation
  const itemMap = {};
  closed.forEach(o => {
    (o.items || []).forEach(item => {
      if (item.status !== 'voided') {
        if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
        itemMap[item.name].qty += item.quantity;
        itemMap[item.name].revenue += item.price * item.quantity;
      }
    });
  });
  const rankedItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty);

  // Revenue by category
  const catRevenue = {};
  closed.forEach(o => {
    (o.items || []).forEach(item => {
      if (item.status !== 'voided') {
        const mi = menuItems.find(m => m.name === item.name);
        const cat = mi?.category || 'other';
        if (!catRevenue[cat]) catRevenue[cat] = { category: cat, revenue: 0, count: 0 };
        catRevenue[cat].revenue += item.price * item.quantity;
        catRevenue[cat].count += item.quantity;
      }
    });
  });
  const categories = Object.values(catRevenue).sort((a, b) => b.revenue - a.revenue);

  // 86'd items
  const unavailable = menuItems.filter(m => !m.available);

  return (
    <div className="report-body">
      <h3 className="report-section-title">Revenue by Category</h3>
      <table className="report-table">
        <thead><tr><th>Category</th><th>Items Sold</th><th>Revenue</th><th>% of Total</th></tr></thead>
        <tbody>
          {categories.map(c => {
            const totalCatRev = categories.reduce((s, x) => s + x.revenue, 0);
            return (
              <tr key={c.category}>
                <td style={{ textTransform: 'capitalize' }}><strong>{c.category}</strong></td>
                <td className="report-amount">{c.count}</td>
                <td className="report-amount">${c.revenue.toFixed(2)}</td>
                <td className="report-amount">{totalCatRev > 0 ? ((c.revenue / totalCatRev) * 100).toFixed(1) : '0.0'}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3 className="report-section-title">Top 15 Best Sellers</h3>
      <table className="report-table">
        <thead><tr><th>#</th><th>Item</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
        <tbody>
          {rankedItems.slice(0, 15).map((item, i) => (
            <tr key={item.name}>
              <td>{i + 1}</td>
              <td><strong>{item.name}</strong></td>
              <td className="report-amount">{item.qty}</td>
              <td className="report-amount">${item.revenue.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {unavailable.length > 0 && (
        <>
          <h3 className="report-section-title">Currently 86&apos;d Items</h3>
          <table className="report-table">
            <thead><tr><th>Item</th><th>Category</th><th>Price</th></tr></thead>
            <tbody>
              {unavailable.map(m => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{m.category}</td>
                  <td className="report-amount">${parseFloat(m.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RESERVATION REPORT
   ═══════════════════════════════════════════════════════════ */
function ReservationReport({ reservations }) {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const weekResos = reservations.filter(r => r.date >= weekAgo && r.date <= today);
  const monthResos = reservations.filter(r => r.date >= monthAgo && r.date <= today);

  const statusCounts = (list) => ({
    total: list.length,
    confirmed: list.filter(r => r.status === 'confirmed').length,
    completed: list.filter(r => r.status === 'completed').length,
    seated: list.filter(r => r.status === 'seated').length,
    cancelled: list.filter(r => r.status === 'cancelled').length,
    declined: list.filter(r => r.status === 'declined').length,
    pending: list.filter(r => r.status === 'pending').length,
    covers: list.reduce((s, r) => s + (r.party_size || 0), 0),
    avgParty: list.length > 0 ? (list.reduce((s, r) => s + (r.party_size || 0), 0) / list.length).toFixed(1) : '0',
  });

  const week = statusCounts(weekResos);
  const month = statusCounts(monthResos);
  const all = statusCounts(reservations);

  // Peak day analysis
  const dayCounts = {};
  reservations.forEach(r => {
    const d = new Date(r.date);
    const day = d.toLocaleDateString('en-US', { weekday: 'long' });
    if (!dayCounts[day]) dayCounts[day] = 0;
    dayCounts[day]++;
  });
  const peakDays = Object.entries(dayCounts).sort((a, b) => b[1] - a[1]);

  // Peak time analysis
  const timeCounts = {};
  reservations.forEach(r => {
    const hour = r.time?.split(':')[0];
    if (hour) {
      const h = parseInt(hour);
      const label = h > 12 ? `${h - 12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`;
      if (!timeCounts[label]) timeCounts[label] = 0;
      timeCounts[label]++;
    }
  });
  const peakTimes = Object.entries(timeCounts).sort((a, b) => b[1] - a[1]);

  // Occasions
  const occasions = {};
  reservations.filter(r => r.occasion).forEach(r => {
    if (!occasions[r.occasion]) occasions[r.occasion] = 0;
    occasions[r.occasion]++;
  });

  return (
    <div className="report-body">
      <h3 className="report-section-title">Reservation Volume</h3>
      <table className="report-table">
        <thead><tr><th>Period</th><th>Bookings</th><th>Covers</th><th>Avg Party</th><th>Completed</th><th>No-Show / Cancelled</th></tr></thead>
        <tbody>
          <tr>
            <td>Last 7 Days</td>
            <td className="report-amount">{week.total}</td>
            <td className="report-amount">{week.covers}</td>
            <td className="report-amount">{week.avgParty}</td>
            <td className="report-amount">{week.completed}</td>
            <td className="report-amount">{week.cancelled + week.declined}</td>
          </tr>
          <tr>
            <td>Last 30 Days</td>
            <td className="report-amount">{month.total}</td>
            <td className="report-amount">{month.covers}</td>
            <td className="report-amount">{month.avgParty}</td>
            <td className="report-amount">{month.completed}</td>
            <td className="report-amount">{month.cancelled + month.declined}</td>
          </tr>
          <tr className="report-total-row">
            <td><strong>All Time</strong></td>
            <td className="report-amount"><strong>{all.total}</strong></td>
            <td className="report-amount"><strong>{all.covers}</strong></td>
            <td className="report-amount"><strong>{all.avgParty}</strong></td>
            <td className="report-amount"><strong>{all.completed}</strong></td>
            <td className="report-amount"><strong>{all.cancelled + all.declined}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3 className="report-section-title">Busiest Days</h3>
      <table className="report-table">
        <thead><tr><th>Day of Week</th><th>Total Reservations</th></tr></thead>
        <tbody>
          {peakDays.map(([day, count]) => (
            <tr key={day}><td>{day}</td><td className="report-amount">{count}</td></tr>
          ))}
        </tbody>
      </table>

      <h3 className="report-section-title">Peak Reservation Times</h3>
      <table className="report-table">
        <thead><tr><th>Time Slot</th><th>Bookings</th></tr></thead>
        <tbody>
          {peakTimes.slice(0, 8).map(([time, count]) => (
            <tr key={time}><td>{time}</td><td className="report-amount">{count}</td></tr>
          ))}
        </tbody>
      </table>

      {Object.keys(occasions).length > 0 && (
        <>
          <h3 className="report-section-title">Special Occasions</h3>
          <table className="report-table">
            <thead><tr><th>Occasion</th><th>Count</th></tr></thead>
            <tbody>
              {Object.entries(occasions).sort((a, b) => b[1] - a[1]).map(([occ, count]) => (
                <tr key={occ}><td>{occ}</td><td className="report-amount">{count}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GUEST INTELLIGENCE REPORT
   ═══════════════════════════════════════════════════════════ */
function GuestReport({ guests, reservations }) {
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const vips = guests.filter(g => g.visit_count > 5).sort((a, b) => b.visit_count - a.visit_count);
  const newGuests = guests.filter(g => g.created_at >= monthAgo);
  const totalVisits = guests.reduce((s, g) => s + (g.visit_count || 0), 0);
  const avgVisits = guests.length > 0 ? totalVisits / guests.length : 0;

  // Visit frequency distribution
  const freqBuckets = {
    '1 visit': guests.filter(g => g.visit_count === 1).length,
    '2-3 visits': guests.filter(g => g.visit_count >= 2 && g.visit_count <= 3).length,
    '4-5 visits': guests.filter(g => g.visit_count >= 4 && g.visit_count <= 5).length,
    '6-10 visits': guests.filter(g => g.visit_count >= 6 && g.visit_count <= 10).length,
    '10+ visits': guests.filter(g => g.visit_count > 10).length,
  };

  return (
    <div className="report-body">
      <h3 className="report-section-title">Guest Database Overview</h3>
      <table className="report-table">
        <tbody>
          <tr><td>Total Guest Profiles</td><td className="report-amount">{guests.length}</td></tr>
          <tr><td>VIP Guests (5+ visits)</td><td className="report-amount">{vips.length}</td></tr>
          <tr><td>New Guests (last 30 days)</td><td className="report-amount">{newGuests.length}</td></tr>
          <tr><td>Total Visits All Time</td><td className="report-amount">{totalVisits}</td></tr>
          <tr><td>Average Visits Per Guest</td><td className="report-amount">{avgVisits.toFixed(1)}</td></tr>
        </tbody>
      </table>

      <h3 className="report-section-title">Visit Frequency Distribution</h3>
      <table className="report-table">
        <thead><tr><th>Frequency</th><th>Guests</th><th>% of Total</th></tr></thead>
        <tbody>
          {Object.entries(freqBuckets).map(([label, count]) => (
            <tr key={label}>
              <td>{label}</td>
              <td className="report-amount">{count}</td>
              <td className="report-amount">{guests.length > 0 ? ((count / guests.length) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {vips.length > 0 && (
        <>
          <h3 className="report-section-title">Top VIP Guests</h3>
          <table className="report-table">
            <thead><tr><th>#</th><th>Guest Name</th><th>Email</th><th>Visits</th><th>Last Visit</th></tr></thead>
            <tbody>
              {vips.slice(0, 15).map((g, i) => (
                <tr key={g.id}>
                  <td>{i + 1}</td>
                  <td><strong>{g.name}</strong></td>
                  <td>{g.email || '\u2014'}</td>
                  <td className="report-amount">{g.visit_count}</td>
                  <td>{g.last_visit ? new Date(g.last_visit).toLocaleDateString() : '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRINT STYLES
   ═══════════════════════════════════════════════════════════ */
const printStyles = `
  @media print {
    /* Hide everything except the report */
    body * { visibility: hidden !important; }
    .printable-report, .printable-report * { visibility: visible !important; }
    .printable-report {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      padding: 40px !important;
      background: white !important;
      color: #1a1a1a !important;
    }
    /* Override dark theme colors for print */
    .report-body, .report-table, .report-table td, .report-table th,
    .report-section-title, .report-header, .report-meta, .report-footer-text {
      color: #1a1a1a !important;
      background: white !important;
    }
    .report-brand-name { color: #8B6914 !important; }
    .report-brand-sub { color: #666 !important; }
    .report-title { color: #1a1a1a !important; }
    .report-date, .report-location { color: #666 !important; }
    .report-divider { border-color: #ddd !important; }
    .report-table { border-color: #e5e5e5 !important; }
    .report-table th { background: #f5f5f5 !important; color: #333 !important; border-color: #e5e5e5 !important; }
    .report-table td { border-color: #e5e5e5 !important; color: #333 !important; }
    .report-total-row td { background: #f9f9f9 !important; border-top: 2px solid #ccc !important; }
    .report-footer-line { border-color: #ddd !important; }
    .report-footer-text span { color: #999 !important; }
  }

  /* Screen styles for preview */
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .report-brand-name {
    font-family: var(--font-heading, Georgia, serif);
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--gold, #d4a84b);
    line-height: 1;
  }
  .report-brand-sub {
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255 255 255 / 0.3);
    margin-top: 2px;
  }
  .report-meta { text-align: right; }
  .report-title {
    font-family: var(--font-heading, Georgia, serif);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary, #fff);
    margin-bottom: 2px;
  }
  .report-date {
    font-size: 0.82rem;
    color: rgba(255 255 255 / 0.5);
  }
  .report-location {
    font-size: 0.72rem;
    color: rgba(255 255 255 / 0.25);
    margin-top: 2px;
  }
  .report-divider {
    border: none;
    border-top: 1px solid rgba(255 255 255 / 0.08);
    margin: 0 0 20px;
  }
  .report-body { font-size: 0.85rem; }
  .report-section-title {
    font-family: var(--font-heading, Georgia, serif);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary, #fff);
    margin: 24px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255 255 255 / 0.06);
  }
  .report-section-title:first-child { margin-top: 0; }
  .report-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
  }
  .report-table th {
    padding: 8px 12px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255 255 255 / 0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: left;
    border-bottom: 1px solid rgba(255 255 255 / 0.08);
    background: rgba(255 255 255 / 0.02);
  }
  .report-table td {
    padding: 8px 12px;
    font-size: 0.82rem;
    border-bottom: 1px solid rgba(255 255 255 / 0.04);
    color: rgba(255 255 255 / 0.7);
  }
  .report-amount {
    text-align: right !important;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
  .report-total-row td {
    border-top: 2px solid rgba(212 168 75 / 0.2);
    background: rgba(212 168 75 / 0.03);
    color: var(--text-primary, #fff) !important;
  }
  .report-empty {
    font-size: 0.82rem;
    color: rgba(255 255 255 / 0.25);
    padding: 20px 0;
  }
  .report-footer {
    margin-top: 40px;
  }
  .report-footer-line {
    border: none;
    border-top: 1px solid rgba(255 255 255 / 0.06);
    margin-bottom: 10px;
  }
  .report-footer-text {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    color: rgba(255 255 255 / 0.2);
    letter-spacing: 0.02em;
  }
`;
