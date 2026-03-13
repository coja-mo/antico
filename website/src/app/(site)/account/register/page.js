'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconMail, IconUserCircle, IconPhone, IconSparkles } from '@/components/Icons';
import styles from '../account.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    if (val.length >= 7) val = `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`;
    else if (val.length >= 4) val = `${val.slice(0, 3)}-${val.slice(3)}`;
    setForm({ ...form, phone: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone.replace(/\D/g, ''),
          password: form.password,
        }),
      });
      if (res.ok) {
        router.push('/account');
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <p className={styles.authScript}>Unisciti a Noi</p>
        <h1 className={styles.authTitle}>Create Account</h1>
        <p className={styles.authSubtitle}>
          Join the Antico family. Book reservations faster and keep track of your dining experiences.
        </p>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.authRow}>
            <div className={styles.authField}>
              <label className={styles.authLabel}>
                <IconUserCircle size={13} /> First Name
              </label>
              <input
                className={styles.authInput}
                placeholder="First name"
                value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                required
              />
            </div>
            <div className={styles.authField}>
              <label className={styles.authLabel}>Last Name</label>
              <input
                className={styles.authInput}
                placeholder="Last name"
                value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
                required
              />
            </div>
          </div>
          <div className={styles.authField}>
            <label className={styles.authLabel}>
              <IconMail size={13} /> Email
            </label>
            <input
              className={styles.authInput}
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className={styles.authField}>
            <label className={styles.authLabel}>
              <IconPhone size={13} /> Phone <span style={{ fontWeight: 400, opacity: 0.5, marginLeft: 4 }}>(optional)</span>
            </label>
            <input
              className={styles.authInput}
              type="tel"
              placeholder="705-555-0000"
              value={form.phone}
              onChange={handlePhoneChange}
            />
          </div>
          <div className={styles.authRow}>
            <div className={styles.authField}>
              <label className={styles.authLabel}>Password</label>
              <input
                className={styles.authInput}
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className={styles.authField}>
              <label className={styles.authLabel}>Confirm</label>
              <input
                className={styles.authInput}
                type="password"
                placeholder="Confirm password"
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </div>
          </div>
          {error && <div className={styles.authAlert}>{error}</div>}
          <button type="submit" className={styles.authSubmit} disabled={loading}>
            {loading ? <span className={styles.authSpinner} /> : <><IconSparkles size={16} /> Create Account</>}
          </button>
        </form>
        <p className={styles.authFooter}>
          Already have an account? <Link href="/account/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
