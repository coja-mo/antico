'use client';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { IconChevronLeft, IconChevronRight } from '@/components/Icons';
import styles from './Calendar.module.css';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Antico is open Wed-Sat (3,4,5,6)
const OPEN_DAYS = new Set([3, 4, 5, 6]);

export default function Calendar({ value, onChange, minDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = minDate ? new Date(minDate + 'T00:00:00') : today;

  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00');
      return d.getFullYear();
    }
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00');
      return d.getMonth();
    }
    return today.getMonth();
  });

  const prevMonth = useCallback(() => {
    setViewMonth(prev => {
      if (prev === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(prev => {
      if (prev === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  // Can we go back?
  const canGoPrev = useMemo(() => {
    return viewYear > min.getFullYear() || (viewYear === min.getFullYear() && viewMonth > min.getMonth());
  }, [viewYear, viewMonth, min]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    // Pad from previous month
    const prevLast = new Date(viewYear, viewMonth, 0);
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ day: prevLast.getDate() - i, inMonth: false, date: null });
    }

    // This month
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPast = date < today;
      const isOpen = OPEN_DAYS.has(date.getDay());
      const isToday = date.getTime() === today.getTime();
      const isSelected = value === dateStr;

      days.push({
        day: d,
        inMonth: true,
        date: dateStr,
        isPast,
        isOpen,
        isToday,
        isSelected,
        disabled: isPast,
      });
    }

    // Pad to fill last row
    const remainder = days.length % 7;
    if (remainder > 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        days.push({ day: i, inMonth: false, date: null });
      }
    }

    return days;
  }, [viewYear, viewMonth, value, today]);

  const handleSelect = useCallback((dateStr) => {
    if (!dateStr) return;
    onChange(dateStr);
  }, [onChange]);

  return (
    <div className={styles.calendar}>
      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          <IconChevronLeft size={16} />
        </button>
        <span className={styles.monthYear}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={nextMonth}
          aria-label="Next month"
        >
          <IconChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div className={styles.dayLabels}>
        {DAYS.map(d => (
          <span key={d} className={styles.dayLabel}>{d}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className={styles.dayGrid}>
        {calendarDays.map((cell, i) => {
          if (!cell.inMonth) {
            return <span key={i} className={styles.dayOther}>{cell.day}</span>;
          }

          const classes = [styles.day];
          if (cell.isSelected) classes.push(styles.daySelected);
          if (cell.isToday && !cell.isSelected) classes.push(styles.dayToday);
          if (cell.disabled) classes.push(styles.dayDisabled);
          if (!cell.isOpen && !cell.disabled) classes.push(styles.dayClosed);

          return (
            <button
              key={i}
              type="button"
              className={classes.join(' ')}
              onClick={() => !cell.disabled && handleSelect(cell.date)}
              disabled={cell.disabled}
              title={!cell.isOpen && !cell.disabled ? 'Closed this day (request anyway)' : undefined}
            >
              {cell.day}
              {cell.isOpen && !cell.disabled && <span className={styles.openDot} />}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} /> Open night
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDotClosed} /> Closed (can still request)
        </span>
      </div>
    </div>
  );
}
