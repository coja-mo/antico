'use client';
import { useState, useEffect, useRef } from 'react';
import { IconRefresh, IconZap, IconCheck, IconFlame, IconClock } from '@/components/Icons';
import styles from '../admin.module.css';
import kdsStyles from './kds.module.css';

export default function KDSPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadKDS();
    intervalRef.current = setInterval(loadKDS, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  async function loadKDS() {
    try {
      const res = await fetch('/api/kds');
      setItems(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function bumpItem(itemId) {
    await fetch('/api/kds', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_id: itemId, action: 'bump' }) });
    loadKDS();
  }

  async function fireItem(itemId) {
    await fetch('/api/kds', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_id: itemId, action: 'fire' }) });
    loadKDS();
  }

  async function rushItem(itemId) {
    await fetch('/api/kds', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_id: itemId, action: 'rush' }) });
    loadKDS();
  }

  const orderGroups = {};
  items.forEach(item => {
    if (!orderGroups[item.order_id]) {
      orderGroups[item.order_id] = { order_id: item.order_id, table_number: item.table_number, table_name: item.table_name, guest_name: item.guest_name, items: [] };
    }
    orderGroups[item.order_id].items.push(item);
  });

  const orders = Object.values(orderGroups);

  function getTimeSince(dateStr) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  }

  return (
    <div className={kdsStyles.kdsPage}>
      <div className={kdsStyles.kdsHeader}>
        <div>
          <h1 className={styles.pageTitle}>Kitchen Display</h1>
          <p className={styles.pageSubtitle}>
            {items.length} items in queue &middot; Auto-refreshing
          </p>
        </div>
        <button className={`${styles.actionBtn} ${styles.actionBtnDefault}`} onClick={loadKDS}>
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><IconFlame size={20} /></div>
          <p className={styles.emptyText}>Kitchen is clear — no active orders</p>
        </div>
      ) : (
        <div className={kdsStyles.kdsGrid}>
          {orders.map(order => (
            <div key={order.order_id} className={kdsStyles.kdsCard}>
              <div className={kdsStyles.kdsCardHeader}>
                <div className={kdsStyles.kdsCardHeaderLeft}>
                  <span className={kdsStyles.kdsTableBadge}>Table {order.table_number || '?'}</span>
                  <span className={kdsStyles.kdsOrderId}>#{order.order_id}</span>
                </div>
                {order.guest_name && <span className={kdsStyles.kdsGuest}>{order.guest_name}</span>}
              </div>

              <div className={kdsStyles.kdsItems}>
                {order.items.map(item => (
                  <div key={item.id} className={`${kdsStyles.kdsItem} ${item.status === 'fired' ? kdsStyles.kdsItemFired : kdsStyles.kdsItemPending}`}>
                    <div className={kdsStyles.kdsItemInfo}>
                      <span className={kdsStyles.kdsItemQty}>{item.quantity}x</span>
                      <div>
                        <span className={kdsStyles.kdsItemName}>{item.name}</span>
                        {item.notes && <span className={kdsStyles.kdsItemNotes}>{item.notes}</span>}
                        {item.modifiers && <span className={kdsStyles.kdsItemMods}>{item.modifiers}</span>}
                      </div>
                    </div>
                    <div className={kdsStyles.kdsItemActions}>
                      {item.status === 'fired' && item.fired_at && (
                        <span className={kdsStyles.kdsTimer}>{getTimeSince(item.fired_at)}</span>
                      )}
                      {item.status === 'pending' && (
                        <button className={kdsStyles.fireBtn} onClick={() => fireItem(item.id)} title="Fire">
                          <IconFlame size={12} />
                        </button>
                      )}
                      {item.status === 'fired' && (
                        <>
                          <button className={kdsStyles.rushBtn} onClick={() => rushItem(item.id)} title="Rush">
                            <IconZap size={12} />
                          </button>
                          <button className={kdsStyles.bumpBtn} onClick={() => bumpItem(item.id)} title="Bump">
                            <IconCheck size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={kdsStyles.kdsCardFooter}>
                <span>{order.items.length} items</span>
                <span style={{ color: 'var(--warning)' }}>
                  {order.items.filter(i => i.status === 'fired').length} fired
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
