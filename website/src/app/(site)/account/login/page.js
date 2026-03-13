'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconMail, IconUserCircle, IconSparkles } from '@/components/Icons';
import styles from '../account.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/account');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <p className={styles.authScript}>Benvenuto</p>
        <h1 className={styles.authTitle}>Sign In</h1>
        <p className={styles.authSubtitle}>
          Welcome back to Antico. Sign in to manage your reservations and view your dining history.
        </p>

        <form onSubmit={handleSubmit} className={styles.authForm}>
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
            <label className={styles.authLabel}>Password</label>
            <input
              className={styles.authInput}
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          {error && <div className={styles.authAlert}>{error}</div>}
          <button type="submit" className={styles.authSubmit} disabled={loading}>
            {loading ? <span className={styles.authSpinner} /> : <><IconSparkles size={16} /> Sign In</>}
          </button>
        </form>
        <p className={styles.authFooter}>
          Don't have an account? <Link href="/account/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
