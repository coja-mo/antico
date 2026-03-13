'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconCalendar, IconGrid, IconLogOut, IconSparkles, IconUserCircle, IconCheck } from '@/components/Icons';
import styles from '../account.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/customer/me');
      if (!res.ok) { router.push('/account/login'); return; }
      const data = await res.json();
      setCustomer(data);
      setForm({ first_name: data.first_name, last_name: data.last_name, phone: data.phone || '' });
      setLoading(false);
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/customer/me', { method: 'DELETE' });
    router.push('/account/login');
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    const res = await fetch('/api/customer/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) setProfileMsg('Profile updated successfully');
    else setProfileMsg((await res.json()).error || 'Update failed');
    setSaving(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg('Passwords do not match'); return; }
    if (pwForm.newPw.length < 6) { setPwMsg('New password must be at least 6 characters'); return; }
    const res = await fetch('/api/customer/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
    });
    if (res.ok) { setPwMsg('Password changed'); setPwForm({ current: '', newPw: '', confirm: '' }); }
    else setPwMsg((await res.json()).error || 'Change failed');
  };

  if (loading) return <div className={styles.loadingState}>Loading profile...</div>;
  if (!customer) return null;

  return (
    <div className={styles.accountPage}>
      <div className={styles.accountHeader}>
        <p className={styles.accountGreeting}>Il Profilo</p>
        <h1 className={styles.accountTitle}>My Profile</h1>
      </div>

      <nav className={styles.accountNav}>
        <Link href="/account" className={styles.accountNavLink}><IconGrid size={14} /> Dashboard</Link>
        <Link href="/account/reservations" className={styles.accountNavLink}><IconCalendar size={14} /> Reservations</Link>
        <Link href="/account/orders" className={styles.accountNavLink}><IconSparkles size={14} /> Order History</Link>
        <Link href="/account/profile" className={`${styles.accountNavLink} ${styles.accountNavLinkActive}`}><IconUserCircle size={14} /> Profile</Link>
        <button onClick={handleLogout} className={styles.logoutBtn}><IconLogOut size={13} /> Sign Out</button>
      </nav>

      {/* Profile Info */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Personal Information</span>
          {customer.member_since && (
            <span style={{ fontSize: '0.7rem', color: 'rgba(255 255 255 / 0.25)' }}>
              Member since {new Date(customer.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>
        <div className={styles.sectionBody}>
          <form onSubmit={saveProfile} className={styles.authForm}>
            <div className={styles.authRow}>
              <div className={styles.authField}>
                <label className={styles.authLabel}>First Name</label>
                <input className={styles.authInput} value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
              </div>
              <div className={styles.authField}>
                <label className={styles.authLabel}>Last Name</label>
                <input className={styles.authInput} value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
              </div>
            </div>
            <div className={styles.authField}>
              <label className={styles.authLabel}>Phone</label>
              <input className={styles.authInput} type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className={styles.authField}>
              <label className={styles.authLabel}>Email</label>
              <input className={styles.authInput} value={customer.email} disabled style={{ opacity: 0.4, cursor: 'not-allowed' }} />
            </div>
            {profileMsg && <div className={styles.authAlert} style={{ background: profileMsg.includes('success') ? 'rgba(74 222 128 / 0.06)' : undefined, color: profileMsg.includes('success') ? '#4ade80' : undefined }}>{profileMsg}</div>}
            <button type="submit" className={styles.authSubmit} disabled={saving}>
              {saving ? 'Saving...' : <><IconCheck size={14} /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Change Password</span>
        </div>
        <div className={styles.sectionBody}>
          <form onSubmit={changePassword} className={styles.authForm}>
            <div className={styles.authField}>
              <label className={styles.authLabel}>Current Password</label>
              <input className={styles.authInput} type="password" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} required />
            </div>
            <div className={styles.authRow}>
              <div className={styles.authField}>
                <label className={styles.authLabel}>New Password</label>
                <input className={styles.authInput} type="password" value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} required />
              </div>
              <div className={styles.authField}>
                <label className={styles.authLabel}>Confirm</label>
                <input className={styles.authInput} type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
              </div>
            </div>
            {pwMsg && <div className={styles.authAlert} style={{ background: pwMsg === 'Password changed' ? 'rgba(74 222 128 / 0.06)' : undefined, color: pwMsg === 'Password changed' ? '#4ade80' : undefined }}>{pwMsg}</div>}
            <button type="submit" className={styles.authSubmit}>Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
