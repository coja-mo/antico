'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { IconCheck, IconChevronRight, IconGift } from '@/components/Icons';
import styles from './gift-card-detail.module.css';

export default function GiftCardDetailClient() {
  const { code } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedToAccount, setAddedToAccount] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    async function loadCard() {
      try {
        const res = await fetch(`/api/gift-cards/${encodeURIComponent(code)}`);
        if (!res.ok) {
          setError('Gift card not found');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCard(data);
      } catch {
        setError('Failed to load gift card');
      }
      setLoading(false);
    }
    loadCard();
  }, [code]);

  // Generate QR code
  useEffect(() => {
    if (!card || !qrRef.current) return;
    async function genQR() {
      try {
        const QRCode = (await import('qrcode')).default;
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, card.code, {
          width: 200,
          margin: 2,
          color: { dark: '#0a0a0a', light: '#ffffff' },
        });
        qrRef.current.innerHTML = '';
        qrRef.current.appendChild(canvas);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    }
    genQR();
  }, [card]);

  async function handleAddToAccount() {
    try {
      const res = await fetch('/api/customer/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: card.code }),
      });
      if (res.ok) {
        setAddedToAccount(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddToWallet(type) {
    try {
      const res = await fetch(`/api/gift-cards/${encodeURIComponent(card.code)}/wallet?type=${type}`);
      const data = await res.json();
      // For demo: show an alert with the pass info
      // In production, Apple would serve a .pkpass, Google would redirect to pay.google.com
      alert(`${type === 'apple' ? 'Apple' : 'Google'} Wallet pass generated!\n\nCard: ${card.code}\nBalance: $${card.balance.toFixed(2)}\n\n${type === 'apple' ? data.note : 'Save URL: ' + data.saveUrl}`);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className={styles.loadingState}>Loading gift card...</div>;

  if (error) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.errorState}>
          <h2 className={styles.errorTitle}>Card Not Found</h2>
          <p className={styles.errorSub}>The gift card code you entered doesn't exist. Please check and try again.</p>
          <Link href="/gift-cards" style={{ color: 'var(--gold)', marginTop: 16, display: 'inline-block' }}>
            ← Back to Gift Cards
          </Link>
        </div>
      </div>
    );
  }

  const statusClass = card.status === 'active' ? styles.statusActive
    : card.status === 'depleted' ? styles.statusDepleted
    : styles.statusInactive;

  return (
    <div className={styles.detailPage}>
      <div className={styles.detailInner}>
        {/* ── Card Visual ── */}
        <div className={styles.cardVisual}>
          <div>
            <div className={styles.cardVisualLogo}>ANTICO RISTORANTÉ</div>
            <div className={styles.cardVisualLabel}>Gift Card</div>
          </div>
          <div className={styles.cardVisualAmount}>${card.balance.toFixed(2)}</div>
          <div className={styles.cardVisualBottom}>
            <div>
              <div className={styles.cardVisualRecipient}>FOR</div>
              <div className={styles.cardVisualName}>{card.recipient_name || 'Valued Guest'}</div>
            </div>
            <div className={styles.cardVisualCode}>{card.code}</div>
          </div>
        </div>

        {/* ── Info Grid ── */}
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoValue}>${card.balance.toFixed(2)}</div>
            <div className={styles.infoLabel}>Current Balance</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoValue}>${card.initial_amount.toFixed(2)}</div>
            <div className={styles.infoLabel}>Original Amount</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {card.status === 'active' ? '● Active' : card.status === 'depleted' ? '○ Depleted' : '✕ Inactive'}
          </span>
        </div>

        {/* ── QR Code ── */}
        <div className={styles.qrSection}>
          <h3 className={styles.qrTitle}>Scan at Checkout</h3>
          <div className={styles.qrCode} ref={qrRef}>
            <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              Loading QR...
            </div>
          </div>
          <p className={styles.qrHint}>Present this QR code to your server at Antico to pay with your gift card</p>
        </div>

        {/* ── Wallet Buttons ── */}
        <div className={styles.walletSection}>
          <button className={styles.walletBtn} onClick={() => handleAddToWallet('apple')}>
            <div className={`${styles.walletBtnIcon} ${styles.walletBtnApple}`}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <span className={styles.walletBtnLabel}>Add to Apple Wallet</span>
            <span className={styles.walletBtnSub}>iPhone & Apple Watch</span>
          </button>
          <button className={styles.walletBtn} onClick={() => handleAddToWallet('google')}>
            <div className={`${styles.walletBtnIcon} ${styles.walletBtnGoogle}`}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <circle cx="17" cy="15" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="14" cy="15" r="1.5" fill="currentColor" stroke="none" opacity="0.5" />
              </svg>
            </div>
            <span className={styles.walletBtnLabel}>Add to Google Wallet</span>
            <span className={styles.walletBtnSub}>Android Devices</span>
          </button>
        </div>

        {/* ── Add to Account ── */}
        <div className={styles.addToAccount}>
          <p className={styles.addToAccountLabel}>Link this card to your Antico account for easy access</p>
          {addedToAccount ? (
            <span className={styles.addedMsg}><IconCheck size={14} /> Added to your account</span>
          ) : (
            <button className={styles.addToAccountBtn} onClick={handleAddToAccount}>
              <IconGift size={14} /> Add to My Account
            </button>
          )}
        </div>

        {/* ── Transaction History ── */}
        <div className={styles.txSection}>
          <h3 className={styles.txTitle}>Transaction History</h3>
          {(!card.transactions || card.transactions.length === 0) ? (
            <div className={styles.txEmpty}>No transactions yet</div>
          ) : (
            <div className={styles.txList}>
              {card.transactions.map(tx => (
                <div key={tx.id} className={styles.txItem}>
                  <div className={styles.txInfo}>
                    <span className={styles.txType}>{tx.type}</span>
                    <span className={styles.txDesc}>{tx.description}</span>
                    <span className={styles.txDate}>
                      {new Date(tx.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className={styles.txRight}>
                    <div className={`${styles.txAmount} ${tx.amount >= 0 ? styles.txAmountPositive : styles.txAmountNegative}`}>
                      {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                    <div className={styles.txBalance}>Bal: ${tx.balance_after.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
