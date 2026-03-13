import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Extract customer ID from auth cookie.
 * Returns null if not authenticated.
 */
async function getCustomerId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('antico_customer')?.value;
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const parts = decoded.split(':');
    if (parts[0] !== 'customer') return null;
    const id = parseInt(parts[1]);
    if (isNaN(id) || id <= 0) return null;
    return id;
  } catch {
    return null;
  }
}

/**
 * Normalize a gift card code for lookup.
 */
function normalizeCode(raw) {
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().trim();
  if (clean.length !== 16) return null;
  return clean.match(/.{1,4}/g).join('-');
}

// GET — list gift cards linked to the logged-in customer
export async function GET() {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDb();
    
    // Verify customer exists
    const customer = db.prepare('SELECT id FROM customer_accounts WHERE id = ?').get(customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const cards = db.prepare(
      'SELECT id, code, initial_amount, balance, recipient_name, status, delivery_method, created_at, last_used_at FROM gift_cards WHERE customer_account_id = ? ORDER BY created_at DESC'
    ).all(customerId);

    return NextResponse.json(cards);
  } catch (error) {
    console.error('[CUSTOMER GIFT-CARDS GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 });
  }
}

// POST — link a gift card to the customer's account by entering its code
export async function POST(request) {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDb();
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Gift card code is required' }, { status: 400 });
    }

    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
      return NextResponse.json({ error: 'Invalid gift card code format. Expected 16 characters.' }, { status: 400 });
    }

    // Verify customer exists
    const customer = db.prepare('SELECT id FROM customer_accounts WHERE id = ?').get(customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const card = db.prepare('SELECT * FROM gift_cards WHERE code = ?').get(normalizedCode);
    if (!card) {
      return NextResponse.json({ error: 'Gift card not found. Please check the code and try again.' }, { status: 404 });
    }

    // Already linked to this customer
    if (card.customer_account_id === customerId) {
      return NextResponse.json({ error: 'This gift card is already linked to your account' }, { status: 409 });
    }

    // Linked to someone else
    if (card.customer_account_id && card.customer_account_id !== customerId) {
      return NextResponse.json({ error: 'This gift card is already linked to another account' }, { status: 409 });
    }

    // Link the card
    db.prepare('UPDATE gift_cards SET customer_account_id = ? WHERE id = ?')
      .run(customerId, card.id);

    // Log the linking action
    db.prepare(`
      INSERT INTO gift_card_transactions (gift_card_id, type, amount, balance_after, description, performed_by)
      VALUES (?, 'account_link', 0, ?, 'Linked to customer account', ?)
    `).run(card.id, card.balance, `customer:${customerId}`);

    console.log(`[GIFT-CARD LINKED] Code: ${card.code} → Customer #${customerId}`);

    const updated = db.prepare(
      'SELECT id, code, initial_amount, balance, recipient_name, status, delivery_method, created_at, last_used_at FROM gift_cards WHERE id = ?'
    ).get(card.id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[CUSTOMER GIFT-CARDS POST] Error:', error);
    return NextResponse.json({ error: 'Failed to link gift card' }, { status: 500 });
  }
}
