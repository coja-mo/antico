'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconCalendar, IconGrid, IconLogOut, IconSparkles, IconChevronRight } from '@/components/Icons';
import styles from '../account.module.css';

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/customer/me');
      if (!meRes.ok) { router.push('/account/login'); return; }
      const res = await fetch('/api/customer/orders');
      setOrders(await res.json());
      setLoading(false);
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/customer/me', { method: 'DELETE' });
    router.push('/account/login');
  };

  if (loading) return <div className={styles.loadingState}>Loading order history...</div>;

  return (
    <div className={styles.accountPage}>
      <div className={styles.accountHeader}>
        <p className={styles.accountGreeting}>La Storia</p>
        <h1 className={styles.accountTitle}>Order History</h1>
      </div>

      <nav className={styles.accountNav}>
        <Link href="/account" className={styles.accountNavLink}><IconGrid size={14} /> Dashboard</Link>
        <Link href="/account/reservations" className={styles.accountNavLink}><IconCalendar size={14} /> Reservations</Link>
        <Link href="/account/orders" className={`${styles.accountNavLink} ${styles.accountNavLinkActive}`}><IconSparkles size={14} /> Order History</Link>
        <button onClick={handleLogout} className={styles.logoutBtn}><IconLogOut size={13} /> Sign Out</button>
      </nav>

      <div className={styles.sectionCard}>
        <div className={styles.sectionBody}>
          {orders.length === 0 ? (
            <div className={styles.sectionEmpty}>
              <p>No orders yet. Your dining history will appear here.</p>
            </div>
          ) : orders.map(o => (
            <div key={o.id} className={styles.orderItem}>
              <div className={styles.orderItemHeader} onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
                <span className={styles.orderItemDate}>
                  {new Date(o.closed_at || o.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className={styles.orderItemTotal}>${o.total?.toFixed(2)}</span>
              </div>
              <div className={styles.orderItemMeta}>
                <span>{o.items?.length || 0} items</span>
                {o.table_number && <span>Table {o.table_number}</span>}
                <span>{o.payment_method}</span>
                <span style={{ cursor: 'pointer', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 2 }}
                  onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
                  {expandedOrder === o.id ? 'Hide' : 'Details'} <IconChevronRight size={10} />
                </span>
              </div>
              {expandedOrder === o.id && o.items && (
                <div className={styles.orderItemDetails}>
                  {o.items.map((item, i) => (
                    <div key={i} className={styles.orderDetailLine}>
                      <span>{item.quantity}× {item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className={styles.orderDetailLine}>
                    <span>Subtotal</span><span>${o.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className={styles.orderDetailLine}>
                    <span>Tax</span><span>${o.tax?.toFixed(2)}</span>
                  </div>
                  {o.tip > 0 && (
                    <div className={styles.orderDetailLine}>
                      <span>Tip</span><span>${o.tip?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={styles.orderTotalLine}>
                    <span>Total</span><span>${o.total?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
