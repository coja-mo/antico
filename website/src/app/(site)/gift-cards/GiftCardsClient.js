'use client';
import { useState } from 'react';
import Link from 'next/link';
import { IconGift, IconMail, IconCheck, IconChevronRight } from '@/components/Icons';
import styles from './gift-cards.module.css';

const PRESET_AMOUNTS = [25, 50, 100, 150, 200, 250];

export default function GiftCardsClient() {
  const [step, setStep] = useState(1); // 1=amount, 2=delivery, 3=details, 4=review
  const [amount, setAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('email');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCard, setCreatedCard] = useState(null);

  // Balance check
  const [checkCode, setCheckCode] = useState('');
  const [checkedCard, setCheckedCard] = useState(null);
  const [checkError, setCheckError] = useState('');

  const effectiveAmount = amount === 'custom' ? parseFloat(customAmount) : amount;

  const canProceed = () => {
    if (step === 1) return effectiveAmount && effectiveAmount >= 5 && effectiveAmount <= 1000;
    if (step === 2) return recipientName.trim().length > 0;
    if (step === 3) return senderName.trim().length > 0;
    return true;
  };

  async function handlePurchase() {
    setLoading(true);
    try {
      const res = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount,
          sender_name: senderName,
          sender_email: senderEmail,
          recipient_name: recipientName,
          recipient_email: recipientEmail,
          recipient_phone: recipientPhone,
          delivery_method: deliveryMethod,
          personal_message: personalMessage,
        }),
      });
      const card = await res.json();
      if (res.ok) {
        setCreatedCard(card);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function checkBalance() {
    setCheckError('');
    setCheckedCard(null);
    if (!checkCode.trim()) return;
    try {
      const res = await fetch(`/api/gift-cards/${encodeURIComponent(checkCode.trim())}`);
      if (!res.ok) {
        setCheckError('Gift card not found. Please check the code and try again.');
        return;
      }
      const data = await res.json();
      setCheckedCard(data);
    } catch {
      setCheckError('Something went wrong. Please try again.');
    }
  }

  // ── Success State ──
  if (createdCard) {
    return (
      <div className={styles.gcPage}>
        <div className={styles.successSection}>
          <div className={styles.successIcon}>
            <IconCheck size={36} />
          </div>
          <h1 className={styles.successTitle}>Gift Card Created!</h1>
          <p className={styles.successSub}>
            Your e-gift card for <strong>{createdCard.recipient_name || 'a valued guest'}</strong> is ready.
            {deliveryMethod === 'email' ? ' A notification would be sent to their email.' : ' A notification would be sent via text.'}
          </p>

          <div className={styles.successCode}>{createdCard.code}</div>

          <div className={styles.successCard}>
            <div className={styles.successDetail}>
              <span className={styles.successDetailLabel}>Amount</span>
              <span className={styles.successDetailValue}>${createdCard.initial_amount.toFixed(2)}</span>
            </div>
            <div className={styles.successDetail}>
              <span className={styles.successDetailLabel}>Recipient</span>
              <span className={styles.successDetailValue}>{createdCard.recipient_name}</span>
            </div>
            <div className={styles.successDetail}>
              <span className={styles.successDetailLabel}>Delivery</span>
              <span className={styles.successDetailValue}>
                {createdCard.delivery_method === 'email' ? createdCard.recipient_email : createdCard.recipient_phone}
              </span>
            </div>
            <div className={styles.successDetail}>
              <span className={styles.successDetailLabel}>From</span>
              <span className={styles.successDetailValue}>{createdCard.sender_name}</span>
            </div>
            {createdCard.personal_message && (
              <div className={styles.successDetail}>
                <span className={styles.successDetailLabel}>Message</span>
                <span className={styles.successDetailValue}>{createdCard.personal_message}</span>
              </div>
            )}
          </div>

          <div className={styles.successActions}>
            <Link href={`/gift-cards/${createdCard.code}`} className={styles.successBtnPrimary}>
              View Card & Wallet <IconChevronRight size={14} />
            </Link>
            <button className={styles.successBtnOutline} onClick={() => {
              setCreatedCard(null);
              setStep(1);
              setAmount(null);
              setCustomAmount('');
              setRecipientName('');
              setRecipientEmail('');
              setRecipientPhone('');
              setPersonalMessage('');
              setSenderName('');
              setSenderEmail('');
            }}>
              Buy Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gcPage}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <span className={styles.heroScript}>il regalo perfetto</span>
        <h1 className={styles.heroTitle}>Gift Cards</h1>
        <p className={styles.heroSub}>
          Share the taste of Antico with someone special. Our e-gift cards are delivered instantly by email or text.
        </p>
      </section>

      {/* ── Card Preview ── */}
      <div className={styles.previewSection}>
        <div className={styles.cardPreview}>
          <div>
            <div className={styles.cardLogo}>ANTICO RISTORANTÉ</div>
            <div className={styles.cardLabel}>Gift Card</div>
          </div>
          <div className={styles.cardAmount}>
            {effectiveAmount ? `$${effectiveAmount.toFixed(2)}` : '$—'}
          </div>
          <div className={styles.cardBottom}>
            <div>
              <div className={styles.cardRecipient}>FOR</div>
              <div className={styles.cardRecipientName}>{recipientName || 'A Valued Guest'}</div>
            </div>
            <div className={styles.cardCode}>
              {createdCard ? createdCard.code : '••••-••••-••••-••••'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Purchase Form ── */}
      <div className={styles.formSection}>
        <div className={styles.formCard}>
          {/* Step Indicator */}
          <div className={styles.stepIndicator}>
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`${styles.stepDot} ${s === step ? styles.stepDotActive : ''} ${s < step ? styles.stepDotDone : ''}`}
              />
            ))}
          </div>

          {/* Step 1: Amount */}
          {step === 1 && (
            <>
              <h3 className={styles.formTitle}>
                <IconGift size={18} /> Choose Amount
              </h3>
              <div className={styles.amountGrid}>
                {PRESET_AMOUNTS.map(a => (
                  <button
                    key={a}
                    className={`${styles.amountBtn} ${amount === a ? styles.amountBtnActive : ''}`}
                    onClick={() => { setAmount(a); setCustomAmount(''); }}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <div className={styles.customAmount}>
                <span className={styles.customAmountSymbol}>$</span>
                <input
                  className={styles.customAmountInput}
                  type="number"
                  placeholder="Custom amount (5 – 1,000)"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setAmount('custom'); }}
                  min={5}
                  max={1000}
                />
              </div>
            </>
          )}

          {/* Step 2: Delivery & Recipient */}
          {step === 2 && (
            <>
              <h3 className={styles.formTitle}>
                <IconMail size={18} /> Recipient Details
              </h3>
              <div className={styles.deliveryToggle}>
                <button
                  className={`${styles.deliveryBtn} ${deliveryMethod === 'email' ? styles.deliveryBtnActive : ''}`}
                  onClick={() => setDeliveryMethod('email')}
                >
                  <IconMail size={14} /> Email
                </button>
                <button
                  className={`${styles.deliveryBtn} ${deliveryMethod === 'text' ? styles.deliveryBtnActive : ''}`}
                  onClick={() => setDeliveryMethod('text')}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  Text
                </button>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Recipient Name</label>
                <input
                  className={styles.fieldInput}
                  placeholder="Who is this gift for?"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                />
              </div>
              {deliveryMethod === 'email' ? (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Recipient Email</label>
                  <input
                    className={styles.fieldInput}
                    type="email"
                    placeholder="their@email.com"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                  />
                </div>
              ) : (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Recipient Phone</label>
                  <input
                    className={styles.fieldInput}
                    type="tel"
                    placeholder="(705) 555-0123"
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                  />
                </div>
              )}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Personal Message (Optional)</label>
                <textarea
                  className={styles.fieldTextarea}
                  placeholder="Add a personal touch..."
                  value={personalMessage}
                  onChange={e => setPersonalMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Step 3: Sender */}
          {step === 3 && (
            <>
              <h3 className={styles.formTitle}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Your Details
              </h3>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Your Name</label>
                <input
                  className={styles.fieldInput}
                  placeholder="Your name"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Your Email (Optional)</label>
                <input
                  className={styles.fieldInput}
                  type="email"
                  placeholder="you@email.com"
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <>
              <h3 className={styles.formTitle}>
                <IconCheck size={18} /> Review & Purchase
              </h3>
              <div className={styles.successCard} style={{ margin: 0 }}>
                <div className={styles.successDetail}>
                  <span className={styles.successDetailLabel}>Amount</span>
                  <span className={styles.successDetailValue}>${effectiveAmount?.toFixed(2)}</span>
                </div>
                <div className={styles.successDetail}>
                  <span className={styles.successDetailLabel}>To</span>
                  <span className={styles.successDetailValue}>{recipientName}</span>
                </div>
                <div className={styles.successDetail}>
                  <span className={styles.successDetailLabel}>Via</span>
                  <span className={styles.successDetailValue}>
                    {deliveryMethod === 'email' ? recipientEmail : recipientPhone}
                  </span>
                </div>
                <div className={styles.successDetail}>
                  <span className={styles.successDetailLabel}>From</span>
                  <span className={styles.successDetailValue}>{senderName}</span>
                </div>
                {personalMessage && (
                  <div className={styles.successDetail}>
                    <span className={styles.successDetailLabel}>Message</span>
                    <span className={styles.successDetailValue}>{personalMessage}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Navigation */}
          <div className={styles.formNav}>
            {step > 1 && (
              <button className={styles.backBtn} onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                className={styles.nextBtn}
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
              >
                Continue
              </button>
            ) : (
              <button
                className={styles.nextBtn}
                disabled={loading}
                onClick={handlePurchase}
              >
                {loading ? 'Creating...' : 'Purchase Gift Card'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Check Balance ── */}
      <div className={styles.balanceSection}>
        <div className={styles.balanceCard}>
          <h3 className={styles.balanceTitle}>Check Gift Card Balance</h3>
          <div className={styles.balanceInputRow}>
            <input
              className={styles.balanceInput}
              placeholder="Enter card code"
              value={checkCode}
              onChange={e => setCheckCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkBalance()}
            />
            <button className={styles.balanceBtn} onClick={checkBalance}>
              Check
            </button>
          </div>
          {checkError && <p className={styles.balanceError}>{checkError}</p>}
          {checkedCard && (
            <div className={styles.balanceResult}>
              <div className={styles.balanceAmount}>${checkedCard.balance.toFixed(2)}</div>
              <div className={styles.balanceLabel}>Available Balance</div>
              <Link href={`/gift-cards/${checkedCard.code}`} className={styles.balanceLink}>
                View Full Details <IconChevronRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
