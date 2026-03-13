import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET — look up a gift card by code
export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { code } = await params;

    const card = db.prepare('SELECT * FROM gift_cards WHERE code = ?').get(code);
    if (!card) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    const transactions = db.prepare(
      'SELECT * FROM gift_card_transactions WHERE gift_card_id = ? ORDER BY created_at DESC'
    ).all(card.id);

    return NextResponse.json({ ...card, transactions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — update gift card (link to customer, deactivate, reload)
export async function PATCH(request, { params }) {
  try {
    const db = getDb();
    const { code } = await params;
    const body = await request.json();

    const card = db.prepare('SELECT * FROM gift_cards WHERE code = ?').get(code);
    if (!card) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    // Link to customer account
    if (body.customer_account_id !== undefined) {
      db.prepare('UPDATE gift_cards SET customer_account_id = ? WHERE id = ?')
        .run(body.customer_account_id, card.id);
    }

    // Deactivate
    if (body.status) {
      db.prepare('UPDATE gift_cards SET status = ? WHERE id = ?')
        .run(body.status, card.id);
    }

    // Reload / add balance
    if (body.reload_amount && body.reload_amount > 0) {
      const newBalance = card.balance + body.reload_amount;
      db.prepare('UPDATE gift_cards SET balance = ? WHERE id = ?')
        .run(newBalance, card.id);
      db.prepare(`
        INSERT INTO gift_card_transactions (gift_card_id, type, amount, balance_after, description)
        VALUES (?, 'reload', ?, ?, 'Balance reload')
      `).run(card.id, body.reload_amount, newBalance);
    }

    const updated = db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(card.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
