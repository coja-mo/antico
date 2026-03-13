import styles from './loading.module.css';

export default function SiteLoading() {
  return (
    <div className={styles.loadingPage}>
      <div className={styles.loadingInner}>
        <div className={styles.loadingLogo}>
          <span className={styles.loadingText}>Antico</span>
        </div>
        <div className={styles.loadingBar}>
          <div className={styles.loadingBarFill} />
        </div>
      </div>
    </div>
  );
}
