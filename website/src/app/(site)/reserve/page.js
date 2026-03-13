'use client';
import { useState } from 'react';
import styles from './page.module.css';

export default function ReservePage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', date: '', time: '', partySize: '2', occasion: '', notes: ''
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [confirmationId, setConfirmationId] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: form.name,
          email: form.email,
          phone: form.phone,
          date: form.date,
          time: form.time,
          party_size: parseInt(form.partySize),
          occasion: form.occasion,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmationId(data.id);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const timeSlots = [];
  for (let h = 17; h <= 21; h++) {
    timeSlots.push(`${h}:00`);
    if (h < 21) timeSlots.push(`${h}:30`);
  }

  if (status === 'success') {
    return (
      <div className={styles.page}>
        <section className={styles.confirmation}>
          <div className={styles.confirmInner}>
            <div className={styles.checkIcon}>✓</div>
            <p className={styles.script}>Grazie</p>
            <h1>Reservation Requested</h1>
            <div className={styles.divider} />
            <p className={styles.confirmText}>
              Your reservation request has been received. Our team will review and confirm 
              your booking shortly. You'll receive a confirmation via email.
            </p>
            <div className={styles.confirmDetails}>
              <div className={styles.confirmRow}>
                <span>Confirmation ID</span>
                <strong>#{confirmationId}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Name</span>
                <strong>{form.name}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Date</span>
                <strong>{new Date(form.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Time</span>
                <strong>{form.time}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Party Size</span>
                <strong>{form.partySize} {parseInt(form.partySize) === 1 ? 'guest' : 'guests'}</strong>
              </div>
              {form.occasion && (
                <div className={styles.confirmRow}>
                  <span>Occasion</span>
                  <strong>{form.occasion}</strong>
                </div>
              )}
            </div>
            <p className={styles.confirmNote}>
              Questions? Call or text us at <a href="tel:7052550161">705-255-0161</a>
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.script}>La Prenotazione</p>
          <h1>Reserve a Table</h1>
          <div className={styles.divider} />
          <p className={styles.subtitle}>We look forward to welcoming you</p>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.formInner}>
          <div className={styles.formInfo}>
            <h3>Dining Details</h3>
            <p>We serve dinner Wednesday through Saturday. All reservation requests are reviewed 
            personally and confirmed by our team.</p>
            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📍</span>
                <div>
                  <strong>Location</strong>
                  <p>6 Village Court, Sault Ste. Marie</p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🕐</span>
                <div>
                  <strong>Dinner Service</strong>
                  <p>Wednesday – Saturday, 5:00 PM onwards</p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📞</span>
                <div>
                  <strong>Call or Text</strong>
                  <p><a href="tel:7052550161">705-255-0161</a></p>
                </div>
              </div>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <h3>Request a Reservation</h3>
            
            <div className={styles.formRow}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name *</label>
                <input id="name" name="name" required className="form-input" value={form.name} onChange={handleChange} placeholder="Your name" />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email *</label>
                <input id="email" name="email" type="email" required className="form-input" value={form.email} onChange={handleChange} placeholder="you@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone *</label>
                <input id="phone" name="phone" type="tel" required className="form-input" value={form.phone} onChange={handleChange} placeholder="705-555-0000" />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className="form-group">
                <label className="form-label" htmlFor="date">Date *</label>
                <input id="date" name="date" type="date" required className="form-input" value={form.date} onChange={handleChange} min={today} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="time">Preferred Time *</label>
                <select id="time" name="time" required className="form-select" value={form.time} onChange={handleChange}>
                  <option value="">Select a time</option>
                  {timeSlots.map(t => (
                    <option key={t} value={t}>{t.includes(':00') ? `${t > '12:00' ? parseInt(t) - 12 : t.split(':')[0]}:00 PM` : `${parseInt(t) > 12 ? parseInt(t) - 12 : parseInt(t)}:30 PM`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className="form-group">
                <label className="form-label" htmlFor="partySize">Party Size *</label>
                <select id="partySize" name="partySize" required className="form-select" value={form.partySize} onChange={handleChange}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                  <option value="13">13+ (Contact us)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="occasion">Occasion</label>
                <select id="occasion" name="occasion" className="form-select" value={form.occasion} onChange={handleChange}>
                  <option value="">Select (optional)</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Date Night">Date Night</option>
                  <option value="Business Dinner">Business Dinner</option>
                  <option value="Celebration">Celebration</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">Special Requests / Dietary Needs</label>
              <textarea id="notes" name="notes" className="form-textarea" value={form.notes} onChange={handleChange} placeholder="Allergies, dietary restrictions, special arrangements..." rows={3} />
            </div>

            <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '16px' }} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Submitting...' : 'Request Reservation'}
            </button>
            
            {status === 'error' && (
              <p className={styles.error}>Something went wrong. Please try again or call us directly.</p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
