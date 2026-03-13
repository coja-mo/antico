'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IconGrid, IconCheck, IconX, IconCreditCard, IconDollarSign, IconRefresh, IconFlame, IconChevronRight, IconArrowUp, IconClock } from '@/components/Icons';
import styles from './pos.module.css';

export default function POSPage() {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('appetizer');
  const [view, setView] = useState('floor');
  const [tipAmount, setTipAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    loadTables();
    loadMenu();
  }, []);

  async function loadTables() {
    const res = await fetch('/api/tables');
    setTables(await res.json());
  }

  async function loadMenu() {
    const res = await fetch('/api/menu');
    setMenuItems(await res.json());
  }

  async function selectTable(table) {
    setSelectedTable(table);
    if (table.current_order_id) {
      const res = await fetch(`/api/orders/${table.current_order_id}`);
      const data = await res.json();
      setCurrentOrder(data);
      setOrderItems(data.items || []);
    } else {
      setCurrentOrder(null);
      setOrderItems([]);
    }
    setView('order');
    setShowPayment(false);
  }

  async function openNewOrder() {
    if (!selectedTable) return;
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_id: selectedTable.id }),
    });
    const order = await res.json();
    setCurrentOrder(order);
    setOrderItems([]);
    loadTables();
  }

  async function addItem(menuItem) {
    if (!currentOrder) return;
    const res = await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_item', menu_item_id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }),
    });
    const data = await res.json();
    setOrderItems(data.items);
  }

  async function fireCourse(course) {
    if (!currentOrder) return;
    await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fire_course', course }),
    });
    const res = await fetch(`/api/orders/${currentOrder.id}`);
    const data = await res.json();
    setOrderItems(data.items || []);
  }

  async function closeOrder(paymentMethod) {
    if (!currentOrder) return;
    await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close', payment_method: paymentMethod, tip: parseFloat(tipAmount) || 0 }),
    });
    setCurrentOrder(null);
    setOrderItems([]);
    setSelectedTable(null);
    setView('floor');
    setTipAmount('');
    setShowPayment(false);
    loadTables();
  }

  async function updateTableStatus(tableId, status) {
    await fetch('/api/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tableId, status }),
    });
    loadTables();
  }

  const categories = [
    { key: 'appetizer', label: 'Appetizers' },
    { key: 'salad', label: 'Salads' },
    { key: 'entree', label: 'Entrees' },
    { key: 'dessert', label: 'Desserts' },
  ];

  const filteredMenu = menuItems.filter(i => i.category === activeCategory);
  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.13;
  const tip = parseFloat(tipAmount) || 0;
  const total = subtotal + tax + tip;

  const zones = [...new Set(tables.map(t => t.zone))];

  const statusConfig = {
    available: { color: '#22c55e', label: 'Available' },
    occupied: { color: '#eab308', label: 'Occupied' },
    reserved: { color: '#3b82f6', label: 'Reserved' },
    cleaning: { color: '#a855f7', label: 'Cleaning' },
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className={styles.posApp}>
      {/* Top bar */}
      <header className={styles.posHeader}>
        <div className={styles.posHeaderLeft}>
          <Image src="/images/antico-logo-transparent.png" alt="Antico" width={68} height={28} className={styles.posLogo} />
          <div className={styles.posDivider} />
          <span className={styles.posSystemLabel}>Point of Sale</span>
        </div>
        <div className={styles.posHeaderCenter}>
          <button className={`${styles.posViewTab} ${view === 'floor' ? styles.posViewTabActive : ''}`} onClick={() => { setView('floor'); setShowPayment(false); }}>
            <IconGrid size={14} /> Floor Plan
          </button>
          {selectedTable && (
            <button className={`${styles.posViewTab} ${view === 'order' ? styles.posViewTabActive : ''}`} onClick={() => { setView('order'); setShowPayment(false); }}>
              <IconGrid size={14} /> Table {selectedTable.number}
            </button>
          )}
        </div>
        <div className={styles.posHeaderRight}>
          <span className={styles.posTime}>{timeStr}</span>
          <Link href="/admin" className={styles.posAdminLink}>Admin</Link>
        </div>
      </header>

      {/* Floor Plan View */}
      {view === 'floor' && (
        <div className={styles.floorView}>
          {/* Legend */}
          <div className={styles.floorLegend}>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <div key={key} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: cfg.color }} />
                <span>{cfg.label}</span>
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <button className={styles.refreshBtn} onClick={loadTables}>
              <IconRefresh size={14} /> Refresh
            </button>
          </div>

          {/* Zones */}
          {zones.map(zone => (
            <div key={zone} className={styles.floorZone}>
              <div className={styles.zoneLabel}>{zone}</div>
              <div className={styles.zoneGrid}>
                {tables.filter(t => t.zone === zone).map(table => {
                  const cfg = statusConfig[table.status] || statusConfig.available;
                  return (
                    <button
                      key={table.id}
                      className={styles.tableCard}
                      onClick={() => selectTable(table)}
                      style={{ '--table-color': cfg.color }}
                    >
                      <div className={styles.tableTop}>
                        <span className={styles.tableNum}>{table.number}</span>
                        <span className={styles.tableStatusDot} style={{ background: cfg.color }} />
                      </div>
                      <div className={styles.tableMeta}>
                        <span className={styles.tableCapacity}>{table.capacity} seats</span>
                      </div>
                      <div className={styles.tableStatusText}>{table.status}</div>
                      {table.status === 'cleaning' && (
                        <button className={styles.quickClear} onClick={e => { e.stopPropagation(); updateTableStatus(table.id, 'available'); }}>
                          Mark Ready
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order View */}
      {view === 'order' && selectedTable && (
        <div className={styles.orderView}>
          {/* Menu Panel */}
          <div className={styles.menuPanel}>
            <div className={styles.menuTabs}>
              {categories.map(cat => (
                <button key={cat.key} className={`${styles.menuTab} ${activeCategory === cat.key ? styles.menuTabActive : ''}`} onClick={() => setActiveCategory(cat.key)}>
                  {cat.label}
                </button>
              ))}
            </div>
            <div className={styles.menuGrid}>
              {filteredMenu.map(item => (
                <button key={item.id} className={styles.menuItem} onClick={() => addItem(item)} disabled={!currentOrder}>
                  <span className={styles.menuItemName}>{item.name}</span>
                  <span className={styles.menuItemPrice}>${item.price.toFixed(2)}</span>
                </button>
              ))}
              {filteredMenu.length === 0 && (
                <div className={styles.menuEmpty}>No items in this category</div>
              )}
            </div>
          </div>

          {/* Check Panel */}
          <div className={styles.checkPanel}>
            <div className={styles.checkHeader}>
              <div>
                <div className={styles.checkTitle}>Table {selectedTable.number}</div>
                <div className={styles.checkSub}>
                  {selectedTable.capacity} seats &middot; {selectedTable.zone}
                </div>
              </div>
              <span className={styles.checkStatus} style={{ color: statusConfig[selectedTable.status]?.color }}>
                {selectedTable.status}
              </span>
            </div>

            {!currentOrder ? (
              <div className={styles.checkEmpty}>
                <p>No active check</p>
                <button className={styles.openOrderBtn} onClick={openNewOrder}>Open New Check</button>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className={styles.checkItems}>
                  {orderItems.length === 0 ? (
                    <div className={styles.checkItemsEmpty}>Select items from the menu</div>
                  ) : (
                    orderItems.map((item, i) => (
                      <div key={i} className={styles.checkItem}>
                        <div className={styles.checkItemLeft}>
                          <span className={styles.checkItemQty}>{item.quantity}</span>
                          <span className={styles.checkItemName}>{item.name}</span>
                          <span className={`${styles.checkItemStatus} ${styles[`itemStatus${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`]}`}>
                            {item.status}
                          </span>
                        </div>
                        <span className={styles.checkItemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Course Firing */}
                {orderItems.some(i => i.status === 'pending') && (
                  <div className={styles.courseSection}>
                    <span className={styles.courseSectionLabel}>Fire Courses</span>
                    <div className={styles.courseButtons}>
                      <button className={styles.courseBtn} onClick={() => fireCourse('appetizer')}>
                        <IconFlame size={12} /> Apps
                      </button>
                      <button className={styles.courseBtn} onClick={() => fireCourse('main')}>
                        <IconFlame size={12} /> Mains
                      </button>
                      <button className={styles.courseBtn} onClick={() => fireCourse('dessert')}>
                        <IconFlame size={12} /> Dessert
                      </button>
                    </div>
                  </div>
                )}

                {/* Totals */}
                {!showPayment ? (
                  <div className={styles.checkTotals}>
                    <div className={styles.totalLine}>
                      <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.totalLine}>
                      <span>HST 13%</span><span>${tax.toFixed(2)}</span>
                    </div>
                    <div className={`${styles.totalLine} ${styles.totalLineGrand}`}>
                      <span>Total</span><span>${(subtotal + tax).toFixed(2)}</span>
                    </div>
                    <button className={styles.payBtn} onClick={() => setShowPayment(true)} disabled={orderItems.length === 0}>
                      Close Check
                    </button>
                  </div>
                ) : (
                  <div className={styles.paymentSection}>
                    <div className={styles.paymentTip}>
                      <label>Tip</label>
                      <div className={styles.tipPresets}>
                        {[0, 15, 18, 20].map(pct => {
                          const tipVal = pct === 0 ? 0 : (subtotal * pct / 100);
                          return (
                            <button key={pct} className={`${styles.tipPreset} ${tipAmount === tipVal.toFixed(2) ? styles.tipPresetActive : ''}`}
                              onClick={() => setTipAmount(tipVal.toFixed(2))}>
                              {pct === 0 ? 'None' : `${pct}%`}
                            </button>
                          );
                        })}
                      </div>
                      <input className={styles.tipInput} type="number" placeholder="Custom amount" value={tipAmount} onChange={e => setTipAmount(e.target.value)} />
                    </div>
                    <div className={`${styles.totalLine} ${styles.totalLineGrand}`}>
                      <span>Total</span><span>${total.toFixed(2)}</span>
                    </div>
                    <div className={styles.paymentButtons}>
                      <button className={styles.payMethodBtn} onClick={() => closeOrder('card')}>
                        <IconCreditCard size={16} />
                        <span>Card</span>
                      </button>
                      <button className={styles.payMethodBtn} onClick={() => closeOrder('cash')}>
                        <IconDollarSign size={16} />
                        <span>Cash</span>
                      </button>
                      <button className={styles.payMethodBtn} onClick={() => closeOrder('other')}>
                        <IconGrid size={16} />
                        <span>Other</span>
                      </button>
                    </div>
                    <button className={styles.cancelPayBtn} onClick={() => setShowPayment(false)}>
                      Back to Check
                    </button>
                  </div>
                )}
              </>
            )}

            <button className={styles.backToFloor} onClick={() => { setView('floor'); setSelectedTable(null); setCurrentOrder(null); setOrderItems([]); setShowPayment(false); }}>
              Back to Floor Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
