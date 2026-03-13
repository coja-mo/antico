'use client';
import { useState, useEffect } from 'react';
import { IconLock, IconDollarSign, IconCreditCard, IconCheck, IconX, IconRefresh, IconClock } from '@/components/Icons';

export default function CloseoutPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { loadData(); loadHistory(); }, [date]);

  async function loadData() {
    setLoading(true);
    const res = await fetch(`/api/closeout?date=${date}`);
    const d = await res.json();
    setData(d);
    if (d.submitted !== false) {
      setSubmitted(true);
      setCountedCash(d.counted_cash?.toString() || '');
      setNotes(d.notes || '');
    } else {
      setSubmitted(false);
      setCountedCash('');
      setNotes('');
    }
    setLoading(false);
  }

  async function loadHistory() {
    const res = await fetch('/api/closeout');
    setHistory(await res.json());
  }

  async function submitCloseout() {
    if (!data) return;
    await fetch('/api/closeout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        total_revenue: data.total_revenue,
        total_orders: data.total_orders,
        total_tips: data.total_tips,
        card_total: data.card_total,
        cash_total: data.cash_total,
        gift_card_total: data.gift_card_total,
        expected_cash: data.expected_cash || data.cash_total,
        counted_cash: parseFloat(countedCash) || 0,
        notes,
        closed_by: 'admin',
      }),
    });
    setSubmitted(true);
    loadHistory();
  }

  const variance = data ? (parseFloat(countedCash || 0) - (data.expected_cash || data.cash_total || 0)) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>End-of-Day Closeout</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Reconcile cash drawer and finalize the day's sales
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          <button onClick={() => setShowHistory(!showHistory)} style={{ padding: '8px 16px', borderRadius: 6, background: showHistory ? 'rgba(212,168,75,0.1)' : 'var(--bg-card)', border: `1px solid ${showHistory ? 'var(--gold)' : 'var(--border-subtle)'}`, cursor: 'pointer', color: showHistory ? 'var(--gold)' : 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <IconClock size={13} /> History
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : showHistory ? (
        /* History */
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Date', 'Revenue', 'Orders', 'Tips', 'Card', 'Cash', 'Variance', 'Closed By'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No closeout records yet</td></tr>
              ) : history.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => { setDate(c.date); setShowHistory(false); }}>
                  <td style={{ padding: '12px 14px', fontWeight: 500 }}>{new Date(c.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--gold)', fontWeight: 600 }}>${c.total_revenue.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px' }}>{c.total_orders}</td>
                  <td style={{ padding: '12px 14px' }}>${c.total_tips.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px' }}>${c.card_total.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px' }}>${c.cash_total.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: c.variance === 0 ? 'var(--success)' : c.variance > 0 ? '#3b82f6' : '#ef4444' }}>
                    {c.variance >= 0 ? '+' : ''}${c.variance.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{c.closed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Status Banner */}
          {submitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, marginBottom: 20, fontSize: '0.85rem', color: '#4ade80' }}>
              <IconCheck size={16} />
              <span style={{ fontWeight: 600 }}>Closeout submitted for this date</span>
            </div>
          )}

          {data?.open_orders > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, marginBottom: 20, fontSize: '0.85rem', color: '#ef4444' }}>
              <IconX size={16} />
              <span style={{ fontWeight: 600 }}>{data.open_orders} open order{data.open_orders > 1 ? 's' : ''} — close all orders before finalizing</span>
            </div>
          )}

          {/* Revenue Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Revenue', value: `$${(data?.total_revenue || 0).toFixed(2)}`, color: 'var(--gold)' },
              { label: 'Orders', value: data?.total_orders || 0, color: 'var(--text-primary)' },
              { label: 'Tips', value: `$${(data?.total_tips || 0).toFixed(2)}`, color: 'var(--success)' },
              { label: 'Avg Check', value: `$${data?.total_orders ? ((data.total_revenue || 0) / data.total_orders).toFixed(2) : '0.00'}`, color: 'var(--info)' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-heading)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Payment Breakdown */}
          <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-secondary)' }}>Payment Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Card Payments', value: `$${(data?.card_total || 0).toFixed(2)}`, icon: <IconCreditCard size={16} />, color: '#3b82f6' },
              { label: 'Cash Payments', value: `$${(data?.cash_total || 0).toFixed(2)}`, icon: <IconDollarSign size={16} />, color: '#22c55e' },
              { label: 'Gift Card Payments', value: `$${(data?.gift_card_total || 0).toFixed(2)}`, icon: <IconDollarSign size={16} />, color: '#a855f7' },
            ].map(p => (
              <div key={p.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `${p.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{p.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Cash Reconciliation */}
          <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-secondary)' }}>Cash Drawer Reconciliation</h3>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Expected Cash</label>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  ${(data?.expected_cash || data?.cash_total || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Counted Cash</label>
                <input
                  type="number" step="0.01"
                  placeholder="Enter counted amount"
                  value={countedCash}
                  onChange={e => setCountedCash(e.target.value)}
                  disabled={submitted}
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Variance</label>
                <div style={{
                  fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-heading)',
                  color: !countedCash ? 'var(--text-muted)' : variance === 0 ? '#22c55e' : variance > 0 ? '#3b82f6' : '#ef4444',
                }}>
                  {countedCash ? `${variance >= 0 ? '+' : ''}$${variance.toFixed(2)}` : '—'}
                </div>
                {countedCash && variance !== 0 && (
                  <div style={{ fontSize: '0.72rem', color: variance > 0 ? '#3b82f6' : '#ef4444', marginTop: 2 }}>
                    {variance > 0 ? 'Over' : 'Short'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Closeout Notes</label>
            <textarea
              placeholder="Any notes for this closeout..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={submitted}
              rows={3}
              style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Submit */}
          {!submitted && (
            <button
              onClick={submitCloseout}
              disabled={!countedCash}
              style={{
                width: '100%', padding: '14px', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                background: countedCash ? 'var(--gold)' : 'var(--bg-card)',
                border: countedCash ? 'none' : '1px solid var(--border-subtle)',
                color: countedCash ? '#0a0a0a' : 'var(--text-muted)',
                opacity: countedCash ? 1 : 0.5,
              }}
            >
              <IconLock size={14} /> Submit Closeout
            </button>
          )}
        </>
      )}
    </div>
  );
}
