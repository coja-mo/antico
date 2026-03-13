'use client';
import { useState, useEffect } from 'react';
import { IconListOrdered, IconPlus, IconRefresh, IconCheck, IconX, IconClock, IconUsers, IconMapPin } from '@/components/Icons';

export default function WaitlistPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ guest_name: '', phone: '', party_size: 2, notes: '', quoted_wait: 15 });
  const [tables, setTables] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { loadData(); }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  async function loadData() {
    setLoading(true);
    const [wRes, tRes] = await Promise.all([
      fetch('/api/waitlist'),
      fetch('/api/tables'),
    ]);
    setEntries(await wRes.json());
    setTables(await tRes.json());
    setLoading(false);
  }

  async function addEntry() {
    if (!form.guest_name || !form.party_size) return;
    await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowAdd(false);
    setForm({ guest_name: '', phone: '', party_size: 2, notes: '', quoted_wait: 15 });
    loadData();
  }

  async function updateStatus(id, status) {
    await fetch('/api/waitlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    loadData();
  }

  async function removeEntry(id) {
    await fetch(`/api/waitlist?id=${id}`, { method: 'DELETE' });
    loadData();
  }

  function getWaitTime(entry) {
    const added = new Date(entry.added_at).getTime();
    const mins = Math.floor((now - added) / 60000);
    if (mins < 1) return 'Just added';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  function isOverQuote(entry) {
    const added = new Date(entry.added_at).getTime();
    const mins = Math.floor((now - added) / 60000);
    return mins > entry.quoted_wait;
  }

  const waitingCount = entries.filter(e => e.status === 'waiting').length;
  const notifiedCount = entries.filter(e => e.status === 'notified').length;
  const totalCovers = entries.filter(e => e.status === 'waiting' || e.status === 'notified').reduce((s, e) => s + e.party_size, 0);
  const availableTables = tables.filter(t => t.status === 'available');
  const avgWait = entries.length > 0 ? Math.round(entries.reduce((s, e) => { const m = Math.floor((now - new Date(e.added_at).getTime()) / 60000); return s + m; }, 0) / entries.length) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Waitlist</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Manage walk-in queue and estimated wait times
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#0a0a0a', fontSize: '0.82rem', fontWeight: 600 }}>
            <IconPlus size={14} /> Add Party
          </button>
          <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <IconRefresh size={14} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Waiting', value: waitingCount, color: '#f59e0b' },
          { label: 'Notified', value: notifiedCount, color: '#3b82f6' },
          { label: 'Total Covers', value: totalCovers, color: 'var(--text-primary)' },
          { label: 'Avg Wait', value: `${avgWait}m`, color: 'var(--gold)' },
          { label: 'Tables Free', value: availableTables.length, color: '#22c55e' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-heading)' }}>{stat.value}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '60px 20px', textAlign: 'center' }}>
            <IconListOrdered size={32} color="rgba(255,255,255,0.1)" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 12 }}>Waitlist is empty</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', opacity: 0.5 }}>Add a party to get started</p>
          </div>
        ) : entries.map((entry, idx) => {
          const overQuote = isOverQuote(entry);
          const isNotified = entry.status === 'notified';
          return (
            <div key={entry.id} style={{
              background: isNotified ? 'rgba(59,130,246,0.04)' : overQuote ? 'rgba(239,68,68,0.03)' : 'var(--bg-card)',
              border: `1px solid ${isNotified ? 'rgba(59,130,246,0.2)' : overQuote ? 'rgba(239,68,68,0.15)' : 'var(--border-subtle)'}`,
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              {/* Position */}
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(212,168,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--gold)', fontSize: '1rem', fontFamily: 'var(--font-heading)', flexShrink: 0 }}>
                {idx + 1}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{entry.guest_name}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconUsers size={11} /> {entry.party_size}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: overQuote ? '#ef4444' : 'inherit' }}>
                    <IconClock size={11} /> {getWaitTime(entry)}
                  </span>
                  {entry.quoted_wait && <span>Est: {entry.quoted_wait}m</span>}
                  {entry.phone && <span>{entry.phone}</span>}
                </div>
                {entry.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, opacity: 0.6 }}>{entry.notes}</div>}
              </div>

              {/* Status */}
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                background: isNotified ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.08)',
                color: isNotified ? '#60a5fa' : '#f59e0b',
              }}>{entry.status}</span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {entry.status === 'waiting' && (
                  <button onClick={() => updateStatus(entry.id, 'notified')} title="Notify guest" style={{ padding: '6px 12px', borderRadius: 6, cursor: 'pointer', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 500 }}>
                    Notify
                  </button>
                )}
                <button onClick={() => updateStatus(entry.id, 'seated')} title="Seat party" style={{ padding: '6px 12px', borderRadius: 6, cursor: 'pointer', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 500 }}>
                  <IconMapPin size={11} /> Seat
                </button>
                <button onClick={() => removeEntry(entry.id)} title="Remove" style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                  <IconX size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Party Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 12, padding: 24, width: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Add to Waitlist</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <input placeholder="Guest name *" value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})} autoFocus style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>PARTY SIZE</label>
                  <input type="number" min="1" value={form.party_size} onChange={e => setForm({...form, party_size: parseInt(e.target.value) || 1})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>EST. WAIT (min)</label>
                  <input type="number" min="5" step="5" value={form.quoted_wait} onChange={e => setForm({...form, quoted_wait: parseInt(e.target.value) || 15})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
              </div>
              <input placeholder="Phone number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
              <input placeholder="Notes (allergies, preferences...)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={addEntry} disabled={!form.guest_name} style={{ padding: '8px 16px', borderRadius: 6, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#0a0a0a', fontSize: '0.82rem', fontWeight: 600, opacity: form.guest_name ? 1 : 0.4 }}>Add to Waitlist</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
