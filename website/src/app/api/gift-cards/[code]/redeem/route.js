import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST — redeem (deduct) from gift card balance
export async function POST(request, { params }) {
  try {
    const db = getDb();
    const { code } = await params;
    const body = await request.json();
    const { amount, order_id, performed_by } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid redemption amount' }, { status: 400 });
    }

    const card = db.prepare('SELECT * FROM gift_cards WHERE code = ?').get(code);
    if (!card) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    if (card.status !== 'active') {
      return NextResponse.json({ error: 'Gift card is not active' }, { status: 400 });
    }

    if (card.balance <= 0) {
      return NextResponse.json({ error: 'Gift card has no remaining balance' }, { status: 400 });
    }

    // Deduct up to the available balance
    const redeemAmount = Math.min(amount, card.balance);
    const newBalance = Math.round((card.balance - redeemAmount) * 100) / 100;

    db.prepare('UPDATE gift_cards SET balance = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newBalance, card.id);

    // If balance hits zero, mark as depleted
    if (newBalance <= 0) {
      db.prepare("UPDATE gift_cards SET status = 'depleted' WHERE id = ?").run(card.id);
    }

    // Record transaction
    db.prepare(`
      INSERT INTO gift_card_transactions (gift_card_id, type, amount, balance_after, order_id, description, performed_by)
      VALUES (?, 'redemption', ?, ?, ?, ?, ?)
    `).run(card.id, -redeemAmount, newBalance, order_id || null,
      `Redeemed $${redeemAmount.toFixed(2)} at POS`, performed_by || 'POS');

    return NextResponse.json({
      success: true,
      redeemed: redeemAmount,
      remaining_balance: newBalance,
      card_status: newBalance <= 0 ? 'depleted' : 'active',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
