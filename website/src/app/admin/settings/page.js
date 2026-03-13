'use client';
import { useState, useEffect } from 'react';
import { IconSettings, IconSearch, IconPlus, IconCheck, IconX, IconEdit, IconTrash, IconToggle, IconUsers, IconClock, IconMapPin, IconPhone } from '@/components/Icons';
import styles from '../admin.module.css';

const CATEGORIES = [
  { key: 'appetizer', label: 'Appetizers' },
  { key: 'salad', label: 'Salads' },
  { key: 'entree', label: 'Entrees' },
  { key: 'dessert', label: 'Desserts' },
  { key: 'beverage', label: 'Beverages' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('menu');

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>Menu editor, staff accounts, and restaurant configuration</p>
      </div>

      <div className={styles.toolbar}>
        {[
          { key: 'menu', label: 'Menu Editor', icon: '🍽' },
          { key: 'staff', label: 'Staff', icon: '👤' },
          { key: 'floor', label: 'Floor Plan', icon: '🗺' },
          { key: 'info', label: 'Restaurant Info', icon: '📍' },
          { key: 'hours', label: 'Hours', icon: '🕐' },
        ].map(t => (
          <button key={t.key}
            className={`${styles.filterBtn} ${tab === t.key ? styles.filterBtnActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'menu' && <MenuEditorTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'floor' && <FloorPlanTab />}
      {tab === 'info' && <RestaurantInfoTab />}
      {tab === 'hours' && <HoursTab />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MENU EDITOR TAB
   ═══════════════════════════════════════════ */
function MenuEditorTab() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', category: 'appetizer', subcategory: '', price: '' });

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    const res = await fetch('/api/menu?all=1');
    setItems(await res.json());
  }

  async function toggleAvailability(item) {
    await fetch('/api/menu', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, available: !item.available }),
    });
    loadItems();
  }

  async function addItem() {
    if (!newItem.name || !newItem.price) return;
    await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, price: parseFloat(newItem.price) }),
    });
    setNewItem({ name: '', description: '', category: 'appetizer', subcategory: '', price: '' });
    setShowAddForm(false);
    loadItems();
  }

  async function saveEdit() {
    if (!editingItem) return;
    await fetch('/api/menu', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingItem.id,
        name: editingItem.name,
        description: editingItem.description,
        category: editingItem.category,
        subcategory: editingItem.subcategory,
        price: parseFloat(editingItem.price),
      }),
    });
    setEditingItem(null);
    loadItems();
  }

  async function deleteItem(id) {
    if (!confirm('Remove this menu item?')) return;
    await fetch('/api/menu', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadItems();
  }

  const filtered = items.filter(i => {
    if (catFilter !== 'all' && i.category !== catFilter) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <IconSearch size={15} />
          <input className={styles.searchInput} placeholder="Search menu items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[{ key: 'all', label: 'All' }, ...CATEGORIES].map(c => (
          <button key={c.key} className={`${styles.filterBtn} ${catFilter === c.key ? styles.filterBtnActive : ''}`} onClick={() => setCatFilter(c.key)}>
            {c.label}
          </button>
        ))}
        <button className={`${styles.actionBtn} ${styles.actionBtnGold}`} onClick={() => setShowAddForm(true)}>
          <IconPlus size={13} /> Add Item
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className={styles.cardSection} style={{ marginBottom: 16 }}>
          <div className={styles.cardSectionHeader}>
            <span className={styles.cardSectionTitle}>New Menu Item</span>
            <button className={styles.closeBtn} onClick={() => setShowAddForm(false)}><IconX size={14} /></button>
          </div>
          <div className={styles.cardSectionContent} style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className={styles.formField}>
                <label>Name</label>
                <input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Item name..." />
              </div>
              <div className={styles.formField}>
                <label>Price ($)</label>
                <input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="0.00" />
              </div>
              <div className={styles.formField}>
                <label>Category</label>
                <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} style={selectStyle}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className={styles.formField}>
                <label>Subcategory (optional)</label>
                <input value={newItem.subcategory} onChange={e => setNewItem({...newItem, subcategory: e.target.value})} placeholder="e.g. wine, cocktail..." />
              </div>
              <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <input value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Short description..." />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className={`${styles.actionBtn} ${styles.actionBtnDefault}`} onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={addItem} disabled={!newItem.name || !newItem.price}>
                <IconCheck size={13} /> Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0 0 0 / 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setEditingItem(null)}>
          <div style={{ background: '#141414', border: '1px solid rgba(255 255 255 / 0.08)', borderRadius: 12, padding: 24, width: 440 }} onClick={e => e.stopPropagation()}>
            <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Edit Menu Item</h4>
            <div style={{ display: 'grid', gap: 12 }}>
              <div className={styles.formField}>
                <label>Name</label>
                <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles.formField}>
                  <label>Price ($)</label>
                  <input type="number" step="0.01" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} />
                </div>
                <div className={styles.formField}>
                  <label>Category</label>
                  <select value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} style={selectStyle}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formField}>
                <label>Subcategory</label>
                <input value={editingItem.subcategory || ''} onChange={e => setEditingItem({...editingItem, subcategory: e.target.value})} placeholder="e.g. wine, cocktail..." />
              </div>
              <div className={styles.formField}>
                <label>Description</label>
                <input value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className={`${styles.actionBtn} ${styles.actionBtnDefault}`} onClick={() => setEditingItem(null)}>Cancel</button>
              <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={saveEdit}><IconCheck size={13} /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className={styles.cardSection}>
        <div className={styles.cardSectionHeader}>
          <span className={styles.cardSectionTitle}>Menu Items</span>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255 255 255 / 0.3)' }}>{filtered.length} items</span>
        </div>
        <div className={styles.cardSectionContent}>
          {filtered.length > 0 ? (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} style={{ opacity: item.available ? 1 : 0.45 }}>
                    <td>
                      <div className={styles.cellPrimary}>{item.name}</div>
                      <div className={styles.cellMuted}>{item.description || '\u2014'}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                        {item.category}{item.subcategory ? ` · ${item.subcategory}` : ''}
                      </span>
                    </td>
                    <td className={styles.cellPrimary}>${parseFloat(item.price).toFixed(2)}</td>
                    <td>
                      <button
                        className={`${styles.statusBadge} ${item.available ? styles.statusConfirmed : styles.statusDeclined}`}
                        onClick={() => toggleAvailability(item)}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {item.available ? 'Available' : '86\'d'}
                      </button>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDefault}`} onClick={() => setEditingItem({ ...item })}>
                          <IconEdit size={12} />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => deleteItem(item.id)}>
                          <IconTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No items match your filter</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const selectStyle = {
  width: '100%', padding: '11px 14px', background: 'var(--bg-secondary)',
  border: '1px solid var(--border-subtle)', borderRadius: 8,
  color: 'var(--text-primary)', fontSize: '0.9rem',
};

/* ═══════════════════════════════════════════
   STAFF TAB
   ═══════════════════════════════════════════ */
function StaffTab() {
  const [staff, setStaff] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newStaff, setNewStaff] = useState({ username: '', password: '', name: '', role: 'staff' });

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    const res = await fetch('/api/staff');
    setStaff(await res.json());
  }

  async function addStaff() {
    if (!newStaff.username || !newStaff.password || !newStaff.name) return;
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff),
    });
    if (res.ok) {
      setNewStaff({ username: '', password: '', name: '', role: 'staff' });
      setShowAdd(false);
      loadStaff();
    }
  }

  async function removeStaff(id, name) {
    if (!confirm(`Remove ${name} from staff?`)) return;
    await fetch('/api/staff', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadStaff();
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className={`${styles.actionBtn} ${styles.actionBtnGold}`} onClick={() => setShowAdd(true)}>
          <IconPlus size={13} /> Add Staff Member
        </button>
      </div>

      {showAdd && (
        <div className={styles.cardSection} style={{ marginBottom: 16 }}>
          <div className={styles.cardSectionHeader}>
            <span className={styles.cardSectionTitle}>New Staff Member</span>
            <button className={styles.closeBtn} onClick={() => setShowAdd(false)}><IconX size={14} /></button>
          </div>
          <div className={styles.cardSectionContent} style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className={styles.formField}>
                <label>Display Name</label>
                <input value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="Full name..." />
              </div>
              <div className={styles.formField}>
                <label>Role</label>
                <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} style={selectStyle}>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label>Username</label>
                <input value={newStaff.username} onChange={e => setNewStaff({...newStaff, username: e.target.value})} placeholder="login username..." />
              </div>
              <div className={styles.formField}>
                <label>Password</label>
                <input type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} placeholder="••••••••" />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className={`${styles.actionBtn} ${styles.actionBtnDefault}`} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={addStaff}><IconCheck size={13} /> Create</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.cardSection}>
        <div className={styles.cardSectionContent}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 6,
                        background: 'rgba(212,168,75,0.12)', color: 'var(--gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: '0.72rem',
                      }}>
                        {s.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className={styles.cellPrimary}>{s.name}</span>
                    </div>
                  </td>
                  <td>{s.username}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${s.role === 'admin' ? styles.statusConfirmed : styles.statusSeated}`}
                      style={{ textTransform: 'capitalize' }}>
                      {s.role}
                    </span>
                  </td>
                  <td className={styles.cellMuted}>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => removeStaff(s.id, s.name)}>
                      <IconTrash size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   RESTAURANT INFO TAB
   ═══════════════════════════════════════════ */
function RestaurantInfoTab() {
  const info = [
    { label: 'Restaurant Name', value: 'Antico Ristoranté', icon: IconSettings },
    { label: 'Location', value: '531 Queen Street East, Sault Ste. Marie, ON', icon: IconMapPin },
    { label: 'Phone', value: '(705) 942-3404', icon: IconPhone },
    { label: 'Cuisine', value: 'Fine Italian Dining', icon: IconSettings },
    { label: 'Capacity', value: '12 Tables · 54 Seats', icon: IconUsers },
    { label: 'Tax Rate', value: '13% HST (Ontario)', icon: IconSettings },
  ];

  return (
    <div className={styles.cardSection}>
      <div className={styles.cardSectionHeader}>
        <span className={styles.cardSectionTitle}>Restaurant Details</span>
      </div>
      <div className={styles.cardSectionContent} style={{ padding: 4 }}>
        {info.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className={styles.detailRow} style={{ padding: '14px 20px' }}>
              <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} /> {item.label}
              </span>
              <span className={styles.detailValue}>{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HOURS TAB
   ═══════════════════════════════════════════ */
function HoursTab() {
  const hours = [
    { day: 'Monday', open: 'Closed', status: 'closed' },
    { day: 'Tuesday', open: '4:00 PM – 9:00 PM', status: 'open' },
    { day: 'Wednesday', open: '4:00 PM – 9:00 PM', status: 'open' },
    { day: 'Thursday', open: '4:00 PM – 9:00 PM', status: 'open' },
    { day: 'Friday', open: '4:00 PM – 10:00 PM', status: 'open' },
    { day: 'Saturday', open: '4:00 PM – 10:00 PM', status: 'open' },
    { day: 'Sunday', open: '4:00 PM – 9:00 PM', status: 'open' },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className={styles.cardSection}>
      <div className={styles.cardSectionHeader}>
        <span className={styles.cardSectionTitle}>Operating Hours</span>
      </div>
      <div className={styles.cardSectionContent} style={{ padding: 4 }}>
        {hours.map((h, i) => (
          <div key={i} className={styles.detailRow} style={{
            padding: '14px 20px',
            background: h.day === today ? 'rgba(212,168,75,0.04)' : undefined,
          }}>
            <span className={styles.detailLabel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconClock size={14} />
              {h.day}
              {h.day === today && (
                <span className={`${styles.statusBadge} ${styles.statusConfirmed}`} style={{ marginLeft: 8 }}>Today</span>
              )}
            </span>
            <span className={styles.detailValue} style={{
              color: h.status === 'closed' ? 'var(--danger)' : 'var(--text-primary)',
            }}>
              {h.open}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FLOOR PLAN TAB
   ═══════════════════════════════════════════ */
function FloorPlanTab() {
  const [tables, setTables] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', capacity: 4, zone: 'main', shape: 'square' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTables(); }, []);

  async function loadTables() {
    setLoading(true);
    const res = await fetch('/api/tables');
    setTables(await res.json());
    setLoading(false);
  }

  async function addTable() {
    if (!newTable.number || !newTable.capacity) return;
    await fetch('/api/tables/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTable),
    });
    setShowAdd(false);
    setNewTable({ number: '', capacity: 4, zone: 'main', shape: 'square' });
    loadTables();
  }

  async function deleteTable(id, name) {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return;
    await fetch(`/api/tables/manage?id=${id}`, { method: 'DELETE' });
    loadTables();
  }

  const zones = [...new Set(tables.map(t => t.zone))];
  const zoneColors = { main: '#3b82f6', window: '#22c55e', bar: '#a855f7', patio: '#f59e0b', private: '#ef4444' };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {zones.map(z => (
            <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: zoneColors[z] || '#666' }} />
              {z.charAt(0).toUpperCase() + z.slice(1)} ({tables.filter(t => t.zone === z).length})
            </div>
          ))}
        </div>
        <button className={`${styles.actionBtn} ${styles.actionBtnGold}`} onClick={() => setShowAdd(true)}>
          <IconPlus size={13} /> Add Table
        </button>
      </div>

      {showAdd && (
        <div className={styles.cardSection} style={{ marginBottom: 16 }}>
          <div className={styles.cardSectionHeader}>
            <span className={styles.cardSectionTitle}>New Table</span>
            <button className={styles.closeBtn} onClick={() => setShowAdd(false)}><IconX size={14} /></button>
          </div>
          <div className={styles.cardSectionContent} style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <div className={styles.formField}>
                <label>Number</label>
                <input type="number" value={newTable.number} onChange={e => setNewTable({...newTable, number: e.target.value})} placeholder="13" />
              </div>
              <div className={styles.formField}>
                <label>Capacity</label>
                <input type="number" value={newTable.capacity} onChange={e => setNewTable({...newTable, capacity: parseInt(e.target.value) || 2})} />
              </div>
              <div className={styles.formField}>
                <label>Zone</label>
                <select value={newTable.zone} onChange={e => setNewTable({...newTable, zone: e.target.value})} style={selectStyle}>
                  <option value="main">Main</option>
                  <option value="window">Window</option>
                  <option value="bar">Bar</option>
                  <option value="patio">Patio</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label>Shape</label>
                <select value={newTable.shape} onChange={e => setNewTable({...newTable, shape: e.target.value})} style={selectStyle}>
                  <option value="square">Square</option>
                  <option value="round">Round</option>
                  <option value="rect">Rectangle</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className={`${styles.actionBtn} ${styles.actionBtnDefault}`} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className={`${styles.actionBtn} ${styles.actionBtnConfirm}`} onClick={addTable} disabled={!newTable.number}>
                <IconCheck size={13} /> Add Table
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.cardSection}>
        <div className={styles.cardSectionContent}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Capacity</th>
                <th>Zone</th>
                <th>Shape</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : tables.map(t => (
                <tr key={t.id}>
                  <td className={styles.cellPrimary}>{t.number}</td>
                  <td>{t.name || `Table ${t.number}`}</td>
                  <td>{t.capacity} seats</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem',
                      background: `${zoneColors[t.zone] || '#666'}15`,
                      color: zoneColors[t.zone] || '#666',
                      textTransform: 'capitalize',
                    }}>{t.zone}</span>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.shape}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${t.status === 'available' ? styles.statusConfirmed : styles.statusSeated}`}
                      style={{ textTransform: 'capitalize' }}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => deleteTable(t.id, t.name || `Table ${t.number}`)}>
                      <IconTrash size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: '10px 16px', background: 'rgba(212,168,75,0.04)', border: '1px solid rgba(212,168,75,0.1)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Total: {tables.length} tables · {tables.reduce((s, t) => s + t.capacity, 0)} seats
      </div>
    </>
  );
}
