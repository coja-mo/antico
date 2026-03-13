import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getStaffFromSession, gcPurchaseLimiter, getClientKey } from '@/lib/auth';

/**
 * Generate a cryptographically secure, unique gift card code.
 * Format: XXXX-XXXX-XXXX-XXXX (no ambiguous chars: 0/O, 1/I/L)
 * Retries up to 10 times to guarantee uniqueness.
 */
function generateUniqueCode(db) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = crypto.randomBytes(16);
    let code = '';
    for (let i = 0; i < 16; i++) {
      code += chars[bytes[i] % chars.length];
    }
    const formatted = code.match(/.{1,4}/g).join('-');
    const exists = db.prepare('SELECT id FROM gift_cards WHERE code = ?').get(formatted);
    if (!exists) return formatted;
  }
  throw new Error('Failed to generate unique gift card code after 10 attempts');
}

// GET — list all gift cards (ADMIN ONLY — requires staff session)
export async function GET(request) {
  try {
    // ── Admin auth check ──
    const staff = await getStaffFromSession();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized — admin login required' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = 'SELECT * FROM gift_cards';
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('(code LIKE ? OR recipient_name LIKE ? OR sender_name LIKE ? OR recipient_email LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const cards = db.prepare(query).all(...params);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(initial_amount) as total_sold,
        SUM(balance) as outstanding_balance,
        SUM(CASE WHEN status = 'depleted' THEN 1 ELSE 0 END) as depleted_count
      FROM gift_cards
    `).get();

    return NextResponse.json({ cards, stats });
  } catch (error) {
    console.error('[GIFT-CARDS GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 });
  }
}

// POST — create / purchase a new gift card (public)
export async function POST(request) {
  const db = getDb();
  try {
    // ── Rate limiting ──
    const clientKey = getClientKey(request);
    if (gcPurchaseLimiter.isLimited(clientKey)) {
      return NextResponse.json({ error: 'Too many purchase attempts. Please wait a minute.' }, { status: 429 });
    }

    const body = await request.json();
    const {
      amount,
      sender_name,
      sender_email,
      recipient_name,
      recipient_email,
      recipient_phone,
      delivery_method = 'email',
      personal_message,
    } = body;

    // ── Validation ──
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 5 || parsedAmount > 1000) {
      return NextResponse.json({ error: 'Amount must be between $5 and $1,000' }, { status: 400 });
    }
    const finalAmount = Math.round(parsedAmount * 100) / 100;

    if (!recipient_name || recipient_name.trim().length === 0) {
      return NextResponse.json({ error: 'Recipient name is required' }, { status: 400 });
    }

    if (delivery_method === 'email' && (!recipient_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email))) {
      return NextResponse.json({ error: 'Valid recipient email is required for email delivery' }, { status: 400 });
    }

    if (delivery_method === 'text' && (!recipient_phone || recipient_phone.replace(/\D/g, '').length < 10)) {
      return NextResponse.json({ error: 'Valid recipient phone number is required for text delivery' }, { status: 400 });
    }

    if (personal_message && personal_message.length > 500) {
      return NextResponse.json({ error: 'Personal message must be under 500 characters' }, { status: 400 });
    }

    // ── Expiration: default 2 years from now ──
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 2);
    const expiresAtStr = expiresAt.toISOString();

    // ── Atomic creation ──
    const code = generateUniqueCode(db);

    const createCard = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO gift_cards (code, initial_amount, balance, sender_name, sender_email,
          recipient_name, recipient_email, recipient_phone, delivery_method, personal_message, status, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `).run(
        code, finalAmount, finalAmount,
        (sender_name || '').trim() || null,
        (sender_email || '').trim().toLowerCase() || null,
        recipient_name.trim(),
        (recipient_email || '').trim().toLowerCase() || null,
        (recipient_phone || '').trim() || null,
        delivery_method,
        (personal_message || '').trim() || null,
        expiresAtStr
      );

      db.prepare(`
        INSERT INTO gift_card_transactions (gift_card_id, type, amount, balance_after, description, performed_by)
        VALUES (?, 'purchase', ?, ?, 'Gift card purchased', 'customer')
      `).run(result.lastInsertRowid, finalAmount, finalAmount);

      return db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(result.lastInsertRowid);
    });

    const card = createCard();
    console.log(`[GIFT-CARD CREATED] Code: ${card.code}, Amount: $${card.initial_amount.toFixed(2)}, Recipient: ${card.recipient_name}, Expires: ${expiresAtStr}`);

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('[GIFT-CARDS POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create gift card. Please try again.' }, { status: 500 });
  }
}
