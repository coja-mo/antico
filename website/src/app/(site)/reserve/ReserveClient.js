'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  IconCalendar, IconClock, IconUsers, IconCheck, IconChevronLeft, IconChevronRight,
  IconMapPin, IconPhone, IconWine, IconHeart, IconGift, IconBriefcase, IconSparkles,
  IconMail, IconUserCircle, IconAlertCircle, IconUtensils,
} from '@/components/Icons';
import styles from './page.module.css';

/* ═══════════════════════════════════════════
   AMBIENT PARTICLES
   ═══════════════════════════════════════════ */
function AmbientParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 3,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * 10,
    opacity: 0.2 + Math.random() * 0.4,
  }));

  return (
    <div className={styles.particles}>
      {particles.map(p => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CONFETTI BURST
   ═══════════════════════════════════════════ */
function ConfettiBurst() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#d4a84b', '#e8c96a', '#ff6b9d', '#ffd700', '#4ade80', '#f5f0e8'];
    const pieces = Array.from({ length: 80 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 20,
      vy: Math.random() * -18 - 4,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.3 + Math.random() * 0.2,
      opacity: 1,
    }));

    let frame = 0;
    const maxFrames = 120;

    function animate() {
      if (frame > maxFrames) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach(p => {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity = Math.max(0, 1 - frame / maxFrames);
        p.vx *= 0.98;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      frame++;
      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className={styles.confettiCanvas} />;
}

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const TIME_SLOTS = [
  { value: '17:00', label: '5:00 PM' },
  { value: '17:30', label: '5:30 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '18:30', label: '6:30 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '19:30', label: '7:30 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '20:30', label: '8:30 PM' },
  { value: '21:00', label: '9:00 PM' },
];

const OCCASIONS = [
  { value: 'Birthday', label: 'Birthday', Icon: IconGift },
  { value: 'Anniversary', label: 'Anniversary', Icon: IconHeart },
  { value: 'Date Night', label: 'Date Night', Icon: IconWine },
  { value: 'Business Dinner', label: 'Business', Icon: IconBriefcase },
  { value: 'Celebration', label: 'Celebration', Icon: IconSparkles },
  { value: 'Other', label: 'Other', Icon: IconUtensils },
];

const SEATING = ['Indoor', 'Patio', 'Bar', "Chef's Table"];

const DIETARY = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut Allergy', 'Shellfish Allergy'];

const STEP_LABELS = ['Date & Time', 'Your Evening', 'Complete'];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function ReservePageClient() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', date: '', time: '',
    partySize: '2', occasion: '', seating: 'Indoor',
    notes: '', dietary: [],
  });
  const [status, setStatus] = useState('idle');
  const [confirmationId, setConfirmationId] = useState(null);
  const [errors, setErrors] = useState({});
  const [dayWarning, setDayWarning] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // ── Date change: check if it's an open day ──
  const handleDateChange = useCallback((e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, date: val }));
    setErrors(prev => ({ ...prev, date: '' }));

    if (val) {
      const d = new Date(val + 'T12:00:00');
      const day = d.getDay();
      // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      if (day < 3 || day > 6) {
        setDayWarning('We serve dinner Wednesday through Saturday. You may still request this date and we\'ll reach out.');
      } else {
        setDayWarning('');
      }
    } else {
      setDayWarning('');
    }
  }, []);

  // ── Phone auto-format ──
  const handlePhoneChange = useCallback((e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    if (val.length >= 7) {
      val = `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`;
    } else if (val.length >= 4) {
      val = `${val.slice(0, 3)}-${val.slice(3)}`;
    }
    setForm(prev => ({ ...prev, phone: val }));
    setErrors(prev => ({ ...prev, phone: '' }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const toggleDietary = useCallback((item) => {
    setForm(prev => ({
      ...prev,
      dietary: prev.dietary.includes(item)
        ? prev.dietary.filter(d => d !== item)
        : [...prev.dietary, item],
    }));
  }, []);

  // ── Validation ──
  const validateStep = useCallback((stepNum) => {
    const errs = {};
    if (stepNum === 1) {
      if (!form.date) errs.date = 'Please select a date';
      if (!form.time) errs.time = 'Please select a time';
    }
    if (stepNum === 3) {
      if (!form.name.trim()) errs.name = 'Name is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
      if (!form.phone.trim()) errs.phone = 'Phone is required';
      else if (form.phone.replace(/\D/g, '').length < 10) errs.phone = 'Enter a full phone number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const goNext = useCallback(() => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  }, [step, validateStep]);

  const goBack = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1));
  }, []);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!validateStep(3)) return;
    setStatus('submitting');

    try {
      const dietaryNote = form.dietary.length > 0
        ? `Dietary: ${form.dietary.join(', ')}. ${form.notes}`
        : form.notes;

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: form.name,
          email: form.email,
          phone: form.phone.replace(/\D/g, ''),
          date: form.date,
          time: form.time,
          party_size: parseInt(form.partySize),
          occasion: form.occasion || null,
          notes: `${form.seating ? `Seating: ${form.seating}. ` : ''}${dietaryNote}`.trim() || null,
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
  }, [form, validateStep]);

  // ── Add to Calendar ──
  const addToCalendar = useCallback(() => {
    const dateStr = form.date.replace(/-/g, '');
    const [h, m] = form.time.split(':');
    const startTime = `${dateStr}T${h}${m}00`;
    const endH = String(parseInt(h) + 2).padStart(2, '0');
    const endTime = `${dateStr}T${endH}${m}00`;
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Dinner at Antico Ristoranté')}&dates=${startTime}/${endTime}&location=${encodeURIComponent('6 Village Court, Sault Ste. Marie, ON')}&details=${encodeURIComponent(`Reservation #${confirmationId} · Party of ${form.partySize}`)}`;
    window.open(url, '_blank');
  }, [form, confirmationId]);

  /* ═══════════════════════════════════════════
     CONFIRMATION SCREEN
     ═══════════════════════════════════════════ */

  if (status === 'success') {
    const dateObj = new Date(form.date + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeLabel = TIME_SLOTS.find(t => t.value === form.time)?.label || form.time;

    return (
      <div className={styles.page}>
        <ConfettiBurst />
        <AmbientParticles />
        <section className={styles.confirmation}>
          <div className={styles.confirmInner}>
            {/* Animated Check */}
            <div className={styles.checkContainer}>
              <div className={styles.checkCircle}>
                <svg className={styles.checkSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <p className={styles.confirmScript}>Grazie Mille</p>
            <h1 className={styles.confirmTitle}>Reservation Requested</h1>
            <div className={styles.confirmDivider} />
            <p className={styles.confirmText}>
              Your reservation request has been received. Our team will personally review
              and confirm your booking. A confirmation email will be sent shortly.
            </p>

            <div className={styles.confirmCard}>
              <div className={styles.confirmRow}>
                <span className={styles.confirmRowLabel}>
                  <IconSparkles size={14} />
                  Confirmation
                </span>
                <strong className={styles.confirmRowValue}>#{confirmationId}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmRowLabel}>
                  <IconUserCircle size={14} />
                  Guest
                </span>
                <strong className={styles.confirmRowValue}>{form.name}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmRowLabel}>
                  <IconCalendar size={14} />
                  Date
                </span>
                <strong className={styles.confirmRowValue}>{formattedDate}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmRowLabel}>
                  <IconClock size={14} />
                  Time
                </span>
                <strong className={styles.confirmRowValue}>{timeLabel}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmRowLabel}>
                  <IconUsers size={14} />
                  Party
                </span>
                <strong className={styles.confirmRowValue}>
                  {form.partySize} {parseInt(form.partySize) === 1 ? 'Guest' : 'Guests'}
                </strong>
              </div>
              {form.occasion && (
                <div className={styles.confirmRow}>
                  <span className={styles.confirmRowLabel}>
                    <IconHeart size={14} />
                    Occasion
                  </span>
                  <strong className={styles.confirmRowValue}>{form.occasion}</strong>
                </div>
              )}
              {form.seating && (
                <div className={styles.confirmRow}>
                  <span className={styles.confirmRowLabel}>
                    <IconWine size={14} />
                    Seating
                  </span>
                  <strong className={styles.confirmRowValue}>{form.seating}</strong>
                </div>
              )}
            </div>

            <div className={styles.confirmActions}>
              <button className={styles.confirmActionBtn} onClick={addToCalendar}>
                <IconCalendar size={16} />
                Add to Calendar
              </button>
              <button className={styles.confirmActionBtn} onClick={() => { setStatus('idle'); setStep(1); setForm({ name: '', email: '', phone: '', date: '', time: '', partySize: '2', occasion: '', seating: 'Indoor', notes: '', dietary: [] }); }}>
                <IconSparkles size={16} />
                New Reservation
              </button>
            </div>

            <p className={styles.confirmNote}>
              Questions? Call or text us at <a href="tel:7052550161">705-255-0161</a>
            </p>
          </div>
        </section>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     MAIN RESERVATION FLOW
     ═══════════════════════════════════════════ */

  return (
    <div className={styles.page}>
      <AmbientParticles />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroScript}>La Prenotazione</p>
          <h1 className={styles.heroTitle}>Reserve Your Table</h1>
          <div className={styles.heroDivider} />
          <p className={styles.heroSubtitle}>We look forward to welcoming you for an unforgettable evening</p>
        </div>
      </section>

      {/* ── Progress Bar ── */}
      <section className={styles.progressSection}>
        <div className={styles.progressInner}>
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isCompleted = step > num;
            return (
              <div key={label} style={{ display: 'contents' }}>
                <div className={styles.progressStep}>
                  <div className={`${styles.progressDot} ${isActive ? styles.progressDotActive : ''} ${isCompleted ? styles.progressDotCompleted : ''}`}>
                    {isCompleted ? <IconCheck size={16} /> : num}
                  </div>
                  <span className={`${styles.progressLabel} ${isActive ? styles.progressLabelActive : ''} ${isCompleted ? styles.progressLabelCompleted : ''}`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={styles.progressLine}>
                    <div className={`${styles.progressLineFill} ${isCompleted ? styles.progressLineFillActive : ''}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className={styles.mainSection}>
        <div className={styles.mainInner}>
          {/* Left: Info Panel */}
          <div className={styles.infoPanel}>
            <h3 className={styles.infoPanelTitle}>Dining at Antico</h3>
            <p className={styles.infoPanelSub}>
              We serve dinner Wednesday through Saturday. Every reservation is personally
              reviewed and confirmed by our team.
            </p>

            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <IconMapPin size={18} />
                </div>
                <div className={styles.infoCardContent}>
                  <strong>Location</strong>
                  <p>6 Village Court, Sault Ste. Marie</p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <IconClock size={18} />
                </div>
                <div className={styles.infoCardContent}>
                  <strong>Dinner Service</strong>
                  <p>Wednesday – Saturday, 5:00 PM onwards</p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <IconPhone size={18} />
                </div>
                <div className={styles.infoCardContent}>
                  <strong>Call or Text</strong>
                  <p><a href="tel:7052550161">705-255-0161</a></p>
                </div>
              </div>
            </div>

            <div className={styles.experienceQuote}>
              <blockquote>"Every dish tells a story of tradition, passion, and the finest ingredients."</blockquote>
              <cite>— Chef Arturo Comegna</cite>
            </div>
          </div>

          {/* Right: Form Panel */}
          <div className={styles.formPanel}>
            <div className={styles.formPanelHeader}>
              <h3 className={styles.formPanelTitle}>
                {step === 1 && 'Choose Date & Time'}
                {step === 2 && 'Your Evening'}
                {step === 3 && 'Guest Information'}
              </h3>
              <span className={styles.stepIndicator}>Step {step} of 3</span>
            </div>

            <div className={styles.stepContainer}>
              {/* ──── STEP 1: Date & Time ──── */}
              {step === 1 && (
                <div className={styles.step} key="step1">
                  <div className={styles.dateSection}>
                    <div className={styles.fieldLabel}>
                      <IconCalendar size={16} className={styles.fieldLabelIcon} />
                      Preferred Date
                    </div>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleDateChange}
                      min={today}
                      className={`${styles.dateInput} ${errors.date ? styles.formInputError : ''}`}
                    />
                    {errors.date && <p className={styles.fieldError}>{errors.date}</p>}
                    {dayWarning && (
                      <div className={styles.dayWarning}>
                        <IconAlertCircle size={14} />
                        {dayWarning}
                      </div>
                    )}
                  </div>

                  <div className={styles.timeSection}>
                    <div className={styles.fieldLabel}>
                      <IconClock size={16} className={styles.fieldLabelIcon} />
                      Preferred Time
                    </div>
                    <div className={styles.timeGrid}>
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot.value}
                          type="button"
                          className={`${styles.timeSlot} ${form.time === slot.value ? styles.timeSlotActive : ''}`}
                          onClick={() => { setForm(prev => ({ ...prev, time: slot.value })); setErrors(prev => ({ ...prev, time: '' })); }}
                        >
                          <span className={styles.timeSlotLabel}>{slot.label}</span>
                        </button>
                      ))}
                    </div>
                    {errors.time && <p className={styles.fieldError}>{errors.time}</p>}
                  </div>
                </div>
              )}

              {/* ──── STEP 2: Party Details ──── */}
              {step === 2 && (
                <div className={styles.step} key="step2">
                  <div className={styles.partySizeSection}>
                    <div className={styles.fieldLabel}>
                      <IconUsers size={16} className={styles.fieldLabelIcon} />
                      Party Size
                    </div>
                    <div className={styles.partySizeGrid}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          className={`${styles.partySizeBtn} ${form.partySize === String(n) ? styles.partySizeBtnActive : ''}`}
                          onClick={() => setForm(prev => ({ ...prev, partySize: String(n) }))}
                        >
                          <span className={styles.partySizeNum}>{n}</span>
                          <span className={styles.partySizeLabel}>{n === 1 ? 'Guest' : 'Guests'}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className={`${styles.partySizeLarge} ${parseInt(form.partySize) > 10 ? styles.partySizeLargeActive : ''}`}
                        onClick={() => setForm(prev => ({ ...prev, partySize: '12' }))}
                      >
                        <IconUsers size={14} />
                        11+ Guests
                      </button>
                    </div>
                  </div>

                  <div className={styles.occasionSection}>
                    <div className={styles.fieldLabel}>
                      <IconSparkles size={16} className={styles.fieldLabelIcon} />
                      Occasion <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 4 }}>(optional)</span>
                    </div>
                    <div className={styles.occasionGrid}>
                      {OCCASIONS.map(occ => (
                        <button
                          key={occ.value}
                          type="button"
                          className={`${styles.occasionCard} ${form.occasion === occ.value ? styles.occasionCardActive : ''}`}
                          onClick={() => setForm(prev => ({ ...prev, occasion: prev.occasion === occ.value ? '' : occ.value }))}
                        >
                          <div className={styles.occasionIcon}>
                            <occ.Icon size={18} />
                          </div>
                          <span className={styles.occasionLabel}>{occ.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.seatingSection}>
                    <div className={styles.fieldLabel}>
                      <IconWine size={16} className={styles.fieldLabelIcon} />
                      Seating Preference
                    </div>
                    <div className={styles.seatingGrid}>
                      {SEATING.map(seat => (
                        <button
                          key={seat}
                          type="button"
                          className={`${styles.seatingBtn} ${form.seating === seat ? styles.seatingBtnActive : ''}`}
                          onClick={() => setForm(prev => ({ ...prev, seating: seat }))}
                        >
                          {seat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ──── STEP 3: Guest Information ──── */}
              {step === 3 && (
                <div className={styles.step} key="step3">
                  <div className={styles.guestSection}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="reserve-name">
                          <IconUserCircle size={14} className={styles.formLabelIcon} />
                          Full Name *
                        </label>
                        <input
                          id="reserve-name"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          className={`${styles.formInput} ${errors.name ? styles.formInputError : ''}`}
                        />
                        {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
                      </div>

                      <div className={styles.formGridRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel} htmlFor="reserve-email">
                            <IconMail size={14} className={styles.formLabelIcon} />
                            Email *
                          </label>
                          <input
                            id="reserve-email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@email.com"
                            className={`${styles.formInput} ${errors.email ? styles.formInputError : ''}`}
                          />
                          {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel} htmlFor="reserve-phone">
                            <IconPhone size={14} className={styles.formLabelIcon} />
                            Phone *
                          </label>
                          <input
                            id="reserve-phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handlePhoneChange}
                            placeholder="705-555-0000"
                            className={`${styles.formInput} ${errors.phone ? styles.formInputError : ''}`}
                          />
                          {errors.phone && <p className={styles.fieldError}>{errors.phone}</p>}
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="reserve-notes">
                          <IconUtensils size={14} className={styles.formLabelIcon} />
                          Special Requests
                        </label>
                        <textarea
                          id="reserve-notes"
                          name="notes"
                          value={form.notes}
                          onChange={handleChange}
                          placeholder="Allergies, dietary restrictions, special arrangements..."
                          className={styles.formTextarea}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className={styles.dietarySection}>
                      <div className={styles.fieldLabel}>
                        <IconAlertCircle size={14} className={styles.fieldLabelIcon} />
                        Dietary Requirements <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 4 }}>(optional)</span>
                      </div>
                      <div className={styles.dietaryTags}>
                        {DIETARY.map(item => (
                          <button
                            key={item}
                            type="button"
                            className={`${styles.dietaryTag} ${form.dietary.includes(item) ? styles.dietaryTagActive : ''}`}
                            onClick={() => toggleDietary(item)}
                          >
                            {form.dietary.includes(item) && <IconCheck size={12} />} {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Form Actions ── */}
            <div className={styles.formActions}>
              {step > 1 && (
                <button type="button" className={styles.btnBack} onClick={goBack}>
                  <IconChevronLeft size={16} />
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  className={styles.btnNext}
                  onClick={goNext}
                  disabled={step === 1 && (!form.date || !form.time)}
                >
                  Continue
                  <IconChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.btnSubmit}
                  onClick={handleSubmit}
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? (
                    <>
                      <span className={styles.spinner} />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <IconSparkles size={16} />
                      Request Reservation
                    </>
                  )}
                </button>
              )}
            </div>

            {status === 'error' && (
              <p className={styles.error}>
                Something went wrong. Please try again or call us at 705-255-0161.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
