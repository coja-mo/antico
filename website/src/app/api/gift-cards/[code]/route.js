import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Normalize a gift card code: strip non-alphanumeric, uppercase,
 * and re-format as XXXX-XXXX-XXXX-XXXX.
 */
function normalizeCode(raw) {
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().trim();
  if (clean.length !== 16) return null;
  return clean.match(/.{1,4}/g).join('-');
}

// GET — look up a gift card by code (returns card + transaction history)
export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { code } = await params;
    const normalizedCode = normalizeCode(code);

    if (!normalizedCode) {
      return NextResponse.json({ error: 'Invalid gift card code format' }, { status: 400 });
    }

    const card = db.prepare('SELECT * FROM gift_cards WHERE code = ?').get(normalizedCode);
    if (!card) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    const transactions = db.prepare(
      'SELECT * FROM gift_card_transactions WHERE gift_card_id = ? ORDER BY created_at DESC'
    ).all(card.id);

    // Verify balance integrity: initial_amount - sum of debits should equal current balance
    const txSum = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const expectedBalance = Math.round(txSum * 100) / 100;
    if (Math.abs(expectedBalance - card.balance) > 0.01) {
      console.error(`[GIFT-CARD INTEGRITY] Balance mismatch for ${card.code}: stored=${card.balance}, computed=${expectedBalance}`);
    }

    return NextResponse.json({
      ...card,
      transactions,
      _balance_verified: Math.abs(expectedBalance - card.balance) < 0.01,
    });
  } catch (error) {
    console.error('[GIFT-CARD GET] Error:', error);
    return NextResponse.json({ error: 'Failed to look up gift card' }, { status: 500 });
  }
}

// PATCH — update gift card (link to customer, deactivate/reactivate, reload balance)
export async function PATCH(request, { params }) {
  const db = getDb();
  try {
    const { code } = await params;
    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
      return NextResponse.json({ error: 'Invalid gift card code format' }, { status: 400 });
    }

    const body = await request.json();
    const card = db.prepare('SELECT * FROM gift_cards WHERE code = ?').get(normalizedCode);
    if (!card) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    // Use a transaction for multi-step updates
    const updateCard = db.transaction(() => {
      // Link to customer account
      if (body.customer_account_id !== undefined) {
        db.prepare('UPDATE gift_cards SET customer_account_id = ? WHERE id = ?')
          .run(body.customer_account_id, card.id);
      }

      // Status change (deactivate/reactivate) — with logging
      if (body.status && ['active', 'inactive', 'depleted'].includes(body.status)) {
        const oldStatus = card.status;
        db.prepare('UPDATE gift_cards SET status = ? WHERE id = ?')
          .run(body.status, card.id);

        // Log status changes
        db.prepare(`
          INSERT INTO gift_card_transactions (gift_card_id, type, amount, balance_after, description, performed_by)
          VALUES (?, 'status_change', 0, ?, ?, ?)
        `).run(card.id, card.balance, `Status: ${oldStatus} → ${body.status}`, body.performed_by || 'admin');

        console.log(`[GIFT-CARD STATUS] ${card.code}: ${oldStatus} → ${body.status} by ${body.performed_by || 'admin'}`);
      }

      // Reload / add balance — with amount validation
      if (body.reload_amount) {
        const reloadAmt = parseFloat(body.reload_amount);
        if (isNaN(reloadAmt) || reloadAmt <= 0 || reloadAmt > 1000) {
          throw new Error('Reload amount must be between $0.01 and $1,000');
        }
        const roundedReload = Math.round(reloadAmt * 100) / 100;
        const newBalance = Math.round((card.balance + roundedReload) * 100) / 100;

        db.prepare('UPDATE gift_cards SET balance = ?, status = ? WHERE id = ?')
          .run(newBalance, 'active', card.id); // Reloading always reactivates

        db.prepare(`
          INSERT INTO gift_card_transactions (gift_card_id, type, amount, balance_after, description, performed_by)
          VALUES (?, 'reload', ?, ?, 'Balance reload', ?)
        `).run(card.id, roundedReload, newBalance, body.performed_by || 'admin');

        console.log(`[GIFT-CARD RELOAD] ${card.code}: +$${roundedReload.toFixed(2)}, new balance: $${newBalance.toFixed(2)}`);
      }

      return db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(card.id);
    });

    const updated = updateCard();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[GIFT-CARD PATCH] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update gift card' }, { status: 500 });
  }
}
