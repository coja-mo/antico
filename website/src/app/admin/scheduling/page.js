'use client';
import { useState, useEffect } from 'react';
import { IconCalendarClock, IconPlus, IconRefresh, IconX, IconChevronRight } from '@/components/Icons';

const ROLES = [
  { key: 'server', label: 'Server', color: '#3b82f6' },
  { key: 'bartender', label: 'Bartender', color: '#a855f7' },
  { key: 'host', label: 'Host', color: '#22c55e' },
  { key: 'kitchen', label: 'Kitchen', color: '#ef4444' },
  { key: 'manager', label: 'Manager', color: '#f59e0b' },
];

const HOURS = ['6:00','7:00','8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','0:00'];

function getWeekDates(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt.toISOString().split('T')[0];
  });
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SchedulingPage() {
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAdd, setShowAdd] = useState(null); // { date }
  const [form, setForm] = useState({ staff_id: '', start_time: '16:00', end_time: '22:00', role: 'server', notes: '' });
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(weekOffset);

  useEffect(() => { loadData(); }, [weekOffset]);

  async function loadData() {
    setLoading(true);
    const [shiftsRes, staffRes] = await Promise.all([
      fetch(`/api/shifts?start=${weekDates[0]}&end=${weekDates[6]}`),
      fetch('/api/staff'),
    ]);
    setShifts(await shiftsRes.json());
    setStaff(await staffRes.json());
    setLoading(false);
  }

  async function addShift() {
    if (!showAdd || !form.staff_id) return;
    await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, date: showAdd }),
    });
    setShowAdd(null);
    setForm({ staff_id: '', start_time: '16:00', end_time: '22:00', role: 'server', notes: '' });
    loadData();
  }

  async function deleteShift(id) {
    await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
    loadData();
  }

  function getShiftsForDate(date) {
    return shifts.filter(s => s.date === date);
  }

  function getRoleStyle(role) {
    const r = ROLES.find(ro => ro.key === role) || ROLES[0];
    return { background: `${r.color}15`, borderLeft: `3px solid ${r.color}`, color: r.color };
  }

  // Compute totals
  function getHours(shift) {
    const [sh, sm] = shift.start_time.split(':').map(Number);
    const [eh, em] = shift.end_time.split(':').map(Number);
    let h = eh - sh + (em - sm) / 60;
    if (h < 0) h += 24;
    return h;
  }

  const totalHours = shifts.reduce((s, sh) => s + getHours(sh), 0);
  const laborCost = totalHours * 16; // Approx $16/hr average

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Staff Scheduling</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Manage shifts and track labor hours
          </p>
        </div>
        <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
          <IconRefresh size={14} /> Refresh
        </button>
      </div>

      {/* Week Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Shifts', value: shifts.length, color: 'var(--text-primary)' },
          { label: 'Staff Scheduled', value: [...new Set(shifts.map(s => s.staff_id))].length, color: 'var(--info)' },
          { label: 'Total Hours', value: totalHours.toFixed(1), color: 'var(--gold)' },
          { label: 'Est. Labor Cost', value: `$${laborCost.toFixed(0)}`, color: 'var(--success)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-heading)' }}>{stat.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Week Navigator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setWeekOffset(o => o - 1)} style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>‹ Prev</button>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {new Date(weekDates[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(weekDates[6]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(212,168,75,0.08)', border: '1px solid var(--gold)', cursor: 'pointer', color: 'var(--gold)', fontSize: '0.82rem' }}>Today</button>}
          <button onClick={() => setWeekOffset(o => o + 1)} style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Next ›</button>
        </div>
      </div>

      {/* Role Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {ROLES.map(r => (
          <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
            {r.label}
          </div>
        ))}
      </div>

      {/* Schedule Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {weekDates.map((date, i) => {
          const dayShifts = getShiftsForDate(date);
          const isToday = date === today;
          return (
            <div key={date} style={{
              background: isToday ? 'rgba(212,168,75,0.04)' : 'var(--bg-card)',
              border: `1px solid ${isToday ? 'var(--gold)' : 'var(--border-subtle)'}`,
              borderRadius: 10, minHeight: 200, display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: isToday ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 600 }}>{DAY_NAMES[i]}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(date + 'T12:00').getDate()}</div>
                </div>
                <button onClick={() => setShowAdd(date)} style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(212,168,75,0.06)', border: '1px solid rgba(212,168,75,0.15)', color: 'var(--gold)' }}>
                  <IconPlus size={12} />
                </button>
              </div>
              <div style={{ flex: 1, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dayShifts.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.68rem', opacity: 0.4 }}>No shifts</div>
                ) : dayShifts.map(s => (
                  <div key={s.id} style={{ ...getRoleStyle(s.role), borderRadius: 6, padding: '6px 8px', fontSize: '0.72rem', position: 'relative' }}>
                    <div style={{ fontWeight: 600 }}>{s.staff_name || 'Staff'}</div>
                    <div style={{ opacity: 0.7, fontSize: '0.65rem' }}>{s.start_time}–{s.end_time}</div>
                    <button onClick={() => deleteShift(s.id)} style={{ position: 'absolute', top: 3, right: 3, cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', opacity: 0.4, padding: 2 }}>
                      <IconX size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Shift Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAdd(null)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 12, padding: 24, width: 380 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Add Shift</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 16px' }}>
              {new Date(showAdd + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              <select value={form.staff_id} onChange={e => setForm({...form, staff_id: e.target.value})} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                <option value="">Select staff member...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>START</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>END</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                </div>
              </div>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowAdd(null)} style={{ padding: '8px 16px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={addShift} disabled={!form.staff_id} style={{ padding: '8px 16px', borderRadius: 6, background: 'var(--gold)', border: 'none', cursor: 'pointer', color: '#0a0a0a', fontSize: '0.82rem', fontWeight: 600, opacity: form.staff_id ? 1 : 0.4 }}>Add Shift</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
