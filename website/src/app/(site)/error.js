'use client';
import Link from 'next/link';
import styles from '../not-found.module.css';

export default function SiteError({ error, reset }) {
  return (
    <div className={styles.notFound}>
      <div className={styles.content}>
        <span className={styles.script}>Scusa</span>
        <h1 className={styles.code}>Error</h1>
        <div className={styles.divider} />
        <p className={styles.message}>
          Something went wrong. Our chefs are looking into it.
        </p>
        <div className={styles.actions}>
          <button onClick={() => reset()} className={styles.homeBtn}>
            Try Again
          </button>
          <Link href="/" className={styles.menuBtn}>
            Return Home
          </Link>
        </div>
      </div>
      <div className={styles.ambientGlow} />
    </div>
  );
}
