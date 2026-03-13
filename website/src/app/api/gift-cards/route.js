import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Format as XXXX-XXXX-XXXX-XXXX
  return code.match(/.{1,4}/g).join('-');
}

// GET — list all gift cards (admin)
export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = 'SELECT * FROM gift_cards';
    const params = [];
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const cards = db.prepare(query).all(...params);
    return NextResponse.json(cards);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — create / purchase a new gift card
export async function POST(request) {
  try {
    const db = getDb();
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

    if (!amount || amount < 5 || amount > 1000) {
      return NextResponse.json({ error: 'Amount must be between $5 and $1,000' }, { status: 400 });
    }

    const code = generateCode();

    const result = db.prepare(`
      INSERT INTO gift_cards (code, initial_amount, balance, sender_name, sender_email,
        recipient_name, recipient_email, recipient_phone, delivery_method, personal_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code, amount, amount,
      sender_name || null, sender_email || null,
      recipient_name || null, recipient_email || null, recipient_phone || null,
      delivery_method, personal_message || null
    );

    // Record the initial purchase transaction
    db.prepare(`
      INSERT INTO gift_card_transactions (gift_card_id, type, amount, balance_after, description)
      VALUES (?, 'purchase', ?, ?, 'Gift card purchased')
    `).run(result.lastInsertRowid, amount, amount);

    const card = db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
