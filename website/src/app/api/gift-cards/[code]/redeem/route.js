import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * POST — Redeem (deduct) from gift card balance.
 * 
 * CRITICAL: This is the most security-sensitive endpoint.
 * Uses an SQLite transaction to ensure atomicity — if any step fails,
 * zero changes are committed. Prevents double-spend race conditions.
 */
export async function POST(request, { params }) {
  const db = getDb();
  try {
    const { code } = await params;
    const body = await request.json();
    const { amount, order_id, performed_by } = body;

    // ── Input validation ──
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid redemption amount' }, { status: 400 });
    }
    const requestedAmount = Math.round(parsedAmount * 100) / 100;

    // Normalize the code (strip dashes, uppercase)
    const normalizedCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase().trim();
    if (normalizedCode.length !== 16) {
      return NextResponse.json({ error: 'Invalid gift card code format' }, { status: 400 });
    }
    const formattedCode = normalizedCode.match(/.{1,4}/g).join('-');

    // ── Atomic redemption transaction ──
    // Everything inside this block succeeds or fails together.
    // SQLite transactions are serialized, so this prevents race conditions.
    const redeemTransaction = db.transaction(() => {
      // Re-read the card INSIDE the transaction for consistency
      const card = db.prepare('SELECT * FROM gift_cards WHERE code = ?').get(formattedCode);

      if (!card) {
        return { error: 'Gift card not found', status: 404 };
      }
      if (card.status !== 'active') {
        return { error: `Gift card is ${card.status}`, status: 400 };
      }
      if (card.balance <= 0) {
        return { error: 'Gift card has no remaining balance', status: 400 };
      }

      // Deduct up to available balance (partial redemption OK)
      const redeemAmount = Math.min(requestedAmount, card.balance);
      const newBalance = Math.round((card.balance - redeemAmount) * 100) / 100;
      const newStatus = newBalance <= 0 ? 'depleted' : 'active';

      // Update card balance + status + last_used timestamp
      db.prepare(`
        UPDATE gift_cards 
        SET balance = ?, status = ?, last_used_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND balance = ?
      `).run(newBalance, newStatus, card.id, card.balance);
      // ↑ The "AND balance = ?" is a secondary guard: if balance changed between
      // the SELECT and this UPDATE (shouldn't happen in SQLite transaction, but defense-in-depth),
      // this will affect 0 rows.

      // Verify the update actually took effect
      const verify = db.prepare('SELECT balance, status FROM gift_cards WHERE id = ?').get(card.id);
      if (verify.balance !== newBalance) {
        throw new Error('Balance verification failed — concurrent modification detected');
      }

      // Record the transaction in the audit log
      db.prepare(`
        INSERT INTO gift_card_transactions 
        (gift_card_id, type, amount, balance_after, order_id, description, performed_by)
        VALUES (?, 'redemption', ?, ?, ?, ?, ?)
      `).run(
        card.id,
        -redeemAmount,
        newBalance,
        order_id || null,
        `Redeemed $${redeemAmount.toFixed(2)} at POS`,
        performed_by || 'POS'
      );

      return {
        success: true,
        redeemed: redeemAmount,
        remaining_balance: newBalance,
        card_status: newStatus,
        card_code: card.code,
        card_id: card.id,
        transaction_order_id: order_id || null,
      };
    });

    const result = redeemTransaction();

    // Check if the transaction returned an error
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    console.log(`[GIFT-CARD REDEEMED] Code: ${formattedCode}, Amount: $${result.redeemed.toFixed(2)}, Remaining: $${result.remaining_balance.toFixed(2)}, Order: ${order_id || 'N/A'}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GIFT-CARD REDEEM] CRITICAL ERROR:', error);
    return NextResponse.json({ error: 'Redemption failed. Gift card balance was NOT modified. Please try again.' }, { status: 500 });
  }
}
