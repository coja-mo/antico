'use client';
import styles from './admin.module.css';

export default function AdminError({ error, reset }) {
  return (
    <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon} style={{ fontSize: '2rem' }}>⚠</div>
        <p className={styles.emptyText}>Something went wrong</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => reset()}
          className={`${styles.actionBtn} ${styles.actionBtnGold}`}
          style={{ marginTop: '16px' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
