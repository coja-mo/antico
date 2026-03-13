'use client';
import { useState, useEffect } from 'react';
import { IconPackage, IconSearch, IconRefresh, IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconArrowUp } from '@/components/Icons';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'produce', label: 'Produce' },
  { key: 'protein', label: 'Protein' },
  { key: 'dairy', label: 'Dairy' },
  { key: 'dry_goods', label: 'Dry Goods' },
  { key: 'beverage', label: 'Beverages' },
  { key: 'other', label: 'Other' },
];

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showRestock, setShowRestock] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [newItem, setNewItem] = useState({ name: '', category: 'produce', unit: 'lb', quantity: 0, par_level: 0, cost_per_unit: 0, supplier: '' });

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    const res = await fetch('/api/inventory');
    setItems(await res.json());
    setLoading(false);
  }

  async function addItem() {
    if (!newItem.name) return;
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    setShowAdd(false);
    setNewItem({ name: '', category: 'produce', unit: 'lb', quantity: 0, par_level: 0, cost_per_unit: 0, supplier: '' });
    loadItems();
  }

  async function restockItem() {
    if (!showRestock || !restockQty) return;
    await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: showRestock.id, action: 'restock', quantity: parseFloat(restockQty) }),
    });
    setShowRestock(null);
    setRestockQty('');
    loadItems();
  }

  async function wasteItem(item) {
    const qty = prompt(`Waste quantity for ${item.name} (${item.unit}s):`);
    if (!qty || isNaN(qty)) return;
    await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, action: 'waste', quantity: parseFloat(qty), notes: 'Manual waste log' }),
    });
    loadItems();
  }

  async function deleteItem(id) {
    if (!confirm('Remove this inventory item?')) return;
    await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
    loadItems();
  }

  const filtered = items.filter(i => {
    if (category !== 'all' && i.category !== category) return false;
    if (showLowOnly && i.quantity > i.par_level) return false;
    if (search) {
      const s = search.toLowerCase();
      return i.name.toLowerCase().includes(s) || (i.supplier || '').toLowerCase().includes(s);
    }
    return true;
  });

  const totalValue = items.reduce((s, i) => s + i.quantity * i.cost_per_unit, 0);
  const lowStockCount = items.filter(i => i.quantity <= i.par_level).length;
  const zeroStockCount = items.filter(i => i.quantity <= 0).length;

  const catStyle = (key) => ({
    padding: '6px 14px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
    background: category === key ? 'rgba(212,168,75,0.1)' : 'var(--bg-card)',
    border: `1px solid ${category === key ? 'var(--gold)' : 'var(--border-subtle)'}`,
    color: category === key ? 'var(--gold)' : 'var(--text-secondary)',
  });

  function getStockLevel(item) {
    if (item.quantity <= 0) return { color: '#ef4444', label: 'OUT', bg: 'rgba(239,68,68,0.08)' };
    if (item.quantity <= item.par_level * 0.5) return { color: '#ef4444', label: 'CRITICAL', bg: 'rgba(239,68,68,0.06)' };
    if (item.quantity <= item.par_level) return { color: '#f59e0b', label: 'LOW', bg: 'rgba(245,158,11,0.06)' };
    return { color: '#22c55e', label: 'OK', bg: 'transparent' };
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Inventory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Track stock levels, costs, and suppliers
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#0a0a0a', fontSize: '0.82rem', fontWeight: 600 }}>
            <IconPlus size={14} /> Add Item
          </button>
          <button onClick={loadItems} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <IconRefresh size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Items', value: items.length, color: 'var(--text-primary)' },
          { label: 'Inventory Value', value: `$${totalValue.toFixed(0)}`, color: 'var(--gold)' },
          { label: 'Low Stock', value: lowStockCount, color: '#f59e0b' },
          { label: 'Out of Stock', value: zeroStockCount, color: '#ef4444' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-heading)' }}>{stat.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '0 12px', minWidth: 200 }}>
          <IconSearch size={14} color="var(--text-muted)" />
          <input style={{ flex: 1, padding: '10px 0', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} placeholder="Search items or suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)} style={catStyle(c.key)}>{c.label}</button>
        ))}
        <button onClick={() => setShowLowOnly(!showLowOnly)} style={{
          ...catStyle('_low'), 
          background: showLowOnly ? 'rgba(245,158,11,0.1)' : 'var(--bg-card)',
          border: `1px solid ${showLowOnly ? '#f59e0b' : 'var(--border-subtle)'}`,
          color: showLowOnly ? '#f59e0b' : 'var(--text-secondary)',
        }}>Low Stock Only</button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Item', 'Category', 'Stock', 'Par Level', 'Status', 'Unit Cost', 'Value', 'Supplier', ''].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No items found</td></tr>
            ) : filtered.map(item => {
              const stock = getStockLevel(item);
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: stock.bg }}>
                  <td style={{ padding: '12px 14px', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: '12px 14px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{item.category.replace('_', ' ')}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontWeight: 600, color: stock.color }}>{item.quantity}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{item.unit}</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{item.par_level} {item.unit}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.65rem', fontWeight: 700, background: `${stock.color}18`, color: stock.color }}>{stock.label}</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>${item.cost_per_unit.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--gold)' }}>${(item.quantity * item.cost_per_unit).toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.supplier || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setShowRestock(item); setRestockQty(''); }} title="Restock" style={{ padding: '4px 8px', borderRadius: 4, cursor: 'pointer', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem' }}>
                        <IconArrowUp size={10} /> Restock
                      </button>
                      <button onClick={() => wasteItem(item)} title="Log waste" style={{ padding: '4px 8px', borderRadius: 4, cursor: 'pointer', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem' }}>
                        <IconTrash size={10} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 12, padding: 24, width: 440 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Add Inventory Item</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <input placeholder="Item name *" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {CATEGORIES.filter(c => c.key !== 'all').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <input placeholder="Unit (lb, ea, L...)" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>QTY</label>
                  <input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)||0})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>PAR</label>
                  <input type="number" value={newItem.par_level} onChange={e => setNewItem({...newItem, par_level: parseFloat(e.target.value)||0})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>COST</label>
                  <input type="number" step="0.01" value={newItem.cost_per_unit} onChange={e => setNewItem({...newItem, cost_per_unit: parseFloat(e.target.value)||0})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
              </div>
              <input placeholder="Supplier" value={newItem.supplier} onChange={e => setNewItem({...newItem, supplier: e.target.value})} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={addItem} disabled={!newItem.name} style={{ padding: '8px 16px', borderRadius: 6, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#0a0a0a', fontSize: '0.82rem', fontWeight: 600, opacity: newItem.name ? 1 : 0.4 }}>Add Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowRestock(null)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 12, padding: 24, width: 360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Restock</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 16px' }}>{showRestock.name}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 12, fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Current Stock</span>
              <span style={{ fontWeight: 600 }}>{showRestock.quantity} {showRestock.unit}</span>
            </div>
            <input type="number" placeholder={`Quantity to add (${showRestock.unit})`} value={restockQty} onChange={e => setRestockQty(e.target.value)} autoFocus style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 8 }} />
            {restockQty && (
              <p style={{ fontSize: '0.78rem', color: 'var(--gold)', margin: '4px 0 12px' }}>
                New stock: {showRestock.quantity + parseFloat(restockQty || 0)} {showRestock.unit} · Cost: ${((parseFloat(restockQty || 0)) * showRestock.cost_per_unit).toFixed(2)}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowRestock(null)} style={{ padding: '8px 16px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={restockItem} disabled={!restockQty} style={{ padding: '8px 16px', borderRadius: 6, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer', color: '#4ade80', fontSize: '0.82rem', fontWeight: 600, opacity: restockQty ? 1 : 0.4 }}>Restock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
