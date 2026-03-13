'use client';
import { useState, useEffect, useRef } from 'react';
import { IconRefresh, IconZap, IconCheck, IconFlame, IconClock, IconVolume2, IconVolumeX } from '@/components/Icons';
import styles from '../admin.module.css';
import kdsStyles from './kds.module.css';

export default function KDSPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const intervalRef = useRef(null);
  const prevCountRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    loadKDS();
    intervalRef.current = setInterval(loadKDS, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Initialize audio on first user interaction
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19teleGtQQBBBkAAAABAAEARKwAAESsAAABAAgAZGF0YQ==');
    }
  }, []);

  async function loadKDS() {
    try {
      const res = await fetch('/api/kds');
      const newItems = await res.json();
      // Play sound if new items appeared
      if (soundOn && newItems.length > prevCountRef.current && prevCountRef.current > 0) {
        try { audioRef.current?.play(); } catch {}
      }
      prevCountRef.current = newItems.length;
      setItems(newItems);
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

  // Summary stats
  const totalPending = items.filter(i => i.status === 'pending').length;
  const totalFired = items.filter(i => i.status === 'fired').length;
  const totalItems = items.length;

  function getTimeSince(dateStr) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  }

  function getTimeTier(dateStr) {
    if (!dateStr) return '';
    const mins = (Date.now() - new Date(dateStr).getTime()) / 60000;
    if (mins < 5) return 'green';
    if (mins < 10) return 'yellow';
    return 'red';
  }

  function isAllFired(order) {
    return order.items.length > 0 && order.items.every(i => i.status === 'fired');
  }

  function getOrderAge(order) {
    const firedItems = order.items.filter(i => i.fired_at);
    if (firedItems.length === 0) return null;
    const earliest = firedItems.reduce((min, i) => {
      const t = new Date(i.fired_at).getTime();
      return t < min ? t : min;
    }, Infinity);
    return Math.floor((Date.now() - earliest) / 60000);
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
        <div className={kdsStyles.kdsHeaderActions}>
          <button
            className={`${kdsStyles.soundToggle} ${soundOn ? kdsStyles.soundOn : ''}`}
            onClick={() => setSoundOn(s => !s)}
            title={soundOn ? 'Mute alerts' : 'Enable alerts'}
          >
            {soundOn ? <IconVolume2 size={14} /> : <IconVolumeX size={14} />}
          </button>
          <button className={`${styles.actionBtn} ${styles.actionBtnDefault}`} onClick={loadKDS}>
            <IconRefresh size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      {totalItems > 0 && (
        <div className={kdsStyles.summaryBar}>
          <div className={kdsStyles.summaryItem}>
            <span className={kdsStyles.summaryValue}>{orders.length}</span>
            <span className={kdsStyles.summaryLabel}>Orders</span>
          </div>
          <div className={kdsStyles.summarySep} />
          <div className={kdsStyles.summaryItem}>
            <span className={`${kdsStyles.summaryValue} ${kdsStyles.summaryPending}`}>{totalPending}</span>
            <span className={kdsStyles.summaryLabel}>Pending</span>
          </div>
          <div className={kdsStyles.summarySep} />
          <div className={kdsStyles.summaryItem}>
            <span className={`${kdsStyles.summaryValue} ${kdsStyles.summaryFired}`}>{totalFired}</span>
            <span className={kdsStyles.summaryLabel}>Fired</span>
          </div>
          <div className={kdsStyles.summarySep} />
          <div className={kdsStyles.summaryItem}>
            <span className={kdsStyles.summaryValue}>{totalItems}</span>
            <span className={kdsStyles.summaryLabel}>Total Items</span>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><IconFlame size={20} /></div>
          <p className={styles.emptyText}>Kitchen is clear — no active orders</p>
        </div>
      ) : (
        <div className={kdsStyles.kdsGrid}>
          {orders.map(order => {
            const allFired = isAllFired(order);
            const age = getOrderAge(order);
            const isUrgent = age !== null && age >= 10;
            return (
              <div
                key={order.order_id}
                className={`${kdsStyles.kdsCard} ${allFired ? kdsStyles.kdsCardAllFired : ''} ${isUrgent ? kdsStyles.kdsCardUrgent : ''}`}
              >
                <div className={kdsStyles.kdsCardHeader}>
                  <div className={kdsStyles.kdsCardHeaderLeft}>
                    <span className={kdsStyles.kdsTableBadge}>Table {order.table_number || '?'}</span>
                    {order.table_name && (
                      <span className={kdsStyles.kdsTableName}>{order.table_name}</span>
                    )}
                    <span className={kdsStyles.kdsOrderId}>#{order.order_id}</span>
                  </div>
                  <div className={kdsStyles.kdsCardHeaderRight}>
                    {order.guest_name && <span className={kdsStyles.kdsGuest}>{order.guest_name}</span>}
                    {age !== null && (
                      <span className={`${kdsStyles.kdsAge} ${kdsStyles[`kdsAge${age < 5 ? 'Green' : age < 10 ? 'Yellow' : 'Red'}`]}`}>
                        <IconClock size={10} /> {age}m
                      </span>
                    )}
                  </div>
                </div>

                {/* Course progress bar */}
                <div className={kdsStyles.courseProgress}>
                  <div
                    className={kdsStyles.courseProgressFill}
                    style={{ width: `${(order.items.filter(i => i.status === 'fired').length / order.items.length) * 100}%` }}
                  />
                </div>

                <div className={kdsStyles.kdsItems}>
                  {order.items.map(item => {
                    const tier = getTimeTier(item.fired_at);
                    return (
                      <div
                        key={item.id}
                        className={`${kdsStyles.kdsItem} ${item.status === 'fired' ? kdsStyles.kdsItemFired : kdsStyles.kdsItemPending} ${tier === 'red' ? kdsStyles.kdsItemLongWait : ''}`}
                      >
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
                            <span className={`${kdsStyles.kdsTimer} ${kdsStyles[`kdsTimer${tier.charAt(0).toUpperCase() + tier.slice(1)}`]}`}>
                              {getTimeSince(item.fired_at)}
                            </span>
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
                    );
                  })}
                </div>

                <div className={kdsStyles.kdsCardFooter}>
                  <span>{order.items.length} items</span>
                  <span style={{ color: allFired ? 'var(--success)' : 'var(--warning)' }}>
                    {allFired ? '✓ All fired' : `${order.items.filter(i => i.status === 'fired').length} fired`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
