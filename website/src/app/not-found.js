import Link from 'next/link';
import styles from './not-found.module.css';

export const metadata = {
  title: 'Page Not Found | Antico Ristoranté',
};

export default function NotFound() {
  return (
    <div className={styles.notFound}>
      <div className={styles.content}>
        <span className={styles.script}>Oops</span>
        <h1 className={styles.code}>404</h1>
        <div className={styles.divider} />
        <p className={styles.message}>
          This page seems to have wandered off like a truffle-hunting dog.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.homeBtn}>
            Return Home
          </Link>
          <Link href="/menu" className={styles.menuBtn}>
            Browse the Menu
          </Link>
        </div>
      </div>
      <div className={styles.ambientGlow} />
    </div>
  );
}
