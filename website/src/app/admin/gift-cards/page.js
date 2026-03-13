'use client';
import { useState, useEffect } from 'react';
import { IconGift, IconSearch, IconRefresh, IconDollarSign, IconCheck, IconX, IconChevronRight } from '@/components/Icons';

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState({ total: 0, active_count: 0, total_sold: 0, outstanding_balance: 0, depleted_count: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => { loadCards(); }, []);

  async function loadCards() {
    setLoading(true);
    try {
      const res = await fetch('/api/gift-cards');
      const data = await res.json();
      setCards(data.cards || data);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Failed to load gift cards:', err);
    }
    setLoading(false);
  }

  async function loadCardDetail(code) {
    try {
      const res = await fetch(`/api/gift-cards/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCard(data);
      }
    } catch (err) {
      console.error('Failed to load card detail:', err);
    }
  }

  async function deactivateCard(code) {
    try {
      await fetch(`/api/gift-cards/${encodeURIComponent(code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive', performed_by: 'admin' }),
      });
      loadCards();
      setSelectedCard(null);
    } catch (err) {
      console.error('Failed to deactivate card:', err);
    }
  }

  const filtered = cards.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        c.code.toLowerCase().includes(s) ||
        (c.recipient_name || '').toLowerCase().includes(s) ||
        (c.sender_name || '').toLowerCase().includes(s) ||
        (c.recipient_email || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Gift Cards</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Manage all gift cards, view balances, and track transactions
          </p>
        </div>
        <button
          onClick={loadCards}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}
        >
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Cards', value: stats.total || cards.length, color: 'var(--text-primary)' },
          { label: 'Active', value: stats.active_count || 0, color: 'var(--success)' },
          { label: 'Total Sold', value: `$${(stats.total_sold || 0).toFixed(2)}`, color: 'var(--gold)' },
          { label: 'Outstanding Balance', value: `$${(stats.outstanding_balance || 0).toFixed(2)}`, color: 'var(--info)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-heading)' }}>{stat.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '0 12px' }}>
          <IconSearch size={14} color="var(--text-muted)" />
          <input
            style={{ flex: 1, padding: '10px 0', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
            placeholder="Search by code, name, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {['all', 'active', 'depleted', 'inactive'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 14px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
              background: filter === f ? 'rgba(212, 168, 75, 0.1)' : 'var(--bg-card)',
              border: `1px solid ${filter === f ? 'var(--gold)' : 'var(--border-subtle)'}`,
              color: filter === f ? 'var(--gold)' : 'var(--text-secondary)',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Code', 'Recipient', 'Amount', 'Balance', 'Status', 'Purchased', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No gift cards found</td></tr>
            ) : filtered.map(card => (
              <tr key={card.id} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => loadCardDetail(card.code)}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', letterSpacing: '0.06em', color: 'var(--gold)' }}>{card.code}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div>{card.recipient_name || '—'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{card.recipient_email || card.recipient_phone || ''}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>${card.initial_amount.toFixed(2)}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: card.balance > 0 ? 'var(--success)' : 'var(--text-muted)' }}>${card.balance.toFixed(2)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
                    background: card.status === 'active' ? 'var(--success-bg)' : card.status === 'depleted' ? 'rgba(148,163,184,0.1)' : 'var(--danger-bg)',
                    color: card.status === 'active' ? 'var(--success)' : card.status === 'depleted' ? '#94a3b8' : 'var(--danger)',
                  }}>{card.status}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(card.purchased_at || card.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <IconChevronRight size={12} color="var(--text-muted)" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedCard(null)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 12, padding: 24, maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Gift Card Details</h3>
              <button onClick={() => setSelectedCard(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}><IconX size={16} /></button>
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 16, textAlign: 'center', padding: '12px', background: 'rgba(212,168,75,0.05)', borderRadius: 8, border: '1px solid var(--border-medium)' }}>
              {selectedCard.code}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Balance', value: `$${selectedCard.balance.toFixed(2)}` },
                { label: 'Original Amount', value: `$${selectedCard.initial_amount.toFixed(2)}` },
                { label: 'Status', value: selectedCard.status },
                { label: 'Delivery', value: selectedCard.delivery_method },
                { label: 'Recipient', value: selectedCard.recipient_name || '—' },
                { label: 'Sender', value: selectedCard.sender_name || '—' },
              ].map(d => (
                <div key={d.label}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: 2 }}>{d.value}</div>
                </div>
              ))}
            </div>

            {selectedCard.personal_message && (
              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                &ldquo;{selectedCard.personal_message}&rdquo;
              </div>
            )}

            {/* Transactions */}
            <h4 style={{ fontSize: '0.85rem', marginBottom: 8, marginTop: 16 }}>Transactions</h4>
            {(!selectedCard.transactions || selectedCard.transactions.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No transactions</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedCard.transactions.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{tx.type}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {tx.description} &bull; {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: tx.amount >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Bal: ${tx.balance_after.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {selectedCard.status === 'active' && (
              <button
                onClick={() => { if (confirm('Deactivate this gift card?')) deactivateCard(selectedCard.code); }}
                style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 6, background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 500, fontSize: '0.82rem' }}
              >
                Deactivate Card
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
