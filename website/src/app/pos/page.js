'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IconGrid, IconCheck, IconX, IconCreditCard, IconDollarSign, IconRefresh, IconFlame, IconChevronRight, IconArrowUp, IconClock, IconUsers, IconCalendar, IconUserCircle, IconMapPin, IconEdit, IconTrash, IconMessageSquare, IconPercent, IconGift, IconPlus, IconSplitSquare, IconArrowRight, IconPrinter } from '@/components/Icons';
import styles from './pos.module.css';

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
function getTableDisplayName(table) {
  if (table.reservation_id && table._resoGuestName) {
    const parts = table._resoGuestName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[parts.length - 1]} Table`;
    }
    return `${parts[0]}'s Table`;
  }
  return `Table ${table.number}`;
}

function formatTime12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
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

  // Reservations
  const [todayReservations, setTodayReservations] = useState([]);
  const [showResoPanel, setShowResoPanel] = useState(true);
  const [seatingReso, setSeatingReso] = useState(null);
  const [serverInput, setServerInput] = useState('');
  const [showServerModal, setShowServerModal] = useState(null);

  // Item control
  const [itemNotesModal, setItemNotesModal] = useState(null); // { item, notes }
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [showOrderNotes, setShowOrderNotes] = useState(false);

  // Gift card
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [gcCodeInput, setGcCodeInput] = useState('');
  const [gcLookup, setGcLookup] = useState(null);
  const [gcLookupError, setGcLookupError] = useState('');
  const [gcLoading, setGcLoading] = useState(false);
  const [gcRedeemResult, setGcRedeemResult] = useState(null);

  // POS Enhancements
  const [bevSubcat, setBevSubcat] = useState('wine');
  const [showSplitCheck, setShowSplitCheck] = useState(false);
  const [splitPayments, setSplitPayments] = useState([]);
  const [showTableTransfer, setShowTableTransfer] = useState(false);
  const [showReceipt, setShowReceipt] = useState(null);
  const [showWalkInModal, setShowWalkInModal] = useState(null);

  // Table timer
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadTables();
    loadMenu();
    loadTodayReservations();
    const interval = setInterval(() => {
      loadTodayReservations();
      loadTables();
    }, 30000);
    const timerInterval = setInterval(() => setNow(Date.now()), 60000);
    return () => { clearInterval(interval); clearInterval(timerInterval); };
  }, []);

  // ── Data Loading ──
  async function loadTables() {
    const res = await fetch('/api/tables');
    const data = await res.json();
    // Enrich tables with reservation guest names
    const resoRes = await fetch(`/api/reservations?date=${new Date().toISOString().split('T')[0]}&status=seated`);
    const seatedResos = await resoRes.json();
    const enriched = data.map(t => {
      const reso = seatedResos.find(r => r.table_id === t.id);
      return { ...t, _resoGuestName: reso?.guest_name || null, _resoId: reso?.id || null };
    });
    setTables(enriched);
  }

  async function loadMenu() {
    const res = await fetch('/api/menu');
    setMenuItems(await res.json());
  }

  async function loadTodayReservations() {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`/api/reservations?date=${today}`);
    const all = await res.json();
    // Show confirmed + pending + seated for today
    setTodayReservations(all.filter(r => ['confirmed', 'pending', 'seated'].includes(r.status)));
  }

  // ── Table Selection ──
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

  // ── Open New Order ──
  async function openNewOrder(guestId, reservationId, guestName) {
    if (!selectedTable) return;
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: selectedTable.id,
        guest_id: guestId || null,
        reservation_id: reservationId || null,
        guest_name: guestName || null,
      }),
    });
    const order = await res.json();
    setCurrentOrder(order);
    setOrderItems([]);
    loadTables();
  }

  // ── Seat Reservation ──
  async function seatReservation(reservation, table) {
    // 1. Update reservation status to 'seated' and assign table
    await fetch(`/api/reservations/${reservation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'seated',
        table_id: table.id,
      }),
    });

    // 2. Update table with reservation_id
    await fetch('/api/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: table.id,
        status: 'occupied',
        reservation_id: reservation.id,
      }),
    });

    // 3. Create order linked to guest & reservation
    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: table.id,
        guest_id: reservation.guest_id || null,
        reservation_id: reservation.id,
        guest_name: reservation.guest_name,
      }),
    });
    const order = await orderRes.json();

    // 4. Switch to order view
    setSeatingReso(null);
    const enrichedTable = {
      ...table,
      status: 'occupied',
      current_order_id: order.id,
      _resoGuestName: reservation.guest_name,
      _resoId: reservation.id,
    };
    setSelectedTable(enrichedTable);
    setCurrentOrder(order);
    setOrderItems([]);
    setView('order');
    setShowPayment(false);
    loadTables();
    loadTodayReservations();
  }

  // ── Server Assignment ──
  async function assignServer(tableId, serverName) {
    await fetch('/api/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tableId, server_name: serverName || null }),
    });
    setShowServerModal(null);
    setServerInput('');
    loadTables();
  }

  // ── Menu / Order Actions ──
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

  // ── Item Controls ──
  async function removeItem(itemId) {
    const res = await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_item', item_id: itemId }),
    });
    const data = await res.json();
    setOrderItems(data.items);
  }

  async function updateQuantity(itemId, qty) {
    if (qty < 1) return removeItem(itemId);
    const res = await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_quantity', item_id: itemId, quantity: qty }),
    });
    const data = await res.json();
    setOrderItems(data.items);
  }

  async function voidItem(itemId) {
    const res = await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'void_item', item_id: itemId }),
    });
    const data = await res.json();
    setOrderItems(data.items);
  }

  async function compItem(itemId) {
    const res = await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comp_item', item_id: itemId }),
    });
    const data = await res.json();
    setOrderItems(data.items);
  }

  async function saveItemNotes(itemId, notes) {
    const res = await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_item_notes', item_id: itemId, notes }),
    });
    const data = await res.json();
    setOrderItems(data.items);
    setItemNotesModal(null);
  }

  async function applyDiscount() {
    if (!discountValue) return;
    await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_discount',
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        discount_reason: discountReason,
      }),
    });
    // Reload order to get updated discount
    const res = await fetch(`/api/orders/${currentOrder.id}`);
    const data = await res.json();
    setCurrentOrder(data);
    setOrderItems(data.items || []);
    setShowDiscountModal(false);
    setDiscountValue('');
    setDiscountReason('');
  }

  async function saveOrderNotes() {
    await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_notes: orderNotes }),
    });
    setShowOrderNotes(false);
  }

  function getElapsedTime(seatedAt) {
    if (!seatedAt) return null;
    const diff = Math.floor((now - new Date(seatedAt).getTime()) / 60000);
    if (diff < 0) return '0m';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  async function closeOrder(paymentMethod, gcCode, gcAmount) {
    if (!currentOrder) return;
    const body = { action: 'close', payment_method: paymentMethod, tip: parseFloat(tipAmount) || 0 };
    if (gcCode) {
      body.gift_card_code = gcCode;
      body.gift_card_amount = gcAmount || 0;
    }
    await fetch(`/api/orders/${currentOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // If this was from a reservation, mark it completed and clear table reservation
    if (selectedTable?._resoId) {
      await fetch(`/api/reservations/${selectedTable._resoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      await fetch('/api/tables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTable.id, reservation_id: null }),
      });
    }

    // Build receipt data before clearing state
    const receiptData = {
      orderNumber: currentOrder?.id,
      table: selectedTable ? `Table ${selectedTable.number}` : 'N/A',
      server: selectedTable?.server_name || 'Staff',
      guestName: currentOrder?.guest_name || selectedTable?._resoGuestName || null,
      items: orderItems.filter(i => i.status !== 'voided'),
      subtotal: subtotal,
      discount: discountAmt,
      tax: tax,
      tip: parseFloat(tipAmount) || 0,
      total: total,
      paymentMethod: paymentMethod,
      date: new Date(),
    };

    setCurrentOrder(null);
    setOrderItems([]);
    setSelectedTable(null);
    setView('floor');
    setTipAmount('');
    setShowPayment(false);
    setShowGiftCardModal(false);
    setGcLookup(null);
    setGcRedeemResult(null);
    setGcCodeInput('');
    setShowReceipt(receiptData);
    loadTables();
    loadTodayReservations();
  }

  // ── Gift Card Functions ──
  async function lookupGiftCard() {
    const rawCode = gcCodeInput.trim();
    if (!rawCode) return;
    setGcLoading(true);
    setGcLookupError('');
    setGcLookup(null);
    setGcRedeemResult(null);
    try {
      // Normalize: strip dashes, spaces, convert to uppercase for consistent lookup
      const normalizedCode = rawCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (normalizedCode.length !== 16) {
        setGcLookupError('Invalid code format — must be 16 characters (e.g. XXXX-XXXX-XXXX-XXXX)');
        setGcLoading(false);
        return;
      }
      const formattedCode = normalizedCode.match(/.{1,4}/g).join('-');

      const res = await fetch(`/api/gift-cards/${encodeURIComponent(formattedCode)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setGcLookupError(errorData.error || 'Gift card not found — check the code and try again');
        setGcLoading(false);
        return;
      }
      const data = await res.json();
      if (data.status !== 'active') {
        setGcLookupError(`This gift card is ${data.status}${data.status === 'depleted' ? ' (no balance remaining)' : ''}`);
        setGcLoading(false);
        return;
      }
      if (data.balance <= 0) {
        setGcLookupError('This gift card has $0.00 remaining');
        setGcLoading(false);
        return;
      }
      setGcLookup(data);
    } catch {
      setGcLookupError('Connection error — unable to look up gift card');
    }
    setGcLoading(false);
  }

  async function redeemGiftCard() {
    if (!gcLookup || !currentOrder) return;
    setGcLoading(true);
    setGcLookupError('');
    try {
      const res = await fetch(`/api/gift-cards/${encodeURIComponent(gcLookup.code)}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          order_id: currentOrder.id,
          performed_by: `POS`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGcLookupError(data.error || 'Redemption failed — gift card balance was NOT charged');
        setGcLoading(false);
        return;
      }
      const remainingToPay = Math.round((total - data.redeemed) * 100) / 100;
      setGcRedeemResult({ ...data, remainingToPay });
      if (remainingToPay <= 0) {
        // Fully covered — close the order
        await closeOrder('gift_card', gcLookup.code, data.redeemed);
      }
    } catch (err) {
      console.error('[POS GC Redeem Error]', err);
      setGcLookupError('Connection error — gift card was NOT charged. Please try again.');
    }
    setGcLoading(false);
  }

  async function closeWithSplitPayment(secondaryMethod) {
    if (!gcRedeemResult || !gcLookup) return;
    const gcAmount = Math.round((total - gcRedeemResult.remainingToPay) * 100) / 100;
    await closeOrder(`gift_card+${secondaryMethod}`, gcLookup.code, gcAmount);
  }

  async function updateTableStatus(tableId, status) {
    await fetch('/api/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tableId, status, reservation_id: null }),
    });
    loadTables();
  }

  // ── Walk-In Flow ──
  async function startWalkIn(table) {
    setSelectedTable(table);
    await openNewOrder(null, null, null);
    setView('order');
    setShowWalkInModal(null);
  }

  // ── Table Transfer ──
  async function transferTable(newTableId) {
    if (!currentOrder) return;
    // Update the order's table
    await fetch('/api/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedTable.id, status: 'available', current_order_id: null, seated_at: null }),
    });
    await fetch('/api/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newTableId, status: 'occupied', current_order_id: currentOrder.id, seated_at: new Date().toISOString() }),
    });
    setShowTableTransfer(false);
    loadTables();
    const newTable = tables.find(t => t.id === newTableId);
    if (newTable) setSelectedTable({ ...newTable, status: 'occupied', current_order_id: currentOrder.id });
  }

  // ── Split Check ──
  function initSplitCheck() {
    const perPerson = total / 2;
    setSplitPayments([{ amount: perPerson, method: 'card' }, { amount: perPerson, method: 'card' }]);
    setShowSplitCheck(true);
  }

  function addSplitPayment() {
    const totalAssigned = splitPayments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, total - totalAssigned);
    setSplitPayments([...splitPayments, { amount: remaining, method: 'card' }]);
  }

  function updateSplitPayment(idx, field, value) {
    const updated = [...splitPayments];
    updated[idx] = { ...updated[idx], [field]: field === 'amount' ? parseFloat(value) || 0 : value };
    setSplitPayments(updated);
  }

  function removeSplitPayment(idx) {
    if (splitPayments.length <= 2) return;
    setSplitPayments(splitPayments.filter((_, i) => i !== idx));
  }

  async function closeSplitCheck() {
    const methods = splitPayments.map(p => p.method).join('+');
    await closeOrder(`split:${methods}`, null, null);
    setShowSplitCheck(false);
    setSplitPayments([]);
  }

  // ── Computed Values ──
  const categories = [
    { key: 'appetizer', label: 'Appetizers' },
    { key: 'salad', label: 'Salads' },
    { key: 'entree', label: 'Entrees' },
    { key: 'dessert', label: 'Desserts' },
    { key: 'beverage', label: 'Beverages' },
  ];

  const filteredMenu = menuItems.filter(i => {
    if (i.category !== activeCategory) return false;
    if (activeCategory === 'beverage' && bevSubcat && i.subcategory !== bevSubcat) return false;
    return true;
  });
  const activeItems = orderItems.filter(i => i.status !== 'voided' && i.status !== 'comped');
  const subtotal = activeItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = parseFloat(currentOrder?.discount_amount) || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const tax = afterDiscount * 0.13;
  const tip = parseFloat(tipAmount) || 0;
  const total = afterDiscount + tax + tip;
  const zones = [...new Set(tables.map(t => t.zone))];

  const statusConfig = {
    available: { color: '#22c55e', label: 'Available' },
    occupied: { color: '#eab308', label: 'Occupied' },
    reserved: { color: '#3b82f6', label: 'Reserved' },
    cleaning: { color: '#a855f7', label: 'Cleaning' },
  };

  const clockTime = new Date();
  const timeStr = clockTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const availableTables = tables.filter(t => t.status === 'available');
  const occupiedTables = tables.filter(t => t.status === 'occupied');
  const totalCoversNow = occupiedTables.reduce((s, t) => s + (t.capacity || 0), 0);

  return (
    <div className={styles.posApp}>
      {/* ══════════════════════════════════════════════
          TOP BAR
          ══════════════════════════════════════════════ */}
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
              <IconGrid size={14} /> {getTableDisplayName(selectedTable)}
            </button>
          )}
        </div>
        <div className={styles.posHeaderRight}>
          <button
            className={`${styles.resoToggleBtn} ${showResoPanel ? styles.resoToggleBtnActive : ''}`}
            onClick={() => setShowResoPanel(!showResoPanel)}
          >
            <IconCalendar size={14} />
            <span>Reservations</span>
            {todayReservations.filter(r => r.status === 'confirmed').length > 0 && (
              <span className={styles.resoBadge}>{todayReservations.filter(r => r.status === 'confirmed').length}</span>
            )}
          </button>
          <span className={styles.posTime}>{timeStr}</span>
          <Link href="/admin" className={styles.posAdminLink}>Admin</Link>
        </div>
      </header>

      <div className={styles.posBody}>
        {/* ══════════════════════════════════════════════
            FLOOR PLAN VIEW
            ══════════════════════════════════════════════ */}
        {view === 'floor' && (
          <div className={styles.floorLayout}>
            <div className={styles.floorMain}>
              {/* Quick Stats Bar */}
              <div className={styles.quickStatsBar}>
                <div className={styles.quickStat}>
                  <span className={styles.quickStatValue}>{occupiedTables.length}</span>
                  <span className={styles.quickStatLabel}>Active Tables</span>
                </div>
                <div className={styles.quickStatDivider} />
                <div className={styles.quickStat}>
                  <span className={styles.quickStatValue}>{availableTables.length}</span>
                  <span className={styles.quickStatLabel}>Available</span>
                </div>
                <div className={styles.quickStatDivider} />
                <div className={styles.quickStat}>
                  <span className={styles.quickStatValue}>{totalCoversNow}</span>
                  <span className={styles.quickStatLabel}>Covers</span>
                </div>
                <div className={styles.quickStatDivider} />
                <div className={styles.quickStat}>
                  <span className={styles.quickStatValue}>{todayReservations.filter(r => r.status === 'confirmed').length}</span>
                  <span className={styles.quickStatLabel}>Upcoming</span>
                </div>
              </div>

              {/* Legend + Walk-In */}
              <div className={styles.floorLegend}>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <div key={key} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: cfg.color }} />
                    <span>{cfg.label}</span>
                  </div>
                ))}
                <div style={{ flex: 1 }} />
                <button className={styles.walkInBtn} onClick={() => setShowWalkInModal(true)}>
                  <IconPlus size={13} /> Walk-In
                </button>
                <button className={styles.refreshBtn} onClick={() => { loadTables(); loadTodayReservations(); }}>
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
                      const displayName = getTableDisplayName(table);
                      const isReservationTable = !!table._resoGuestName;
                      const isSeatingTarget = seatingReso && table.status === 'available';
                      const elapsed = table.status === 'occupied' && table.seated_at ? getElapsedTime(table.seated_at) : null;
                      return (
                        <button
                          key={table.id}
                          className={`${styles.tableCard} ${isReservationTable ? styles.tableCardReso : ''} ${isSeatingTarget ? styles.tableCardSeatTarget : ''}`}
                          onClick={() => {
                            if (seatingReso && table.status === 'available') {
                              seatReservation(seatingReso, table);
                            } else {
                              selectTable(table);
                            }
                          }}
                          style={{ '--table-color': cfg.color }}
                        >
                          <div className={styles.tableTop}>
                            <span className={styles.tableNum}>{table.number}</span>
                            <span className={styles.tableStatusDot} style={{ background: cfg.color }} />
                          </div>
                          {isReservationTable ? (
                            <div className={styles.tableGuestName}>{displayName}</div>
                          ) : (
                            <div className={styles.tableMeta}>
                              <span className={styles.tableCapacity}>{table.capacity} seats</span>
                            </div>
                          )}
                          {table.server_name && (
                            <div className={styles.tableServerBadge}>
                              <IconUserCircle size={10} /> {table.server_name}
                            </div>
                          )}
                          <div className={styles.tableStatusRow}>
                            <span className={styles.tableStatusText}>{table.status}</span>
                            {elapsed && <span className={styles.tableTimer}><IconClock size={9} /> {elapsed}</span>}
                          </div>
                          {table.status === 'cleaning' && (
                            <button className={styles.quickClear} onClick={e => { e.stopPropagation(); updateTableStatus(table.id, 'available'); }}>
                              Mark Ready
                            </button>
                          )}
                          {table.status !== 'cleaning' && (
                            <button
                              className={styles.serverAssignBtn}
                              onClick={e => { e.stopPropagation(); setShowServerModal(table.id); setServerInput(table.server_name || ''); }}
                              title="Assign server"
                            >
                              <IconUserCircle size={11} />
                            </button>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* ── TODAY'S RESERVATIONS SIDEBAR ── */}
            {showResoPanel && (
              <aside className={styles.resoSidebar}>
                <div className={styles.resoSidebarHeader}>
                  <h3><IconCalendar size={15} /> Today's Reservations</h3>
                  <span className={styles.resoCount}>{todayReservations.length}</span>
                </div>

                {seatingReso && (
                  <div className={styles.seatBanner}>
                    <div className={styles.seatBannerText}>
                      <strong>Seating {seatingReso.guest_name.split(' ')[0]}</strong>
                      <span>Select an available table</span>
                    </div>
                    <button className={styles.seatBannerCancel} onClick={() => setSeatingReso(null)}>
                      <IconX size={14} />
                    </button>
                  </div>
                )}

                <div className={styles.resoList}>
                  {todayReservations.length === 0 ? (
                    <div className={styles.resoEmpty}>
                      <IconCalendar size={24} />
                      <p>No reservations today</p>
                    </div>
                  ) : (
                    todayReservations.map(reso => {
                      const firstName = reso.guest_name.split(' ')[0];
                      const isSeated = reso.status === 'seated';
                      const isPending = reso.status === 'pending';
                      return (
                        <div key={reso.id} className={`${styles.resoCard} ${isSeated ? styles.resoCardSeated : ''} ${isPending ? styles.resoCardPending : ''}`}>
                          <div className={styles.resoCardTop}>
                            <div className={styles.resoGuestInfo}>
                              <span className={styles.resoGuestName}>{reso.guest_name}</span>
                              <div className={styles.resoDetails}>
                                <span><IconClock size={11} /> {formatTime12(reso.time)}</span>
                                <span><IconUsers size={11} /> {reso.party_size}</span>
                              </div>
                            </div>
                            <span className={`${styles.resoStatus} ${styles[`resoStatus${reso.status.charAt(0).toUpperCase() + reso.status.slice(1)}`]}`}>
                              {reso.status}
                            </span>
                          </div>
                          {reso.occasion && (
                            <div className={styles.resoOccasion}>{reso.occasion}</div>
                          )}
                          {reso.notes && (
                            <div className={styles.resoNotes}>{reso.notes}</div>
                          )}
                          {reso.status === 'confirmed' && (
                            <button className={styles.seatBtn} onClick={() => setSeatingReso(reso)}>
                              <IconMapPin size={13} /> Seat {firstName}
                            </button>
                          )}
                          {isSeated && reso.table_id && (
                            <div className={styles.seatedInfo}>
                              <IconCheck size={12} /> Seated at Table {tables.find(t => t.id === reso.table_id)?.number || '?'}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            ORDER VIEW
            ══════════════════════════════════════════════ */}
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
              {activeCategory === 'beverage' && (
                <div className={styles.bevSubTabs}>
                  {[{key:'wine',label:'Wine'},{key:'cocktail',label:'Cocktails'},{key:'beer',label:'Beer'},{key:'non-alcoholic',label:'Non-Alcoholic'}].map(sub => (
                    <button key={sub.key} className={`${styles.bevSubTab} ${bevSubcat === sub.key ? styles.bevSubTabActive : ''}`} onClick={() => setBevSubcat(sub.key)}>
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
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
                  <div className={styles.checkTitle}>{getTableDisplayName(selectedTable)}</div>
                  <div className={styles.checkSub}>
                    Table {selectedTable.number} &middot; {selectedTable.capacity} seats &middot; {selectedTable.zone}
                    {selectedTable.seated_at && <span className={styles.checkTimer}>&middot; <IconClock size={10} /> {getElapsedTime(selectedTable.seated_at)}</span>}
                  </div>
                  {selectedTable.server_name && (
                    <div className={styles.checkServer}>
                      <IconUserCircle size={12} /> Server: {selectedTable.server_name}
                    </div>
                  )}
                </div>
                <span className={styles.checkStatus} style={{ color: statusConfig[selectedTable.status]?.color }}>
                  {selectedTable.status}
                </span>
              </div>

              {/* Guest name banner for reservation orders */}
              {selectedTable._resoGuestName && (
                <div className={styles.guestBanner}>
                  <IconUserCircle size={14} />
                  <span>Guest: <strong>{selectedTable._resoGuestName}</strong></span>
                </div>
              )}

              {/* Discount banner */}
              {currentOrder && discountAmt > 0 && (
                <div className={styles.discountBanner}>
                  <IconPercent size={12} />
                  <span>Discount: -${discountAmt.toFixed(2)}{currentOrder.discount_reason ? ` (${currentOrder.discount_reason})` : ''}</span>
                </div>
              )}

              {!currentOrder ? (
                <div className={styles.checkEmpty}>
                  <p>No active check</p>
                  <button className={styles.openOrderBtn} onClick={() => openNewOrder()}>Open New Check</button>
                </div>
              ) : (
                <>
                  {/* Items */}
                  <div className={styles.checkItems}>
                    {orderItems.length === 0 ? (
                      <div className={styles.checkItemsEmpty}>Select items from the menu</div>
                    ) : (
                      orderItems.map((item) => {
                        const isVoided = item.status === 'voided';
                        const isComped = item.status === 'comped';
                        const isInactive = isVoided || isComped;
                        return (
                          <div key={item.id} className={`${styles.checkItem} ${isInactive ? styles.checkItemInactive : ''}`}>
                            <div className={styles.checkItemMain}>
                              <div className={styles.checkItemLeft}>
                                {!isInactive && (
                                  <div className={styles.qtyControls}>
                                    <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                                    <span className={styles.qtyValue}>{item.quantity}</span>
                                    <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                  </div>
                                )}
                                {isInactive && <span className={styles.checkItemQty}>{item.quantity}</span>}
                                <div className={styles.checkItemInfo}>
                                  <span className={`${styles.checkItemName} ${isVoided ? styles.checkItemVoided : ''}`}>{item.name}</span>
                                  {item.notes && <span className={styles.checkItemMod}>{item.notes}</span>}
                                </div>
                              </div>
                              <div className={styles.checkItemRight}>
                                <span className={`${styles.checkItemStatus} ${styles[`itemStatus${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`]}`}>
                                  {item.status}
                                </span>
                                <span className={`${styles.checkItemPrice} ${isInactive ? styles.checkItemPriceStruck : ''}`}>
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            {!isInactive && (
                              <div className={styles.checkItemActions}>
                                <button className={styles.itemActionBtn} onClick={() => setItemNotesModal({ item, notes: item.notes || '' })} title="Add notes">
                                  <IconMessageSquare size={11} /> Mod
                                </button>
                                <button className={styles.itemActionBtn} onClick={() => voidItem(item.id)} title="Void item">
                                  <IconX size={11} /> Void
                                </button>
                                <button className={styles.itemActionBtn} onClick={() => compItem(item.id)} title="Comp item">
                                  <IconCheck size={11} /> Comp
                                </button>
                                <button className={`${styles.itemActionBtn} ${styles.itemActionBtnDanger}`} onClick={() => removeItem(item.id)} title="Remove">
                                  <IconTrash size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
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

                  {/* Order Tools */}
                  <div className={styles.orderTools}>
                    <button className={styles.orderToolBtn} onClick={() => { setShowDiscountModal(true); }}>
                      <IconPercent size={12} /> Discount
                    </button>
                    <button className={styles.orderToolBtn} onClick={() => { setOrderNotes(currentOrder.order_notes || ''); setShowOrderNotes(true); }}>
                      <IconMessageSquare size={12} /> Notes
                    </button>
                    <button className={styles.orderToolBtn} onClick={initSplitCheck}>
                      <IconSplitSquare size={12} /> Split
                    </button>
                    <button className={styles.orderToolBtn} onClick={() => setShowTableTransfer(true)}>
                      <IconArrowRight size={12} /> Transfer
                    </button>
                  </div>

                  {/* Totals / Payment */}
                  {!showPayment ? (
                    <div className={styles.checkTotals}>
                      <div className={styles.totalLine}>
                        <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                      </div>
                      {discountAmt > 0 && (
                        <div className={`${styles.totalLine} ${styles.totalLineDiscount}`}>
                          <span>Discount</span><span>-${discountAmt.toFixed(2)}</span>
                        </div>
                      )}
                      <div className={styles.totalLine}>
                        <span>HST 13%</span><span>${tax.toFixed(2)}</span>
                      </div>
                      <div className={`${styles.totalLine} ${styles.totalLineGrand}`}>
                        <span>Total</span><span>${(afterDiscount + tax).toFixed(2)}</span>
                      </div>
                      <button className={styles.payBtn} onClick={() => setShowPayment(true)} disabled={activeItems.length === 0}>
                        Close Check
                      </button>
                    </div>
                  ) : (
                    <div className={styles.paymentSection}>
                      <div className={styles.paymentTip}>
                        <label>Tip</label>
                        <div className={styles.tipPresets}>
                          {[0, 15, 18, 20].map(pct => {
                            const tipVal = pct === 0 ? 0 : (afterDiscount * pct / 100);
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
                        <button className={`${styles.payMethodBtn} ${styles.payMethodBtnGc}`} onClick={() => { setShowGiftCardModal(true); setGcCodeInput(''); setGcLookup(null); setGcRedeemResult(null); setGcLookupError(''); }}>
                          <IconGift size={16} />
                          <span>Gift Card</span>
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

      {/* ══════════════════════════════════════════════
          SERVER ASSIGNMENT MODAL
          ══════════════════════════════════════════════ */}
      {showServerModal && (
        <div className={styles.modalOverlay} onClick={() => setShowServerModal(null)}>
          <div className={styles.serverModal} onClick={e => e.stopPropagation()}>
            <h4>Assign Server</h4>
            <p className={styles.serverModalSub}>Table {tables.find(t => t.id === showServerModal)?.number}</p>
            <input
              className={styles.serverModalInput}
              placeholder="Server name..."
              value={serverInput}
              onChange={e => setServerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && assignServer(showServerModal, serverInput)}
              autoFocus
            />
            <div className={styles.serverModalActions}>
              <button className={styles.serverModalClear} onClick={() => assignServer(showServerModal, '')}>
                Clear
              </button>
              <button className={styles.serverModalSave} onClick={() => assignServer(showServerModal, serverInput)}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          ITEM NOTES MODAL
          ══════════════════════════════════════════════ */}
      {itemNotesModal && (
        <div className={styles.modalOverlay} onClick={() => setItemNotesModal(null)}>
          <div className={styles.serverModal} onClick={e => e.stopPropagation()}>
            <h4>Item Modifications</h4>
            <p className={styles.serverModalSub}>{itemNotesModal.item.name}</p>
            <textarea
              className={styles.serverModalInput}
              style={{ minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="e.g. No onions, extra spicy, gluten-free..."
              value={itemNotesModal.notes}
              onChange={e => setItemNotesModal({ ...itemNotesModal, notes: e.target.value })}
              autoFocus
            />
            <div className={styles.serverModalActions}>
              <button className={styles.serverModalClear} onClick={() => saveItemNotes(itemNotesModal.item.id, '')}>Clear</button>
              <button className={styles.serverModalSave} onClick={() => saveItemNotes(itemNotesModal.item.id, itemNotesModal.notes)}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          DISCOUNT MODAL
          ══════════════════════════════════════════════ */}
      {showDiscountModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDiscountModal(false)}>
          <div className={styles.serverModal} onClick={e => e.stopPropagation()}>
            <h4>Apply Discount</h4>
            <p className={styles.serverModalSub}>Subtotal: ${subtotal.toFixed(2)}</p>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              <button className={`${styles.tipPreset} ${discountType === 'percent' ? styles.tipPresetActive : ''}`} onClick={() => setDiscountType('percent')}>Percentage</button>
              <button className={`${styles.tipPreset} ${discountType === 'dollar' ? styles.tipPresetActive : ''}`} onClick={() => setDiscountType('dollar')}>Dollar Amount</button>
            </div>
            <input
              className={styles.serverModalInput}
              type="number"
              placeholder={discountType === 'percent' ? 'Enter %' : 'Enter $'}
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              autoFocus
            />
            <input
              className={styles.serverModalInput}
              placeholder="Reason (optional)"
              value={discountReason}
              onChange={e => setDiscountReason(e.target.value)}
            />
            {discountValue && (
              <p style={{ fontSize: '0.75rem', color: 'var(--gold)', marginBottom: 12 }}>
                Discount: -${(discountType === 'percent' ? subtotal * parseFloat(discountValue) / 100 : parseFloat(discountValue)).toFixed(2)}
              </p>
            )}
            <div className={styles.serverModalActions}>
              <button className={styles.serverModalClear} onClick={() => setShowDiscountModal(false)}>Cancel</button>
              <button className={styles.serverModalSave} onClick={applyDiscount} disabled={!discountValue}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          ORDER NOTES MODAL
          ══════════════════════════════════════════════ */}
      {showOrderNotes && (
        <div className={styles.modalOverlay} onClick={() => setShowOrderNotes(false)}>
          <div className={styles.serverModal} onClick={e => e.stopPropagation()}>
            <h4>Order Notes</h4>
            <p className={styles.serverModalSub}>Allergies, VIP notes, special requests...</p>
            <textarea
              className={styles.serverModalInput}
              style={{ minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Enter order notes..."
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              autoFocus
            />
            <div className={styles.serverModalActions}>
              <button className={styles.serverModalClear} onClick={() => setShowOrderNotes(false)}>Cancel</button>
              <button className={styles.serverModalSave} onClick={saveOrderNotes}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          GIFT CARD MODAL
          ══════════════════════════════════════════════ */}
      {showGiftCardModal && (
        <div className={styles.modalOverlay} onClick={() => setShowGiftCardModal(false)}>
          <div className={styles.serverModal} style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconGift size={18} /> Gift Card Payment
            </h4>
            <p className={styles.serverModalSub}>Total: ${total.toFixed(2)}</p>

            {!gcRedeemResult ? (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    className={styles.serverModalInput}
                    placeholder="Enter or scan gift card code"
                    value={gcCodeInput}
                    onChange={e => setGcCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && lookupGiftCard()}
                    autoFocus
                    style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.08em' }}
                  />
                  <button className={styles.serverModalSave} onClick={lookupGiftCard} disabled={gcLoading || !gcCodeInput.trim()} style={{ whiteSpace: 'nowrap' }}>
                    Lookup
                  </button>
                </div>
                {gcLookupError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: 12 }}>{gcLookupError}</p>}
                {gcLookup && (
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid var(--border-medium)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>Gift Card Found</span>
                      <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600 }}>ACTIVE</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Code</span>
                      <span style={{ fontFamily: 'monospace' }}>{gcLookup.code}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Balance</span>
                      <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1.1rem' }}>${gcLookup.balance.toFixed(2)}</span>
                    </div>
                    {gcLookup.balance < total && (
                      <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '8px 12px', borderRadius: 6, fontSize: '0.78rem', marginTop: 12 }}>
                        Card balance (${gcLookup.balance.toFixed(2)}) is less than total (${total.toFixed(2)}). Remaining will need secondary payment.
                      </div>
                    )}
                    <button className={styles.serverModalSave} style={{ width: '100%', marginTop: 12, padding: '12px 16px' }} onClick={redeemGiftCard} disabled={gcLoading}>
                      {gcLoading ? 'Processing...' : `Redeem $${Math.min(gcLookup.balance, total).toFixed(2)}`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ background: 'var(--success-bg)', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid rgba(74,222,128,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--success)', fontWeight: 600 }}>
                    <IconCheck size={16} /> Gift Card Redeemed
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Redeemed</span><span style={{ fontWeight: 600 }}>${Math.abs(gcRedeemResult.redeemed).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Remaining Balance</span><span>${gcRedeemResult.remaining_balance.toFixed(2)}</span>
                  </div>
                </div>
                {gcRedeemResult.remainingToPay > 0 && (
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--warning)', marginBottom: 12, fontWeight: 500 }}>Remaining: ${gcRedeemResult.remainingToPay.toFixed(2)}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className={styles.payMethodBtn} onClick={() => closeWithSplitPayment('card')} style={{ flex: 1 }}><IconCreditCard size={14} /><span>Card</span></button>
                      <button className={styles.payMethodBtn} onClick={() => closeWithSplitPayment('cash')} style={{ flex: 1 }}><IconDollarSign size={14} /><span>Cash</span></button>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className={styles.serverModalActions} style={{ marginTop: 16 }}>
              <button className={styles.serverModalClear} onClick={() => setShowGiftCardModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          WALK-IN TABLE SELECTOR
          ══════════════════════════════════════════════ */}
      {showWalkInModal && (
        <div className={styles.modalOverlay} onClick={() => setShowWalkInModal(null)}>
          <div className={styles.serverModal} style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <h4>Walk-In — Select a Table</h4>
            <p className={styles.serverModalSub}>Choose an available table to start a new order</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '16px 0' }}>
              {availableTables.map(t => (
                <button key={t.id} className={styles.walkInTableBtn} onClick={() => startWalkIn(t)}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{t.number}</span>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255 255 255 / 0.4)' }}>{t.capacity} seats</span>
                </button>
              ))}
              {availableTables.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, color: 'rgba(255 255 255 / 0.3)', fontSize: '0.85rem' }}>No tables available</div>
              )}
            </div>
            <div className={styles.serverModalActions}>
              <button className={styles.serverModalClear} onClick={() => setShowWalkInModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TABLE TRANSFER MODAL
          ══════════════════════════════════════════════ */}
      {showTableTransfer && (
        <div className={styles.modalOverlay} onClick={() => setShowTableTransfer(false)}>
          <div className={styles.serverModal} style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <h4>Transfer Table</h4>
            <p className={styles.serverModalSub}>Move order #{currentOrder?.id} to a different table</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '16px 0' }}>
              {availableTables.map(t => (
                <button key={t.id} className={styles.walkInTableBtn} onClick={() => transferTable(t.id)}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{t.number}</span>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255 255 255 / 0.4)' }}>{t.zone}</span>
                </button>
              ))}
              {availableTables.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, color: 'rgba(255 255 255 / 0.3)', fontSize: '0.85rem' }}>No available tables to transfer to</div>
              )}
            </div>
            <div className={styles.serverModalActions}>
              <button className={styles.serverModalClear} onClick={() => setShowTableTransfer(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          SPLIT CHECK MODAL
          ══════════════════════════════════════════════ */}
      {showSplitCheck && (
        <div className={styles.modalOverlay} onClick={() => setShowSplitCheck(false)}>
          <div className={styles.serverModal} style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconSplitSquare size={18} /> Split Check
            </h4>
            <p className={styles.serverModalSub}>Total: ${total.toFixed(2)}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0' }}>
              {splitPayments.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255 255 255 / 0.3)', width: 60, flexShrink: 0 }}>Guest {i + 1}</span>
                  <input
                    className={styles.serverModalInput}
                    type="number" step="0.01"
                    value={p.amount || ''}
                    onChange={e => updateSplitPayment(i, 'amount', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <select
                    value={p.method}
                    onChange={e => updateSplitPayment(i, 'method', e.target.value)}
                    style={{ padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.82rem' }}
                  >
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                  </select>
                  {splitPayments.length > 2 && (
                    <button className={styles.serverModalClear} onClick={() => removeSplitPayment(i)} style={{ padding: '6px 8px' }}>
                      <IconX size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button className={styles.orderToolBtn} onClick={addSplitPayment} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
              <IconPlus size={12} /> Add Guest
            </button>

            {(() => {
              const splitTotal = splitPayments.reduce((s, p) => s + p.amount, 0);
              const diff = Math.abs(splitTotal - total);
              return diff > 0.01 ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--warning)', marginBottom: 8 }}>
                  Split total: ${splitTotal.toFixed(2)} (${splitTotal > total ? '+' : '-'}${diff.toFixed(2)} {splitTotal > total ? 'over' : 'under'})
                </p>
              ) : null;
            })()}

            <div className={styles.serverModalActions}>
              <button className={styles.serverModalClear} onClick={() => setShowSplitCheck(false)}>Cancel</button>
              <button className={styles.serverModalSave} onClick={closeSplitCheck}>Close Split Check</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          RECEIPT VIEW
          ══════════════════════════════════════════════ */}
      {showReceipt && (
        <div className={styles.modalOverlay} onClick={() => setShowReceipt(null)}>
          <div className={styles.receiptModal} onClick={e => e.stopPropagation()}>
            <div className={styles.receiptContent}>
              <div className={styles.receiptBrand}>
                <div className={styles.receiptBrandName}>ANTICO</div>
                <div className={styles.receiptBrandSub}>RISTORANTÉ</div>
                <div className={styles.receiptBrandAddr}>531 Queen Street East · SSM, ON</div>
              </div>

              <div className={styles.receiptDivider} />

              <div className={styles.receiptMeta}>
                <div><span>Order</span><span>#{showReceipt.orderNumber}</span></div>
                <div><span>{showReceipt.table}</span><span>Server: {showReceipt.server}</span></div>
                {showReceipt.guestName && <div><span>Guest</span><span>{showReceipt.guestName}</span></div>}
                <div><span>Date</span><span>{showReceipt.date.toLocaleDateString()} {showReceipt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
              </div>

              <div className={styles.receiptDivider} />

              <div className={styles.receiptItems}>
                {showReceipt.items.map((item, i) => (
                  <div key={i} className={styles.receiptItem}>
                    <span>{item.quantity}x {item.name}{item.status === 'comped' ? ' (COMP)' : ''}</span>
                    <span>${item.status === 'comped' ? '0.00' : (item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className={styles.receiptDivider} />

              <div className={styles.receiptTotals}>
                <div><span>Subtotal</span><span>${showReceipt.subtotal.toFixed(2)}</span></div>
                {showReceipt.discount > 0 && <div><span>Discount</span><span>-${showReceipt.discount.toFixed(2)}</span></div>}
                <div><span>HST (13%)</span><span>${showReceipt.tax.toFixed(2)}</span></div>
                {showReceipt.tip > 0 && <div><span>Tip</span><span>${showReceipt.tip.toFixed(2)}</span></div>}
                <div className={styles.receiptGrandTotal}>
                  <span>TOTAL</span><span>${showReceipt.total.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.receiptDivider} />

              <div className={styles.receiptPayMethod}>
                Paid by: {showReceipt.paymentMethod}
              </div>

              <div className={styles.receiptThankYou}>
                Thank you for dining with us!
              </div>
            </div>

            <div className={styles.receiptActions}>
              <button className={styles.serverModalClear} onClick={() => setShowReceipt(null)}>Close</button>
              <button className={styles.serverModalSave} onClick={() => window.print()}>
                <IconPrinter size={13} /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
